// app/agent-inbox/_components/agent-sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  Edit3,
} from "lucide-react";
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
  
  const router = useRouter();

  const [agent, setAgent] = useState<Agent | null>(null);
  // Only read from localStorage on the client
  useEffect(() => {
    const agentData = localStorage.getItem('agent');
    const parsedAgent = agentData ? JSON.parse(agentData) : null;
    setAgent(parsedAgent);
  }, []);

  const handleLogout = async () => {
    try {
      // Remove all agent-related localStorage items
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('agent');
      localStorage.removeItem('userId');
      localStorage.removeItem('humanAgentId');
      localStorage.removeItem('currentAgentId');

      // Also remove any client-related items that might have been set
      localStorage.removeItem('clientAgent');
      localStorage.removeItem('client');
      localStorage.removeItem('user');
      
      // Delete cookies via server action
      try {
        await logoutApi();
      } catch (cookieError) {
        // Even if logoutApi fails, cookies deletion might have succeeded
        console.error('Logout API error:', cookieError);
      }

      dispatchAuthStorageSync();
      router.push('/agent-login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear localStorage and redirect even if there's an error
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('agent');
      localStorage.removeItem('userId');
      localStorage.removeItem('humanAgentId');
      localStorage.removeItem('currentAgentId');
      dispatchAuthStorageSync();
      router.push('/agent-login');
    }
  };

  useEffect(()=>{
    console.log("agent deleted")
    socket?.on('agent-deleted-success',handleLogout)
    
    return () => {
      socket?.off('agent-deleted-success', handleLogout)
    }
  },[socket])

  // Listen for socket events to update agent status in real-time
  useEffect(() => {
    if (!socket || !agent) return

    const handleAgentStatusUpdate = (updatedAgent: any) => {
      console.log('Agent status updated via socket:', updatedAgent)
      // Check if this update is for the current agent
      const agentId = agent.id?.toString() || agent.id
      const updatedId = updatedAgent.id?.toString() || updatedAgent.id
      
      if (agentId === updatedId) {
        // Update localStorage and state
        const updatedAgentData = {
          ...agent,
          isActive: updatedAgent.isActive,
          lastActive: updatedAgent.lastActive,
        }
        
        localStorage.setItem('agent', JSON.stringify(updatedAgentData))
        setAgent(updatedAgentData)
      }
    }

    // Listen for agent status updates
    socket.on('agent-status-updated', handleAgentStatusUpdate)

    // Cleanup listener on unmount
    return () => {
      socket.off('agent-status-updated', handleAgentStatusUpdate)
    }
  }, [socket, agent])

  const toggleAgentStatus = async () => {
    if (!agent) return;

    try {
      const result = await toggleActiveStatus(agent.id,!agent.isActive)
      if (!result) {
        throw new Error(result.message || 'Failed to update status');
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
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 p-3 hover:bg-red-600 rounded-lg transition-colors text-gray-300 hover:text-white"
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Logout</span>}
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