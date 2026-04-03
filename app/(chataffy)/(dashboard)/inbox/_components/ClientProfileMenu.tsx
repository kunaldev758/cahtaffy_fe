"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { User, LogOut, ChevronDown, CreditCard } from "lucide-react";
import { logoutApi } from '@/app/_api/dashboard/action';
import { dispatchAuthStorageSync } from '@/app/socketContext';
import { useRouter } from 'next/navigation';
import { updateClientStatus } from '@/app/_api/dashboard/action';
import { useSocket } from '@/app/socketContext';
import defaultImageImport from '@/images/default-image.png';

const defaultImage = (defaultImageImport as any).src || defaultImageImport;

function avatarSrc(path: string | null | undefined) {
  if (!path || path === 'null' || !String(path).trim()) return null;
  const p = String(path);
  if (p.startsWith('http')) return p;
  const base =
    process.env.NEXT_PUBLIC_API_HOST ||
    process.env.NEXT_PUBLIC_FILE_HOST ||
    'http://localhost:9001';
  return `${base}${p}`;
}

function ClientMenuAvatar({
  avatarUrl,
  displayName,
  sizePx,
  className,
}: {
  avatarUrl: string | null;
  displayName: string;
  sizePx: number;
  className?: string;
}) {
  return (
    <div
      className={`agent-avatar-wrapper rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0 ${className ?? ''}`}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={displayName}
          className="agent-avatar-img object-cover w-full h-full"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = defaultImage;
          }}
        />
      ) : (
        <Image
          src={defaultImage}
          alt={displayName}
          width={sizePx}
          height={sizePx}
          className="agent-avatar-img object-cover w-full h-full"
        />
      )}
    </div>
  );
}

interface ClientProfileMenuProps {
  clientEmail?: string;
  clientId?: string;
  isActive?: boolean;
  clientName?: string;
  /** Stored path or URL from clientAgent.avatar */
  clientAvatar?: string | null;
}

export default function ClientProfileMenu({
  clientEmail,
  clientId,
  isActive = true,
  clientName,
  clientAvatar,
}: ClientProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(isActive);
  const [isUpdating, setIsUpdating] = useState(false);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  /** Set by socket / client-profile-updated when sidebar props are stale */
  const [menuName, setMenuName] = useState<string | null>(null);
  const [menuEmail, setMenuEmail] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { socket } = useSocket();

  useEffect(() => {
    if (clientAvatar !== undefined) {
      setAvatarPath(clientAvatar && String(clientAvatar).trim() ? String(clientAvatar) : null);
    }
  }, [clientAvatar]);

  useEffect(() => {
    if (clientName != null && menuName != null && clientName === menuName) {
      setMenuName(null);
    }
  }, [clientName, menuName]);

  useEffect(() => {
    if (clientEmail != null && menuEmail != null && clientEmail === menuEmail) {
      setMenuEmail(null);
    }
  }, [clientEmail, menuEmail]);

  useEffect(() => {
    const readLocal = () => {
      try {
        const raw = localStorage.getItem('clientAgent');
        if (!raw) return;
        const p = JSON.parse(raw);
        if (p.avatar && String(p.avatar).trim()) {
          setAvatarPath((prev) => prev ?? String(p.avatar));
        }
      } catch {
        /* ignore */
      }
    };
    readLocal();
    const onProfile = (e: Event) => {
      const d = (e as CustomEvent<{ name?: string; email?: string; avatar?: string | null }>).detail;
      if (d?.name !== undefined) {
        setMenuName(d.name && String(d.name).trim() ? String(d.name) : null);
      }
      if (d?.email !== undefined) {
        setMenuEmail(d.email && String(d.email).trim() ? String(d.email).toLowerCase() : null);
      }
      if (d?.avatar !== undefined) {
        setAvatarPath(d.avatar && String(d.avatar).trim() ? String(d.avatar) : null);
      }
    };
    window.addEventListener('client-profile-updated', onProfile);
    return () => window.removeEventListener('client-profile-updated', onProfile);
  }, []);

  useEffect(() => {
    if (isActive !== undefined) {
      setIsOnline(isActive);
    }
  }, [isActive]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const clientData = localStorage.getItem('client');
      if (clientData) {
        try {
          const parsedClient = JSON.parse(clientData);
          if (isActive === undefined) {
            setIsOnline(parsedClient.isActive !== false);
          }
        } catch { }
      }
    }
  }, [isActive]);

  const applyClientStatusFromPayload = useCallback(
    (updatedClient: any) => {
      if (!updatedClient || updatedClient.isClient === false) return;
      try {
        const raw = localStorage.getItem('clientAgent');
        const parsed = raw ? JSON.parse(raw) : {};
        const myId = clientId ? String(clientId) : parsed._id ? String(parsed._id) : null;
        if (updatedClient._id && myId && String(updatedClient._id) !== myId) return;
      } catch {
        return;
      }
      setIsOnline(updatedClient.isActive !== false);
      if (typeof window === 'undefined') return;
      try {
        const raw = localStorage.getItem('clientAgent');
        const base = raw ? JSON.parse(raw) : {};
        const merged = {
          ...base,
          ...updatedClient,
          isActive: updatedClient.isActive,
          lastActive: updatedClient.lastActive,
        };
        localStorage.setItem('clientAgent', JSON.stringify(merged));
        window.dispatchEvent(new CustomEvent('client-status-changed', { detail: merged }));
        const clientData = localStorage.getItem('client');
        if (clientData) {
          try {
            const parsedClient = JSON.parse(clientData);
            localStorage.setItem(
              'client',
              JSON.stringify({
                ...parsedClient,
                isActive: updatedClient.isActive,
                lastActive: updatedClient.lastActive,
              })
            );
          } catch { }
        }
      } catch {
        /* ignore */
      }
    },
    [clientId]
  );

  useEffect(() => {
    if (!socket) return;

    const handleAgentStatusForClient = (data: any) => {
      if (data?.isClient) applyClientStatusFromPayload(data);
    };

    const handleClientProfileUpdated = (data: {
      name?: string;
      email?: string;
      avatar?: string | null;
      phone?: string;
    }) => {
      if (data.name !== undefined) {
        setMenuName(data.name && String(data.name).trim() ? String(data.name) : null);
      }
      if (data.email !== undefined) {
        setMenuEmail(data.email && String(data.email).trim() ? String(data.email).toLowerCase() : null);
      }
      if (data.avatar !== undefined) {
        setAvatarPath(
          data.avatar && String(data.avatar).trim() ? String(data.avatar) : null
        );
      }
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('clientAgent');
          const base = raw ? JSON.parse(raw) : {};
          const next = {
            ...base,
            ...(data.name !== undefined && { name: data.name }),
            ...(data.email !== undefined && { email: data.email }),
            ...(data.avatar !== undefined && { avatar: data.avatar }),
          };
          localStorage.setItem('clientAgent', JSON.stringify(next));
        } catch {
          /* ignore */
        }
      }
    };

    socket.on('client-status-updated', applyClientStatusFromPayload);
    socket.on('agent-status-updated', handleAgentStatusForClient);
    socket.on('client-profile-updated', handleClientProfileUpdated);
    return () => {
      socket.off('client-status-updated', applyClientStatusFromPayload);
      socket.off('agent-status-updated', handleAgentStatusForClient);
      socket.off('client-profile-updated', handleClientProfileUpdated);
    };
  }, [socket, applyClientStatusFromPayload]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggleStatus = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    const newStatus = !isOnline;

    try {
      const response = await updateClientStatus(newStatus);
      if (response === 'error' || (response && response.status_code !== 200)) {
        throw new Error(response?.message || 'Failed to update client status');
      }
      // State + localStorage come from server via response.agent (same payload as socket) and client-status-updated
      if (response && typeof response === 'object' && 'agent' in response && response.agent) {
        applyClientStatusFromPayload(response.agent);
        if (typeof window !== 'undefined') {
          const agentData = localStorage.getItem('agent');
          if (agentData) {
            try {
              const parsedAgent = JSON.parse(agentData);
              if (parsedAgent.isClient) {
                localStorage.setItem('agent', JSON.stringify({ ...parsedAgent, ...response.agent }));
              }
            } catch { }
          }
        }
      }
    } catch {
      setIsOnline(!newStatus);
      alert('Failed to update status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch { }
    localStorage.clear();
    dispatchAuthStorageSync();
    router.replace('/login');
  };

  const displayEmail =
    menuEmail ??
    clientEmail ??
    (typeof window !== 'undefined'
      ? (() => {
        try {
          const clientData = localStorage.getItem('client');
          if (clientData) return JSON.parse(clientData).email || '';
          const userData = localStorage.getItem('user');
          if (userData) return JSON.parse(userData).email || '';
        } catch { }
        return '';
      })()
      : '');

  const displayName =
    menuName ??
    clientName ??
    (displayEmail ? displayEmail.split('@')[0] : 'Agent');
  const displayAvatarUrl = avatarSrc(avatarPath);

  return (
    <div className="relative" ref={menuRef}>
      {/* Agent card trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full bg-white rounded-2xl shadow-[0px_4px_20px_0px_rgba(0,0,0,0.02)] p-[16px] transition-colors duration-150 group">
        <ClientMenuAvatar
          avatarUrl={displayAvatarUrl}
          displayName={displayName}
          sizePx={36}
          className="w-9 h-9"
        />
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
          <p className="text-xs text-[#94A3B8] truncate">Free Plan</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden w-[250px]">
          {/* Profile header */}
          <div className="py-[16px] text-center border-b border-gray-100">
            <div className="mx-auto mb-[12px] flex justify-center">
              <ClientMenuAvatar
                avatarUrl={displayAvatarUrl}
                displayName={displayName}
                sizePx={56}
                className="w-14 h-14"
              />
            </div>
            <p className="text-[14px] font-semibold text-[#111827] truncate px-[20px]">{displayName}</p>
            <p className="text-[13px] text-[#64748B] mt-0.5 truncate px-[20px]">{displayEmail || 'No email'}</p>
          </div>

          {/* Accept Chats toggle */}
          <div className="px-[16px] py-[12px] border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'bg-green-500' : 'bg-[#FF6D6D]'}`} />
                <span className="text-sm font-medium text-gray-700">Accept Chats</span>
              </div>
              <label className={`toggle ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  className="toggle-checkbox"
                  type="checkbox"
                  checked={isOnline}
                  onChange={handleToggleStatus}
                  disabled={isUpdating}
                />
                <div className="toggle-switch" />
              </label>
            </div>
          </div>

          {/* Menu items */}
          <div className="space-y-0.5">
            <button
              className="flex items-center gap-[12px] w-full px-[16px] py-[12px] text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-150"
            >
              <span className="material-symbols-outlined text-[#64748B] !text-[20px]">
                receipt_long
              </span>
              Billing
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                router.push('/profile')
              }}
              className="flex items-center gap-[12px] w-full px-[16px] py-[12px] text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-150"
            >
              <span className="material-symbols-outlined text-[#64748B] !text-[20px]">
                person
              </span>
              Profile
            </button>
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="flex items-center gap-[12px] w-full px-[16px] py-[12px] text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-150 justify-center"
            >
              <span className="material-symbols-outlined !text-[20px]">
                logout
              </span>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
