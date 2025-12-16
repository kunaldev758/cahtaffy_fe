"use client";
import { useState, useEffect, useRef } from "react";
import { User, LogOut, ChevronDown } from "lucide-react";
import { logoutApi } from '@/app/_api/dashboard/action';
import { useRouter } from 'next/navigation';
import { updateClientStatus } from '@/app/_api/dashboard/action';
import { useSocket } from '@/app/socketContext';

interface ClientProfileMenuProps {
  clientEmail?: string;
  clientId?: string;
  isActive?: boolean;
}

export default function ClientProfileMenu({ 
  clientEmail, 
  clientId,
  isActive = true 
}: ClientProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(isActive);
  const [isUpdating, setIsUpdating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { socket } = useSocket();

  // Sync with prop changes
  useEffect(() => {
    if (isActive !== undefined) {
      setIsOnline(isActive);
    }
  }, [isActive]);

  // Get client data from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const clientData = localStorage.getItem('client');
      if (clientData) {
        try {
          const parsedClient = JSON.parse(clientData);
          if (isActive === undefined) {
            setIsOnline(parsedClient.isActive !== false);
          }
        } catch (error) {
          console.error('Error parsing client data:', error);
        }
      }
    }
  }, [isActive]);

  // Listen for client status updates via socket
  useEffect(() => {
    if (!socket) return;

    const handleClientStatusUpdate = (updatedClient: any) => {
      console.log('Client status updated via socket:', updatedClient);
      setIsOnline(updatedClient.isActive !== false);
      
      // Update localStorage
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
          } catch (error) {
            console.error('Error updating client data:', error);
          }
        }
      }
    };

    socket.on('client-status-updated', handleClientStatusUpdate);

    return () => {
      socket.off('client-status-updated', handleClientStatusUpdate);
    };
  }, [socket]);

  // Close menu when clicking outside
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
    if (isUpdating) {
      console.log('Cannot toggle: isUpdating=', isUpdating);
      return;
    }
    
    setIsUpdating(true);
    const newStatus = !isOnline;
    console.log('Toggling client status:', { currentStatus: isOnline, newStatus });
    
    try {
      const response = await updateClientStatus(newStatus);
      console.log('Update client status response:', response);
      
      // Check if the response indicates success
      if (response === 'error' || (response && response.status_code !== 200)) {
        throw new Error(response?.message || 'Failed to update client status');
      }
      
      setIsOnline(newStatus);
      
      // Update localStorage
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
            
            // Trigger a custom event to update inbox component
            window.dispatchEvent(new CustomEvent('client-status-changed', { 
              detail: updatedClientData 
            }));
          } catch (error) {
            console.error('Error updating client data:', error);
          }
        } else {
          // If no client data in localStorage, create it from the response
          if (response && response.agent) {
            localStorage.setItem('clientAgent', JSON.stringify(response.agent));
            // Also update agent localStorage if it exists
            const agentData = localStorage.getItem('agent');
            if (agentData) {
              try {
                const parsedAgent = JSON.parse(agentData);
                if (parsedAgent.isClient) {
                  const updatedAgent = { ...parsedAgent, ...response.agent };
                  localStorage.setItem('agent', JSON.stringify(updatedAgent));
                }
              } catch (error) {
                console.error('Error updating agent data:', error);
              }
            }
            window.dispatchEvent(new CustomEvent('client-status-changed', { 
              detail: response.agent 
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error updating client status:', error);
      // Revert on error
      setIsOnline(!newStatus);
      alert('Failed to update status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutApi();
      localStorage.clear();
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear localStorage and redirect on error
      localStorage.clear();
      router.replace('/login');
    }
  };

  // Get email from localStorage if not provided
  const displayEmail = clientEmail || (typeof window !== 'undefined' ? 
    (() => {
      try {
        const clientData = localStorage.getItem('client');
        if (clientData) {
          const parsed = JSON.parse(clientData);
          return parsed.email || '';
        }
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsed = JSON.parse(userData);
          return parsed.email || '';
        }
      } catch (error) {
        console.error('Error getting email:', error);
      }
      return '';
    })() : '');

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors duration-200"
        title="Profile"
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
          <User className="w-5 h-5" />
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Profile Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                <User className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {displayEmail?.split('@')[0] || 'Client'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {displayEmail || 'No email'}
                </p>
              </div>
            </div>
          </div>

          {/* Online/Offline Toggle */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Accept chats</span>
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              </div>
              <button
                onClick={handleToggleStatus}
                disabled={isUpdating}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isOnline ? 'bg-blue-600' : 'bg-gray-300'
                } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isOnline ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Logout */}
          <div className="p-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
