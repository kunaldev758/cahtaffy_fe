// app/agent-inbox/_components/agent-sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  LogOut,
  Menu,
  X,
  Edit3,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import { toggleActiveStatus, logoutApi } from "@/app/_api/dashboard/action";
import AgentEditProfileModal, { type AgentEditProfileAgent } from "./AgentEditProfileModal";
import { dispatchAuthStorageSync } from "@/app/socketContext";
import { useSocket } from "@/app/socketContext";
import Image from "next/image";
import defaultImageImport from '@/images/default-image.png';

const defaultImage = (defaultImageImport as any).src || defaultImageImport;

interface Agent {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  status: string;
  avatar?: string;
}

export default function AgentSidebar() {
  const { socket } = useSocket();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const router = useRouter();

  const [agent, setAgent] = useState<Agent | null>(null);

  // Read agent from localStorage and re-read when socketContext syncs after admin edits
  useEffect(() => {
    const refreshAgentFromStorage = () => {
      try {
        const agentData = localStorage.getItem('agent');
        const parsedAgent = agentData ? JSON.parse(agentData) : null;
        setAgent(parsedAgent);
      } catch {
        setAgent(null);
      }
    };
    refreshAgentFromStorage();
    window.addEventListener('agent-status-updated', refreshAgentFromStorage);
    return () => window.removeEventListener('agent-status-updated', refreshAgentFromStorage);
  }, []);

  const clearAgentSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('agent');
    localStorage.removeItem('userId');
    localStorage.removeItem('humanAgentId');
    localStorage.removeItem('currentAgentId');
    localStorage.removeItem('clientAgent');
    localStorage.removeItem('client');
    localStorage.removeItem('user');
  };

  const handleLogout = async (options?: { silent?: boolean }) => {
    if (isLoggingOut) return;
    if (!options?.silent) setIsLoggingOut(true);
    try {
      clearAgentSession();

      try {
        await logoutApi();
      } catch (cookieError) {
        console.error('Logout API error:', cookieError);
      }

      dispatchAuthStorageSync();
      if (!options?.silent) {
        toast.success('Logout successful');
      }
      router.push('/agent-login');
    } catch (error) {
      console.error('Logout error:', error);
      clearAgentSession();
      dispatchAuthStorageSync();
      if (!options?.silent) {
        toast.error('Logout failed. Please try again.');
        setIsLoggingOut(false);
      } else {
        router.push('/agent-login');
      }
    }
  };

  useEffect(() => {
    const onAgentDeleted = () => {
      void handleLogout({ silent: true });
    };
    socket?.on('agent-deleted-success', onAgentDeleted);
    return () => {
      socket?.off('agent-deleted-success', onAgentDeleted);
    };
  }, [socket]);

  const toggleAgentStatus = async () => {
    if (!agent) return;

    try {
      const result = await toggleActiveStatus(agent.id,!agent.isActive)
      if (!result) {
        throw new Error('Failed to update status');
      }

      // Update localStorage and state
      const updatedAgent = {
        ...agent,
        isActive: !agent.isActive
      };
      
      localStorage.setItem('agent', JSON.stringify(updatedAgent));
      setAgent(updatedAgent);

    } catch (error) {
      console.error('Status update error:', error);
    }
  };

  const menuItems = [
    {
      label: "Inbox",
      icon: MessageSquare,
      href: "/agent-inbox",
      active: true
    },
    {
      label: "Edit Profile",
      icon: Edit3,
      onClick: () => setShowEditModal(true),
    }
  ];

  // Render nothing until agent is loaded
  if (agent === null) {
    return null;
  }

  return (
    <>
      <div className={`bg-gray-900 text-white h-screen flex flex-col transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          {!isCollapsed && <h2 className="text-xl font-semibold">Agent Panel</h2>}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            {isCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <button
                    onClick={item.onClick ? item.onClick : () => item.href && router.push(item.href)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${item.active
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-700 text-gray-300'
                      }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon size={20} />
                    {!isCollapsed && <span>{item.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Status Toggle */}
        {!isCollapsed && agent && (
          <div className="px-4 py-2 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Status</span>
              <button
                onClick={toggleAgentStatus}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${agent.isActive ? 'bg-green-600' : 'bg-gray-600'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${agent.isActive ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {agent.isActive ? 'Active' : 'Inactive'}
            </p>
          </div>
        )}

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center">
              <Image 
                src={agent?.avatar && agent.avatar !== 'null' && agent.avatar.trim() !== '' && agent.avatar.startsWith('http')
                  ? agent.avatar 
                  : agent?.avatar && agent.avatar !== 'null' && agent.avatar.trim() !== ''
                  ? `${process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:9001'}${agent.avatar}`
                  : defaultImage} 
                alt={agent?.name || 'Agent'} 
                width={32} 
                height={32}
                className="object-cover"
                unoptimized
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = defaultImage;
                }}
              />
            </div>
            {!isCollapsed && (
              <div>
                <p className="text-sm font-medium">
                  {agent?.name || 'Agent Name'}
                </p>
                <p className="text-xs text-gray-400">
                  {agent?.isActive ? 'Online' : 'Offline'}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => handleLogout()}
            disabled={isLoggingOut}
            className="w-full flex items-center space-x-3 p-3 hover:bg-red-600 rounded-lg transition-colors text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            title={isCollapsed ? "Logout" : undefined}
          >
            {isLoggingOut ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                {!isCollapsed && <span>Logging out...</span>}
              </>
            ) : (
              <>
                <LogOut size={20} />
                {!isCollapsed && <span>Logout</span>}
              </>
            )}
          </button>
        </div>
      </div>

      <AgentEditProfileModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        agent={agent as unknown as AgentEditProfileAgent | null}
        onAgentUpdated={(a) => setAgent(a as unknown as Agent)}
      />
    </>
  );
}