'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import closeBtnImage from '@/images/close-btn.svg'
import { X, User, Mail, Lock, Pencil, Trash, Plus, Search, Filter, MoreVertical, UserCheck, UserX, Shield, Clock } from "lucide-react";
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import {
  getAllAgents,
  createAgent,
  updateAgent,
  deleteAgent,
  updateAgentStatus
} from '@/app/_api/dashboard/action'
import React from 'react';

// Define types locally
export interface Agent {
  _id: any;
  name: string;
  email: string;
  status: 'pending' | 'approved';
  isActive: boolean;
  lastActive?: string;
}

export interface CreateAgentData {
  name: string;
  email: string;
  password: string;
}

export interface UpdateAgentData {
  name?: string;
  email?: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
}

// ErrorBoundary component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
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

export default function Settings() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved'>('all')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [formData, setFormData] = useState<CreateAgentData>({
    name: '',
    email: '',
    password: ''
  })

  // Fetch agents
  const fetchAgents = async () => {
    try {
      const data = await getAllAgents();
      if (!Array.isArray(data)) {
        throw new Error('API did not return an array');
      }
      setAgents(data);
    } catch (error: any) {
      toast.error('Failed to fetch agents');
      setAgents([]); // fallback to empty array
      setLoading(false);
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAgents()
  }, [])

  // Validation functions
  const validateForm = (isEdit = false): boolean => {
    const errors: FormErrors = {}
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters'
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }

    // if (!isEdit && !formData.password) {
    //   errors.password = 'Password is required'
    // } else if (!isEdit && formData.password.length < 6) {
    //   errors.password = 'Password must be at least 6 characters'
    // }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  // Handle add agent
  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    try {
      const response = await createAgent(formData);
      if (response.upgradeSuggested) {
        // Show the error message
        alert(response.message);
      }else{
      toast.success('Agent added successfully')
      setShowAddModal(false)
      setFormData({ name: '', email: '' ,password:''})
      setFormErrors({})
      fetchAgents()
      }
    } catch (error: any) {
      toast.error('Failed to add agent')
      console.error('Error adding agent:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle edit agent
  const handleEditAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAgent || !validateForm(true)) return

    setIsSubmitting(true)
    try {
      const updateData: UpdateAgentData = {
        name: formData.name,
        email: formData.email
      }
      await updateAgent(selectedAgent._id, updateData)
      toast.success('Agent updated successfully')
      setShowEditModal(false)
      setSelectedAgent(null)
      setFormData({ name: '', email: '', password: '' })
      setFormErrors({})
      fetchAgents()
    } catch (error: any) {
      toast.error('Failed to update agent')
      console.error('Error updating agent:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete agent
  const handleDeleteAgent = async (id: any) => {
    console.log('handleDeleteAgent called with agent:', id);

    if (!id) {
      console.error('Delete agent called without an ID');
      toast.error('Invalid agent ID');
      return;
    }

    if (!confirm('Are you sure you want to delete this agent?')) return;

    try {
      console.log('Attempting to delete agent with ID:', id);
      const result = await deleteAgent(id);
      console.log('Delete result:', result);

      if (result === 'error') {
        toast.error('Unauthorized: Please login again');
        return;
      }
      toast.success('Agent deleted successfully');
      fetchAgents();
    } catch (error: any) {
      console.error('Error deleting agent:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete agent');
    }
  };

  // Handle status toggle
  const handleStatusToggle = async (id: string, currentStatus: boolean) => {
    try {
      await updateAgentStatus(id, !currentStatus)
      toast.success('Agent status updated successfully')
      fetchAgents()
    } catch (error: any) {
      toast.error('Failed to update agent status')
      console.error('Error updating agent status:', error)
    }
  }

  // Open edit modal
  const openEditModal = (agent: Agent) => {
    setSelectedAgent(agent)
    setFormData({
      name: agent.name,
      email: agent.email,
      password: ''
    })
    setFormErrors({})
    setShowEditModal(true)
  }

  // Reset modals
  const resetModals = () => {
    setShowAddModal(false)
    setShowEditModal(false)
    setSelectedAgent(null)
    setFormData({ name: '', email: '', password: '' })
    setFormErrors({})
    setIsSubmitting(false)
  }

  // Filter agents based on search and status
  const filteredAgents = agents.filter((agent: Agent) => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || agent.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getActiveStatusColor = (isActive: boolean): string => {
    return isActive 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-slate-100 text-slate-600 border-slate-200'
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-white">
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-slate-600 font-medium">Loading agents...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-white">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-slate-200">
          <div className="px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Agent Management</h1>
                <p className="text-slate-600 mt-1">Manage your AI chatbot agents and their permissions</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-indigo-50 px-3 py-2 rounded-lg">
                  <span className="text-sm font-medium text-indigo-700">
                    {agents.length} Total Agents
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Controls */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  {/* Search */}
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
                  
                  {/* Filter */}
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

                {/* Add Agent Button */}
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all duration-200 shadow-sm"
                >
                  <Plus size={20} className="mr-2" />
                  Add New Agent
                </button>
              </div>
            </div>

            {/* Agents Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-slate-700">Agent</th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-700">Status</th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-700">Activity</th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-700">Last Active</th>
                      <th className="text-right py-4 px-6 font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredAgents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12">
                          <div className="flex flex-col items-center space-y-3">
                            <UserX size={48} className="text-slate-300" />
                            <p className="text-slate-500 font-medium">No agents found</p>
                            <p className="text-slate-400 text-sm">Try adjusting your search or filter criteria</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredAgents.map((agent: Agent) => (
                        <tr key={agent._id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                                  <User size={20} className="text-white" />
                                </div>
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{agent.name}</p>
                                <p className="text-slate-500 text-sm">{agent.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(agent.status)}`}>
                              {agent.status === 'approved' ? (
                                <Shield size={12} className="mr-1" />
                              ) : (
                                <Clock size={12} className="mr-1" />
                              )}
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
                                onClick={() => handleDeleteAgent(agent._id)}
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn">
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Plus size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Add New Agent</h3>
                    <p className="text-sm text-slate-500">Create a new agent account</p>
                  </div>
                </div>
                <button
                  onClick={resetModals}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
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
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                        formErrors.name ? 'border-red-300 bg-red-50' : 'border-slate-300'
                      }`}
                      placeholder="Enter agent's full name"
                    />
                  </div>
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  )}
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
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                        formErrors.email ? 'border-red-300 bg-red-50' : 'border-slate-300'
                      }`}
                      placeholder="agent@example.com"
                    />
                  </div>
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                  )}
                </div>

                {/* <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                        formErrors.password ? 'border-red-300 bg-red-50' : 'border-slate-300'
                      }`}
                      placeholder="Create a secure password"
                    />
                  </div>
                  {formErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                  )}
                </div> */}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetModals}
                    className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                  >
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn">
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Pencil size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Edit Agent</h3>
                    <p className="text-sm text-slate-500">Update agent information</p>
                  </div>
                </div>
                <button
                  onClick={resetModals}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
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
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                        formErrors.name ? 'border-red-300 bg-red-50' : 'border-slate-300'
                      }`}
                      placeholder="Enter agent's full name"
                    />
                  </div>
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  )}
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
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                        formErrors.email ? 'border-red-300 bg-red-50' : 'border-slate-300'
                      }`}
                      placeholder="agent@example.com"
                    />
                  </div>
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetModals}
                    className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                  >
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

        {/* Custom Styles */}
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
  )
}