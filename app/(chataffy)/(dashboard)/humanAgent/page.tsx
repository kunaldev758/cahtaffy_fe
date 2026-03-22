'use client'

import { useState, useEffect, useRef } from 'react'
import { X, User, Mail, Pencil, Trash, Plus, Search, UserX, Clock, UserPlus, ChevronDown } from "lucide-react";
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
  avatar?: string | null;
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

function resolveHumanAgentAvatarUrl(avatar?: string | null): string | null {
  if (avatar == null) return null;
  const trimmed = String(avatar).trim();
  if (!trimmed || trimmed === 'null') return null;
  if (trimmed.startsWith('http')) return trimmed;
  const base = process.env.NEXT_PUBLIC_API_HOST || process.env.NEXT_PUBLIC_FILE_HOST || '';
  if (!base) return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${base.replace(/\/$/, '')}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
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
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const headerSelectAllRef = useRef<HTMLInputElement>(null);

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
    if (agent.isClient) return;
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
    const matchesSearch =
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || agent.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const selectableFilteredIds = filteredAgents.filter((a) => !a.isClient).map((a) => String(a._id));

  useEffect(() => {
    const allowedIds = agents.filter((a) => !a.isClient).map((a) => String(a._id));
    setSelectedRowIds((prev) => prev.filter((id) => allowedIds.includes(id)));
  }, [agents]);

  useEffect(() => {
    const el = headerSelectAllRef.current;
    if (!el) return;
    const some = selectedRowIds.some((id) => selectableFilteredIds.includes(id));
    const all =
      selectableFilteredIds.length > 0 && selectableFilteredIds.every((id) => selectedRowIds.includes(id));
    el.indeterminate = some && !all;
  }, [selectedRowIds, selectableFilteredIds]);

  const toggleRowSelected = (agent: HumanAgentType) => {
    if (agent.isClient) return;
    const id = String(agent._id);
    setSelectedRowIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAllFiltered = () => {
    const allSelected =
      selectableFilteredIds.length > 0 && selectableFilteredIds.every((id) => selectedRowIds.includes(id));
    if (allSelected) {
      setSelectedRowIds((prev) => prev.filter((id) => !selectableFilteredIds.includes(id)));
    } else {
      setSelectedRowIds((prev) => {
        const merged = [...prev, ...selectableFilteredIds];
        return merged.filter((id, i) => merged.indexOf(id) === i);
      });
    }
  };

  const handleBulkDelete = async () => {
    const toDelete = selectedRowIds.filter((id) => {
      const a = agents.find((ag) => String(ag._id) === id);
      return a && !a.isClient;
    });
    if (!toDelete.length) {
      setBulkDeleteOpen(false);
      return;
    }
    try {
      for (const id of toDelete) {
        socket?.emit('agent-deleted', { id });
        const result = await deleteAgent(id);
        if (result === 'error') {
          toast.error('Unauthorized: Please login again');
          setBulkDeleteOpen(false);
          return;
        }
      }
      if (toDelete.length) {
        toast.success(toDelete.length === 1 ? 'Team member removed' : `${toDelete.length} team members removed`);
      }
      setSelectedRowIds((prev) => prev.filter((id) => !toDelete.includes(id)));
      setBulkDeleteOpen(false);
      fetchAgents();
    } catch {
      toast.error('Failed to delete team member(s)');
      setBulkDeleteOpen(false);
    }
  };

  const handleRemoveAssignedWebsite = async (agent: HumanAgentType, websiteId: string) => {
    if (agent.isClient) return;
    const current = (agent.assignedAgents || []).map((id) => (typeof id === 'string' ? id : String((id as any)?.toString?.() ?? '')));
    const next = current.filter((id) => id !== String(websiteId));
    if (next.length === 0) {
      toast.warn('Keep at least one website assigned');
      return;
    }
    try {
      await updateHumanAgent(agent._id, { name: agent.name, assignedAgents: next });
      toast.success('Website unassigned');
      fetchAgents();
    } catch (e) {
      toast.error('Failed to update assignments');
    }
  };

  const getAccountStatusPresentation = (agent: HumanAgentType) => {
    if (agent.status === 'pending') {
      return {
        label: 'Pending',
        className: 'bg-amber-50 text-amber-600 border-amber-100',
        icon: 'clock' as const,
        dotActive: false,
      };
    }
    return {
      label: 'Online',
      className: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      icon: 'dot' as const,
      dotActive: true,
    };
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
      <div className="min-h-screen w-full bg-[#F8F9FA]">
        <div className="p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-1 sm:max-w-2xl">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} strokeWidth={2} />
                  <input
                    type="text"
                    placeholder="Search team members"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-full bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-shadow"
                  />
                </div>
                <div className="relative shrink-0">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as 'all' | 'pending' | 'approved')}
                    className="appearance-none pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-full bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer min-w-[140px]"
                  >
                    <option value="all">All Status</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    size={18}
                    strokeWidth={2}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-white bg-[#1A1C1E] hover:bg-[#0d0e10] transition-colors shadow-sm shrink-0"
              >
                <UserPlus size={18} strokeWidth={2} />
                Add New Team Member
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="w-12 py-4 pl-5 pr-2">
                        <input
                          ref={headerSelectAllRef}
                          type="checkbox"
                          checked={
                            selectableFilteredIds.length > 0 &&
                            selectableFilteredIds.every((id) => selectedRowIds.includes(id))
                          }
                          onChange={toggleSelectAllFiltered}
                          className="h-4 w-4 rounded-full border-slate-300 text-[#1A1C1E] focus:ring-slate-900/20"
                        />
                      </th>
                      <th className="text-left py-4 px-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                        Team
                      </th>
                      <th className="text-left py-4 px-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                        Role
                      </th>
                      <th className="text-left py-4 px-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                        Status
                      </th>
                      <th className="text-left py-4 px-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                        Activity
                      </th>
                      <th className="text-left py-4 px-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                        Assign website
                      </th>
                      <th className="text-right py-4 pr-5 pl-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAgents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-16">
                          <div className="flex flex-col items-center gap-3">
                            <UserX size={44} className="text-slate-200" strokeWidth={1.5} />
                            <p className="text-slate-600 font-medium">No team members found</p>
                            <p className="text-slate-400 text-sm">Invite agents or adjust your filters</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredAgents.map((agent: HumanAgentType) => {
                        const rowId = String(agent._id);
                        const statusUi = getAccountStatusPresentation(agent);
                        const avatarUrl = resolveHumanAgentAvatarUrl(agent.avatar);
                        const isClientRow = Boolean(agent.isClient);
                        return (
                          <tr key={rowId} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-4 pl-5 pr-2 align-middle">
                              <input
                                type="checkbox"
                                disabled={isClientRow}
                                checked={!isClientRow && selectedRowIds.includes(rowId)}
                                onChange={() => toggleRowSelected(agent)}
                                className="h-4 w-4 rounded-full border-slate-300 text-[#1A1C1E] focus:ring-slate-900/20 disabled:opacity-30 disabled:cursor-not-allowed"
                              />
                            </td>
                            <td className="py-4 px-3 align-middle">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-100 flex items-center justify-center">
                                  {avatarUrl ? (
                                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    <User className="h-5 w-5 text-slate-400" strokeWidth={1.75} />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-900 truncate">{agent.name}</p>
                                  <p className="text-sm text-slate-500 truncate">{agent.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-3 align-middle">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  isClientRow
                                    ? 'bg-[#EBF5FF] text-[#3B82F6]'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {isClientRow ? 'Admin' : 'Agent'}
                              </span>
                            </td>
                            <td className="py-4 px-3 align-middle">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusUi.className}`}
                              >
                                {statusUi.icon === 'clock' ? (
                                  <Clock size={12} strokeWidth={2} className="shrink-0" />
                                ) : (
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                      statusUi.dotActive ? 'bg-emerald-500' : 'bg-slate-400'
                                    }`}
                                  />
                                )}
                                {statusUi.label}
                              </span>
                            </td>
                            <td className="py-4 px-3 align-middle">
                              <button
                                type="button"
                                role="switch"
                                aria-checked={agent.isActive}
                                onClick={() => handleStatusToggle(rowId, agent.isActive)}
                                className={`relative inline-flex h-7 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400 ${
                                  agent.isActive ? 'bg-emerald-500' : 'bg-slate-200'
                                }`}
                              >
                                <span
                                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                                    agent.isActive ? 'translate-x-5' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </td>
                            <td className="py-4 px-3 align-middle max-w-[220px]">
                              {isClientRow ? (
                                <span className="text-slate-300 select-none">&nbsp;</span>
                              ) : (
                                <div className="flex flex-wrap gap-1.5">
                                  {agent.assignedAgents?.length ? (
                                    agent.assignedAgents.map((aid) => {
                                      const aidStr = typeof aid === 'string' ? aid : String((aid as any)?.toString?.() ?? aid);
                                      return (
                                        <span
                                          key={aidStr}
                                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 pl-2 pr-1 py-0.5 text-xs text-slate-600"
                                        >
                                          <span className="truncate max-w-[120px]">{getAgentName(aidStr)}</span>
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveAssignedWebsite(agent, aidStr)}
                                            className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                                            aria-label="Remove website"
                                          >
                                            <X size={12} strokeWidth={2} />
                                          </button>
                                        </span>
                                      );
                                    })
                                  ) : (
                                    <span className="text-slate-400 text-xs">—</span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="py-4 pr-5 pl-3 align-middle">
                              <div className="flex items-center justify-end gap-0.5">
                                <button
                                  type="button"
                                  disabled={isClientRow}
                                  onClick={() => openEditModal(agent)}
                                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-35 disabled:pointer-events-none transition-colors"
                                  title="Edit"
                                >
                                  <Pencil size={18} strokeWidth={1.75} />
                                </button>
                                {isClientRow ? (
                                  <span className="inline-flex w-[42px]" aria-hidden />
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(agent._id)}
                                    className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                    title="Delete"
                                  >
                                    <Trash size={18} strokeWidth={1.75} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {selectedRowIds.length > 0 && (
                <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/90 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedRowIds.length} selected
                    </p>
                    <p className="text-xs text-slate-500">Actions apply to selected rows</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBulkDeleteOpen(true)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
                  >
                    <Trash size={18} strokeWidth={1.75} />
                    Delete
                  </button>
                </div>
              )}
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

        {bulkDeleteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn">
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <Trash size={20} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Delete team members</h3>
                    <p className="text-sm text-slate-500">This cannot be undone.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBulkDeleteOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-slate-700">
                  Delete {selectedRowIds.length} selected team member{selectedRowIds.length === 1 ? '' : 's'}?
                </p>
                <div className="flex justify-end gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setBulkDeleteOpen(false)}
                    className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleBulkDelete()}
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
