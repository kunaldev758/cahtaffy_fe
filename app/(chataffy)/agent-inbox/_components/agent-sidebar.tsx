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
  Eye,
  EyeOff,
  Save,
  AlertCircle
} from "lucide-react";
import { toggleActiveStatus, updateAgent } from "@/app/_api/dashboard/action";

interface Agent {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  status: string;
}

export default function AgentSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const router = useRouter();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Only read from localStorage on the client
  useEffect(() => {
    const agentData = localStorage.getItem('agent');
    setAgent(agentData ? JSON.parse(agentData) : null);
  }, []);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('agent');
      router.push('/agent-login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent) return;

    setIsUpdating(true);
    setError("");
    setSuccess("");

    try {
      const updateData: any = {
        name: editForm.name,
        // email: editForm.email
      };

      // Only include password if provided
      if (editForm.newPassword) {
        if (editForm.newPassword !== editForm.confirmPassword) {
          setError("New passwords don't match");
          setIsUpdating(false);
          return;
        }
        updateData.currentPassword = editForm.currentPassword;
        updateData.newPassword = editForm.newPassword;
      }

      const result = await updateAgent(agent.id,updateData)
      console.log(result,"update result")

      if (!result.agent) {
        throw new Error(result.message || 'Failed to update agent');
      }

      // Update localStorage with new data
      const updatedAgent = {
        ...agent,
        name: result?.agent?.name,
        // email: result.agent.email
      };
      
      localStorage.setItem('agent', JSON.stringify(updatedAgent));
      setAgent(updatedAgent);
      
      setSuccess("Profile updated successfully!");
      
      // Reset password fields
      setEditForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      setTimeout(() => {
        setShowEditModal(false);
        setSuccess("");
      }, 2000);

    } catch (error) {
      console.error('Update error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

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
      setError(error instanceof Error ? error.message : 'Failed to update status');
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
      onClick: () => {
        setEditForm({
          name: agent?.name || '',
          // email: agent?.email || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        } as any);
        setShowEditModal(true);
      }
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
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${agent?.isActive ? 'bg-green-500' : 'bg-gray-500'}`}>
              <User size={16} />
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

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Profile</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg flex items-center space-x-2">
                <AlertCircle size={16} className="text-red-500" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                <span className="text-green-700 text-sm">{success}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>

              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div> */}

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Change Password (Optional)</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={editForm.currentPassword}
                        onChange={(e) => setEditForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={editForm.newPassword}
                      onChange={(e) => setEditForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={editForm.confirmPassword}
                      onChange={(e) => setEditForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isUpdating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}