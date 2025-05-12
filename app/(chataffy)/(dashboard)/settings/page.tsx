'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import closeBtnImage from '@/images/close-btn.svg'
import { X, User, Mail, Lock, Pencil, Trash, Plus } from "lucide-react";
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import {
  getAllAgents,
  createAgent,
  updateAgent,
  deleteAgent,
  updateAgentStatus
} from '@/app/_api/dashboard/action'

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

export default function Settings() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [formData, setFormData] = useState<CreateAgentData>({
    name: '',
    email: '',
    password: ''
  })

  // Fetch agents
  const fetchAgents = async () => {
    try {
      const data = await getAllAgents()
      setAgents(data)
    } catch (error) {
      toast.error('Failed to fetch agents')
      console.error('Error fetching agents:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
  }, [])

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Handle add agent
  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createAgent(formData)
      toast.success('Agent added successfully')
      setShowAddModal(false)
      setFormData({ name: '', email: '', password: '' })
      fetchAgents()
    } catch (error) {
      toast.error('Failed to add agent')
      console.error('Error adding agent:', error)
    }
  }

  // Handle edit agent
  const handleEditAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAgent) return

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
      fetchAgents()
    } catch (error) {
      toast.error('Failed to update agent')
      console.error('Error updating agent:', error)
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
    } catch (error) {
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
    } catch (error) {
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
    setShowEditModal(true)
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="main-content">
      <div className="submenu-sidebar">
        <ul>
          <li className="active"><a href="">Settings</a></li>
        </ul>
      </div>

      <div className="top-headbar">
        <div className="top-headbar-heading">Settings</div>
      </div>

      <div className="main-content-area">
        <div className="settings-area">
          <div className="settings-section">
            <div className="flex justify-content-space-between align-item-center mb-20">
              <h4>Agents</h4>
              <button
                className="custom-btn"
                onClick={() => setShowAddModal(true)}
              >
                Add Agent
              </button>
            </div>

            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Live Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr key={agent._id}>
                      <td>{agent.name}</td>
                      <td>{agent.email}</td>
                      <td>
                        <span className={`status-badge ${agent.status}`}>
                          {agent.status}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${agent.isActive ? 'approved' : 'pending'}`}>
                          {agent.isActive ? 'Online' : 'Offline'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-10">
                          <button
                            className="action-btn edit"
                            onClick={() => openEditModal(agent)}
                          >
                            Update
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => {
                              console.log('Delete button clicked for agent:', agent);
                              handleDeleteAgent(agent._id);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Agent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center min-h-screen bg-white/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md mx-auto overflow-hidden animate-scaleIn">
            <div className="flex flex-col items-center justify-center bg-gradient-to-r from-indigo-50 to-white px-6 pt-6 pb-2 border-b border-gray-100">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 mb-2">
                <User size={32} className="text-indigo-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Add New Agent</h2>
            </div>
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-gray-400" />
            </button>
            <div className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <User size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="pl-10 w-full rounded-lg border border-gray-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter agent name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Mail size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10 w-full rounded-lg border border-gray-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="agent@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Lock size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="pl-10 w-full rounded-lg border border-gray-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Create a password"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddAgent}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors"
                >
                  Add Agent
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Agent Modal */}
      {showEditModal && selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center min-h-screen bg-white/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md mx-auto overflow-hidden animate-scaleIn">
            <div className="flex flex-col items-center justify-center bg-gradient-to-r from-indigo-50 to-white px-6 pt-6 pb-2 border-b border-gray-100">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 mb-2">
                <Pencil size={32} className="text-indigo-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Edit Agent</h2>
            </div>
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-gray-400" />
            </button>
            <div className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <User size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="pl-10 w-full rounded-lg border border-gray-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter agent name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Mail size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10 w-full rounded-lg border border-gray-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="agent@example.com"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEditAgent}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors"
                >
                  Update Agent
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// Animations
// Add these to your global CSS or Tailwind config:
// .animate-fadeIn { animation: fadeIn 0.2s ease; }
// .animate-scaleIn { animation: scaleIn 0.2s cubic-bezier(.4,2,.6,1); }
// @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
// @keyframes scaleIn { from { opacity: 0; transform: scale(.95);} to { opacity: 1; transform: scale(1);} } 