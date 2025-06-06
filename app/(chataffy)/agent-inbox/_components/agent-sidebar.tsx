// app/agent-inbox/_components/agent-sidebar.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  MessageSquare, 
  Settings, 
  User, 
  LogOut, 
  Menu,
  X 
} from "lucide-react";

export default function AgentSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Add your logout logic here
      // Clear tokens, disconnect socket, etc.
      localStorage.removeItem('token'); // Adjust based on your auth implementation
      localStorage.removeItem('role'); 
      router.push('/agent-login'); // Adjust route as needed
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    {
      label: "Inbox",
      icon: MessageSquare,
      href: "/agent-inbox",
      active: true
    },
    // {
    //   label: "Profile", 
    //   icon: User,
    //   href: "/agent-profile" // Create this route if needed
    // },
    // {
    //   label: "Settings",
    //   icon: Settings, 
    //   href: "/agent-settings" // Create this route if needed
    // }
  ];

  return (
    <div className={`bg-gray-900 text-white h-screen flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
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
                  onClick={() => router.push(item.href)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    item.active 
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

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <User size={16} />
          </div>
          {!isCollapsed && (
            <div>
              <p className="text-sm font-medium">Agent Name</p>
              <p className="text-xs text-gray-400">Online</p>
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
  );
}