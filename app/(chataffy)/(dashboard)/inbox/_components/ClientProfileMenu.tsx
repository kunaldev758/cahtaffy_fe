"use client";
import { useState, useEffect, useRef } from "react";
import { User, LogOut, ChevronDown, CreditCard } from "lucide-react";
import { logoutApi } from '@/app/_api/dashboard/action';
import { useRouter } from 'next/navigation';
import { updateClientStatus } from '@/app/_api/dashboard/action';
import { useSocket } from '@/app/socketContext';

interface ClientProfileMenuProps {
  clientEmail?: string;
  clientId?: string;
  isActive?: boolean;
  clientName?: string;
}

export default function ClientProfileMenu({
  clientEmail,
  clientId,
  isActive = true,
  clientName,
}: ClientProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(isActive);
  const [isUpdating, setIsUpdating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { socket } = useSocket();

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
        } catch {}
      }
    }
  }, [isActive]);

  useEffect(() => {
    if (!socket) return;

    const handleClientStatusUpdate = (updatedClient: any) => {
      setIsOnline(updatedClient.isActive !== false);
      if (typeof window !== 'undefined') {
        const clientData = localStorage.getItem('client');
        if (clientData) {
          try {
            const parsedClient = JSON.parse(clientData);
            const updatedClientData = {
              ...parsedClient,
              isActive: updatedClient.isActive,
              lastActive: updatedClient.lastActive,
            };
            localStorage.setItem('client', JSON.stringify(updatedClientData));
          } catch {}
        }
      }
    };

    socket.on('client-status-updated', handleClientStatusUpdate);
    return () => {
      socket.off('client-status-updated', handleClientStatusUpdate);
    };
  }, [socket]);

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
      setIsOnline(newStatus);
      if (typeof window !== 'undefined') {
        const clientData = localStorage.getItem('client');
        if (clientData) {
          try {
            const parsedClient = JSON.parse(clientData);
            const updatedClientData = {
              ...parsedClient,
              isActive: newStatus,
              lastActive: newStatus ? new Date().toISOString() : parsedClient.lastActive,
            };
            localStorage.setItem('client', JSON.stringify(updatedClientData));
            window.dispatchEvent(new CustomEvent('client-status-changed', { detail: updatedClientData }));
          } catch {}
        } else if (response && response.agent) {
          localStorage.setItem('clientAgent', JSON.stringify(response.agent));
          const agentData = localStorage.getItem('agent');
          if (agentData) {
            try {
              const parsedAgent = JSON.parse(agentData);
              if (parsedAgent.isClient) {
                localStorage.setItem('agent', JSON.stringify({ ...parsedAgent, ...response.agent }));
              }
            } catch {}
          }
          window.dispatchEvent(new CustomEvent('client-status-changed', { detail: response.agent }));
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
    } catch {}
    localStorage.clear();
    router.replace('/login');
  };

  const displayEmail = clientEmail || (typeof window !== 'undefined'
    ? (() => {
        try {
          const clientData = localStorage.getItem('client');
          if (clientData) return JSON.parse(clientData).email || '';
          const userData = localStorage.getItem('user');
          if (userData) return JSON.parse(userData).email || '';
        } catch {}
        return '';
      })()
    : '');

  const displayName = clientName || (displayEmail ? displayEmail.split('@')[0] : 'Agent');

  return (
    <div className="relative" ref={menuRef}>
      {/* Agent card trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full px-2 py-2 rounded-xl hover:bg-gray-100 transition-colors duration-150 group"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
          <p className="text-xs text-[#94A3B8] truncate">Free Plan</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Profile header */}
          <div className="px-5 pt-5 pb-4 text-center border-b border-gray-100">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto mb-3">
              <User className="w-7 h-7 text-white" />
            </div>
            <p className="text-sm font-bold text-gray-900">{displayName}</p>
            <p className="text-xs text-[#94A3B8] mt-0.5">{displayEmail || 'No email'}</p>
          </div>

          {/* Accept Chats toggle */}
          <div className="px-5 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-sm font-medium text-gray-700">Accept Chats</span>
              </div>
              <button
                onClick={handleToggleStatus}
                disabled={isUpdating}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  isOnline ? 'bg-green-500' : 'bg-gray-200'
                } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                    isOnline ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Menu items */}
          <div className="px-3 py-2 space-y-0.5">
            <button
              className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-150"
            >
              <CreditCard className="w-4 h-4 text-[#64748B]" />
              Billing
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                router.push('/profile')
              }}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-150"
            >
              <User className="w-4 h-4 text-[#64748B]" />
              Profile
            </button>
          </div>

          {/* Logout */}
          <div className="px-3 pb-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-150"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
