'use client'

import { useState, useEffect } from 'react'
import { X, User, Mail, Pencil, Trash, Plus, Search, Filter, UserX, Shield, Clock, Globe } from "lucide-react";
import { toast } from 'react-toastify'
import { useSocket } from '@/app/socketContext'
import 'react-toastify/dist/ReactToastify.css'
import {
  getAllHumanAgents,
  getAIAgents,
  createHumanAgent,
  updateHumanAgent,
  deleteAgent,
  updateAgentStatus
} from '@/app/_api/dashboard/action'
import React from 'react';

// Define types locally
export interface HumanAgentType {
  _id: any;
  name: string;
  email: string;
  status: 'pending' | 'approved';
  isActive: boolean;
  lastActive?: string;
  isClient?: boolean;
  assignedAgents?: string[];
}

export interface AIAgentType {
  _id: string;
  agentName?: string;
  website_name?: string;
  isActive?: boolean;
}

export interface CreateHumanAgentData {
  name: string;
  email: string;
  assignedAgents: string[];
}

export interface UpdateHumanAgentData {
  name?: string;
  assignedAgents?: string[];
}

interface FormErrors {
  name?: string;
  email?: string;
  assignedAgents?: string;
}

// ErrorBoundary component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-white">
          <div className="bg-white p-8 rounded-xl shadow-xl border border-red-200 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-2">Something went wrong</h2>
            <p className="text-red-500 mb-4">{this.state.error?.message || 'An unexpected error occurred.'}</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Reload Page</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function HumanAgentPage() {
  const { socket } = useSocket();
  const [agents, setAgents] = useState<HumanAgentType[]>([]);
  const [aiAgents, setAIAgents] = useState<AIAgentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<HumanAgentType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<CreateHumanAgentData>({
    name: '',
    email: '',
    assignedAgents: []
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Fetch human agents
  const fetchAgents = async () => {
    try {
      const data = await getAllHumanAgents();
      if (!Array.isArray(data)) {
        throw new Error('API did not return an array');
      }
      setAgents(data);
    } catch (error: any) {
      toast.error('Failed to fetch human agents');
      setAgents([]);
      console.error('Error fetching human agents:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch AI agents (websites) for assignedAgents dropdown
  const fetchAIAgents = async () => {
    try {
      const data = await getAIAgents();
      setAIAgents(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error fetching AI agents:', error);
      setAIAgents([]);
    }
  };

  useEffect(() => {
    fetchAgents();
    fetchAIAgents();
  }, []);

  // Listen for socket events to update agent status in real-time
  useEffect(() => {
    if (!socket) return;

    const handleAgentStatusUpdate = (updatedAgent: any) => {
      setAgents((prevAgents) =>
        prevAgents.map((agent) =>
          agent._id === updatedAgent.id || agent._id?.toString() === updatedAgent.id
            ? { ...agent, isActive: updatedAgent.isActive, lastActive: updatedAgent.lastActive }
            : agent
        )
      );
    };

    socket.on('human-agent-status-updated', handleAgentStatusUpdate);
    socket.on('agent-status-updated', handleAgentStatusUpdate); // fallback for client agents

    return () => {
      socket.off('human-agent-status-updated', handleAgentStatusUpdate);
      socket.off('agent-status-updated', handleAgentStatusUpdate);
    };
  }, [socket]);

  const validateForm = (isEdit = false): boolean => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (formData.assignedAgents.length === 0) {
      errors.assignedAgents = 'At least one agent (website) must be assigned';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleAssignedAgentsChange = (agentId: string, checked: boolean) => {
    setFormData((prev) => {
      const next = checked
        ? [...prev.assignedAgents, agentId]
        : prev.assignedAgents.filter((id) => id !== agentId);
      return { ...prev, assignedAgents: next };
    });
    if (formErrors.assignedAgents) {
      setFormErrors((prev) => ({ ...prev, assignedAgents: undefined }));
    }
  };

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await createHumanAgent({
        name: formData.name,
        email: formData.email,
        assignedAgents: formData.assignedAgents
      });
      if (response?.upgradeSuggested) {
        toast.error(response.message || 'Agent limit reached');
      } else {
        toast.success('Human agent added successfully');
        setShowAddModal(false);
        setFormData({ name: '', email: '', assignedAgents: [] });
        setFormErrors({});
        fetchAgents();
      }
    } catch (error: any) {
      toast.error('Failed to add human agent');
      console.error('Error adding human agent:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent || !validateForm(true)) return;

    setIsSubmitting(true);
    try {
      await updateHumanAgent(selectedAgent._id, {
        name: formData.name,
        assignedAgents: formData.assignedAgents
      });
      toast.success('Human agent updated successfully');
      setShowEditModal(false);
      setSelectedAgent(null);
      setFormData({ name: '', email: '', assignedAgents: [] });
      setFormErrors({});
      fetchAgents();
    } catch (error: any) {
      toast.error('Failed to update human agent');
      console.error('Error updating human agent:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAgent = async (id: any) => {
    socket?.emit('agent-deleted', { id });
    if (!id) {
      toast.error('Invalid agent ID');
      return;
    }
    try {
      const result = await deleteAgent(id);
      if (result === 'error') {
        toast.error('Unauthorized: Please login again');
        return;
      }
      toast.success('Human agent deleted successfully');
      fetchAgents();
    } catch (error: any) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete human agent');
    }
  };

  const handleStatusToggle = async (id: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      await updateAgentStatus(id, newStatus);
      toast.success('Agent status updated successfully');
      setAgents((prevAgents) =>
        prevAgents.map((agent) =>
          agent._id === id || agent._id?.toString() === id
            ? { ...agent, isActive: newStatus, lastActive: newStatus ? new Date().toISOString() : agent.lastActive }
            : agent
        )
      );
    } catch (error: any) {
      toast.error('Failed to update agent status');
      fetchAgents();
    }
  };

  const openEditModal = (agent: HumanAgentType) => {
    setSelectedAgent(agent);
    const normalizedIds = (agent.assignedAgents || []).map((id) =>
      typeof id === 'string' ? id : (id as any)?.toString?.() || ''
    );
    setFormData({
      name: agent.name,
      email: agent.email,
      assignedAgents: normalizedIds
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const resetModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedAgent(null);
    setFormData({ name: '', email: '', assignedAgents: [] });
    setFormErrors({});
    setIsSubmitting(false);
  };

  const filteredAgents = agents.filter((agent: HumanAgentType) => {
    // if (agent.isClient === true) return false;
    const matchesSearch =
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || agent.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActiveStatusColor = (isActive: boolean): string => {
    return isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const getAgentName = (agentId: string) => {
    const ai = aiAgents.find((a) => a._id === agentId || a._id?.toString() === agentId);
    return ai?.agentName || ai?.website_name || agentId;
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-white">
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-slate-600 font-medium">Loading human agents...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-white">
        {/* <div className="bg-white shadow-sm border-b border-slate-200">
          <div className="px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Human Agent Management</h1>
                <p className="text-slate-600 mt-1">Manage human agents and assign them to websites (AI agents)</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-indigo-50 px-3 py-2 rounded-lg">
                  <span className="text-sm font-medium text-indigo-700">
                    {agents.filter((a) => !a.isClient).length} Total Agents
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div> */}

        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search agents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2.5 w-64 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="pl-10 pr-8 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none bg-white"
                    >
                      <option value="all">All Status</option>
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all duration-200 shadow-sm"
                >
                  <Plus size={20} className="mr-2" />
                  Add New Human Agent
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-slate-700">Agent</th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-700">Assigned Websites</th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-700">Status</th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-700">Activity</th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-700">Last Active</th>
                      <th className="text-right py-4 px-6 font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredAgents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12">
                          <div className="flex flex-col items-center space-y-3">
                            <UserX size={48} className="text-slate-300" />
                            <p className="text-slate-500 font-medium">No human agents found</p>
                            <p className="text-slate-400 text-sm">Add a human agent and assign them to websites</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredAgents.map((agent: HumanAgentType) => (
                        <tr key={agent._id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                                <User size={20} className="text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{agent.name}</p>
                                <p className="text-slate-500 text-sm">{agent.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-wrap gap-1">
                              {agent.assignedAgents?.length ? (
                                agent.assignedAgents.map((aid) => (
                                  <span
                                    key={aid}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
                                  >
                                    <Globe size={10} className="mr-1" />
                                    {getAgentName(aid)}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400 text-sm">None</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(agent.status)}`}>
                              {agent.status === 'approved' ? <Shield size={12} className="mr-1" /> : <Clock size={12} className="mr-1" />}
                              {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getActiveStatusColor(agent.isActive)}`}>
                              <div className={`w-2 h-2 rounded-full mr-1.5 ${agent.isActive ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                              {agent.isActive ? 'Online' : 'Offline'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-slate-600 text-sm">
                            {agent.lastActive ? new Date(agent.lastActive).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => openEditModal(agent)}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                              >
                                <Pencil size={14} className="mr-1" />
                                Edit
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(agent._id)}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                              >
                                <Trash size={14} className="mr-1" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Add Agent Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Plus size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Add New Human Agent</h3>
                    <p className="text-sm text-slate-500">Assign to websites they can handle chats for</p>
                  </div>
                </div>
                <button onClick={resetModals} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleAddAgent} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${formErrors.name ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
                      placeholder="Enter agent's full name"
                    />
                  </div>
                  {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${formErrors.email ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
                      placeholder="agent@example.com"
                    />
                  </div>
                  {formErrors.email && <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Assigned Websites (required)</label>
                  <p className="text-xs text-slate-500 mb-2">Select which websites this agent can handle chats for</p>
                  <div className="border border-slate-200 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                    {aiAgents.length === 0 ? (
                      <p className="text-slate-500 text-sm">No websites found. Create an AI agent first.</p>
                    ) : (
                      aiAgents.map((ai) => {
                        const aid = String(ai._id ?? '');
                        return (
                          <label key={aid} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={formData.assignedAgents.includes(aid)}
                              onChange={(e) => handleAssignedAgentsChange(aid, e.target.checked)}
                            />
                            <span className="text-sm">{ai.agentName || ai.website_name || aid}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                  {formErrors.assignedAgents && <p className="mt-1 text-sm text-red-600">{formErrors.assignedAgents}</p>}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={resetModals} className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors font-medium">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || aiAgents.length === 0}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Adding...
                      </>
                    ) : (
                      'Add Agent'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Agent Modal */}
        {showEditModal && selectedAgent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Pencil size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Edit Human Agent</h3>
                    <p className="text-sm text-slate-500">Update agent and assigned websites</p>
                  </div>
                </div>
                <button onClick={resetModals} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleEditAgent} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${formErrors.name ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
                      placeholder="Enter agent's full name"
                    />
                  </div>
                  {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
                </div>

                <div className="text-slate-600 text-sm">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <p>{selectedAgent.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Assigned Websites (required)</label>
                  <div className="border border-slate-200 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                    {aiAgents.length === 0 ? (
                      <p className="text-slate-500 text-sm">No websites found.</p>
                    ) : (
                      aiAgents.map((ai) => {
                        const aid = String(ai._id ?? '');
                        return (
                          <label key={aid} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={formData.assignedAgents.includes(aid)}
                              onChange={(e) => handleAssignedAgentsChange(aid, e.target.checked)}
                            />
                            <span className="text-sm">{ai.agentName || ai.website_name || aid}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                  {formErrors.assignedAgents && <p className="mt-1 text-sm text-red-600">{formErrors.assignedAgents}</p>}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={resetModals} className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors font-medium">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      'Update Agent'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn">
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <Trash size={20} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Delete Human Agent</h3>
                    <p className="text-sm text-slate-500">This action cannot be undone.</p>
                  </div>
                </div>
                <button onClick={() => setConfirmDeleteId(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-slate-700">Are you sure you want to delete this human agent?</p>
                <div className="flex justify-end space-x-3 pt-6">
                  <button type="button" onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors font-medium">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirmDeleteId) {
                        await handleDeleteAgent(confirmDeleteId);
                        setConfirmDeleteId(null);
                      }
                    }}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out;
          }
          .animate-scaleIn {
            animation: scaleIn 0.2s cubic-bezier(0.4, 2, 0.6, 1);
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    </ErrorBoundary>
  );
}
