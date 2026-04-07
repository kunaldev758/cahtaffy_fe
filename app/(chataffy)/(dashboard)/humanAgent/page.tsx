'use client'

import { useState, useEffect, useRef } from 'react'
import { X, User, Mail, Pencil, Trash, Plus, Search, UserX, Clock, Check, ChevronsUpDown } from "lucide-react";
import { toast } from 'react-toastify'
import { useSocket } from '@/app/socketContext'
import 'react-toastify/dist/ReactToastify.css'
import {
  getAllHumanAgents,
  getAIAgents,
  createHumanAgent,
  updateHumanAgent,
  deleteAgent,
  updateAgentStatus,
  updateClientStatus
} from '@/app/_api/dashboard/action'
import React from 'react';
import TopHead from '../_components/TopHead'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const checkboxUiClass =
  'h-[20px] w-[20px] rounded-[8px] border border-[#CBD5E1] shadow-none ' +
  'data-[state=checked]:border-[#4686FE] data-[state=checked]:bg-[#4686FE] data-[state=checked]:text-white ' +
  'data-[state=indeterminate]:border-[#4686FE] data-[state=indeterminate]:bg-[#4686FE] data-[state=indeterminate]:text-white ' +
  '[&_svg]:h-[14px] [&_svg]:w-[14px]'

const headerCheckboxUiClass =
  `${checkboxUiClass} data-[state=indeterminate]:border-[#CBD5E1] data-[state=indeterminate]:bg-white data-[state=indeterminate]:text-[#111827]`

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

/** Popover/Select portals sit outside DialogContent; Dialog would otherwise treat clicks as "outside" and block them. */
function isPointerFromRadixPopperLayer(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('[data-radix-popper-content-wrapper]'))
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
  const [addWebsitePopoverOpen, setAddWebsitePopoverOpen] = useState(false);
  const [editWebsitePopoverOpen, setEditWebsitePopoverOpen] = useState(false);
  const [addWebsiteSearch, setAddWebsiteSearch] = useState('');
  const [editWebsiteSearch, setEditWebsiteSearch] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<CreateHumanAgentData>({
    name: '',
    email: '',
    assignedAgents: []
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

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
      const uid = updatedAgent?.id ?? updatedAgent?._id;
      if (uid == null) return;
      const last =
        updatedAgent.lastActive != null
          ? typeof updatedAgent.lastActive === 'string'
            ? updatedAgent.lastActive
            : new Date(updatedAgent.lastActive).toISOString()
          : undefined;
      setAgents((prevAgents) =>
        prevAgents.map((agent) => {
          if (String(agent._id) !== String(uid)) return agent;
          const assigned =
            updatedAgent.assignedAgents != null
              ? Array.isArray(updatedAgent.assignedAgents)
                ? updatedAgent.assignedAgents.map((x: any) =>
                    typeof x === 'string' ? x : String(x?._id ?? x?.id ?? x ?? '')
                  )
                : agent.assignedAgents
              : agent.assignedAgents;
          return {
            ...agent,
            ...(updatedAgent.name != null ? { name: updatedAgent.name } : {}),
            ...(updatedAgent.status != null ? { status: updatedAgent.status } : {}),
            ...(updatedAgent.email != null ? { email: updatedAgent.email } : {}),
            ...(updatedAgent.avatar !== undefined ? { avatar: updatedAgent.avatar } : {}),
            ...(assigned !== undefined ? { assignedAgents: assigned } : {}),
            isActive: updatedAgent.isActive ?? agent.isActive,
            ...(last !== undefined ? { lastActive: last } : {}),
          };
        })
      );
    };

    socket.on('human-agent-status-updated', handleAgentStatusUpdate);
    socket.on('agent-status-updated', handleAgentStatusUpdate);
    socket.on('client-status-updated', handleAgentStatusUpdate);

    return () => {
      socket.off('human-agent-status-updated', handleAgentStatusUpdate);
      socket.off('agent-status-updated', handleAgentStatusUpdate);
      socket.off('client-status-updated', handleAgentStatusUpdate);
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
      } else if (response?.message === 'User with this email already exists') {
        toast.error(response.message);
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

  const handleStatusToggle = async (agent: HumanAgentType) => {
    const id = String(agent._id);
    const currentStatus = agent.isActive;
    try {
      const newStatus = !currentStatus;
      if (agent.isClient) {
        const response = await updateClientStatus(newStatus);
        if (response === 'error') {
          toast.error('Unauthorized: Please login again');
          return;
        }
        if (
          response &&
          typeof response === 'object' &&
          'status_code' in response &&
          (response as { status_code?: number }).status_code !== undefined &&
          (response as { status_code: number }).status_code !== 200
        ) {
          throw new Error((response as { message?: string }).message || 'Failed to update status');
        }
        const payloadAgent =
          response && typeof response === 'object' && 'agent' in response
            ? (response as { agent?: Record<string, unknown> }).agent
            : undefined;
        if (payloadAgent) {
          const u = payloadAgent as { _id?: unknown; id?: unknown; isActive?: boolean; lastActive?: unknown };
          const uid = u._id ?? u.id;
          const last =
            u.lastActive != null
              ? typeof u.lastActive === 'string'
                ? u.lastActive
                : new Date(u.lastActive as string | number | Date).toISOString()
              : undefined;
          setAgents((prev) =>
            prev.map((a) => {
              if (!a.isClient) return a;
              if (uid != null && String(a._id) !== String(uid)) return a;
              return {
                ...a,
                isActive: u.isActive ?? newStatus,
                ...(last !== undefined ? { lastActive: last } : {}),
              };
            })
          );
        } else {
          setAgents((prev) =>
            prev.map((a) => (a.isClient ? { ...a, isActive: newStatus } : a))
          );
        }
      } else {
        await updateAgentStatus(id, newStatus);
      }
      toast.success('Agent status updated successfully');
    } catch (error: any) {
      toast.error('Failed to update agent status');
      fetchAgents();
    }
  };

  const getAgentName = (agentId: string) => {
    const ai = aiAgents.find((a) => a._id === agentId || a._id?.toString() === agentId);
    return ai?.agentName || ai?.website_name || agentId;
  };

  const websiteIdExists = (websiteId: string) =>
    aiAgents.some((a) => String(a._id ?? '') === String(websiteId));

  const openEditModal = (agent: HumanAgentType) => {
    if (agent.isClient) return;
    setSelectedAgent(agent);
    const normalizedIds = (agent.assignedAgents || []).map((id) =>
      typeof id === 'string' ? id : (id as any)?.toString?.() || ''
    );
    const assignedForForm =
      aiAgents.length > 0 ? normalizedIds.filter((id) => id && websiteIdExists(id)) : normalizedIds;
    setFormData({
      name: agent.name,
      email: agent.email,
      assignedAgents: assignedForForm
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const resetModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setAddWebsitePopoverOpen(false);
    setEditWebsitePopoverOpen(false);
    setAddWebsiteSearch('');
    setEditWebsiteSearch('');
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

  const allSelectableRowsSelected =
    selectableFilteredIds.length > 0 && selectableFilteredIds.every((id) => selectedRowIds.includes(id));

  const hasPartialSelection =
    selectedRowIds.some((id) => selectableFilteredIds.includes(id)) && !allSelectableRowsSelected;

  const toggleRowSelected = (agent: HumanAgentType) => {
    if (agent.isClient) return;
    const id = String(agent._id);
    setSelectedRowIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAllFiltered = (shouldSelect: boolean) => {
    if (!shouldSelect) {
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
      label: 'Approved',
      className: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      icon: 'dot' as const,
      dotActive: true,
    };
  };

  const filteredAddWebsiteOptions = aiAgents.filter((ai) =>
    (ai.agentName || ai.website_name || String(ai._id ?? ''))
      .toLowerCase()
      .includes(addWebsiteSearch.toLowerCase())
  );

  const filteredEditWebsiteOptions = aiAgents.filter((ai) =>
    (ai.agentName || ai.website_name || String(ai._id ?? ''))
      .toLowerCase()
      .includes(editWebsiteSearch.toLowerCase())
  );

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
        <TopHead
          title="Human Agent"
          subtitle="Manage team members, permissions, and website assignments."
          showDatePicker={false}
          showWebsiteSelect={false}
          showNotificationBell={false}
          showStatusBadge={false}
        />

        <div className="rounded-tl-[30px] bg-[#F3F4F6] px-4 pb-[33px] pt-6 lg:px-6 flex flex-col gap-6 h-[calc(100%-89px)]">
          <div className="rounded-[20px] bg-white p-[20px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.02)] flex flex-col gap-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex w-full flex-wrap items-center gap-2.5 md:w-auto">
                <div className="flex h-10 w-full items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 md:w-64">
                  <Search className="h-4 w-4 shrink-0 text-[#94A3B8]" />
                  <input
                    type="text"
                    placeholder="Search Pages"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent text-[13px] text-[#111827] outline-none placeholder:text-[#94A3B8]"
                  />
                </div>

                <Select
                  value={filterStatus}
                  onValueChange={(v) => setFilterStatus(v as 'all' | 'pending' | 'approved')}
                >
                  <SelectTrigger className="h-10 w-32 border-[#E2E8F0] text-[13px] shadow-none rounded-lg">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex w-full flex-wrap items-center gap-2.5 md:w-auto">
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#111827] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#1f2937]"
                >
                  <Plus className="h-4 w-4" />
                  Add New Team Member
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-[16px] border border-[#E2E8F0] bg-white">
              <Table className="w-full min-w-[900px]">
                <TableHeader>
                  <TableRow className="h-[44px] border-b border-[#F1F5F9] bg-[#F8FAFC] hover:bg-[#F8FAFC]">
                    <TableHead className="w-[60px] !px-[20px] text-left">
                      <Checkbox
                        className={headerCheckboxUiClass}
                        checked={allSelectableRowsSelected ? true : hasPartialSelection ? 'indeterminate' : false}
                        onCheckedChange={(checked) => toggleSelectAllFiltered(Boolean(checked))}
                      />
                    </TableHead>
                    <TableHead className="!pl-0 !pr-[20px] text-[12px] font-medium text-[#94A3B8] uppercase tracking-wide">
                      Team
                    </TableHead>
                    <TableHead className="w-[130px] px-[20px] text-[12px] font-medium text-[#94A3B8] uppercase tracking-wide">
                      Role
                    </TableHead>
                    <TableHead className="w-[130px] px-[20px] text-[12px] font-medium text-[#94A3B8] uppercase tracking-wide">
                      Status
                    </TableHead>
                    <TableHead className="w-[130px] px-[20px] text-[12px] font-medium text-[#94A3B8] uppercase tracking-wide">
                      Activity
                    </TableHead>
                    <TableHead className="px-[20px] text-[12px] font-medium text-[#94A3B8] uppercase tracking-wide">
                      Assign website
                    </TableHead>
                    <TableHead className="w-[108px] px-[20px] text-right text-[12px] font-medium text-[#94A3B8] uppercase tracking-wide">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {filteredAgents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-16">
                        <div className="flex flex-col items-center gap-3 py-[50px]">
                          <span className="material-symbols-outlined text-[#64748B] !text-[60px]">
                            person_cancel
                          </span>
                          <p className="text-[#111827] font-bold text-[24px]">No Team Member Found</p>
                          <p className="text-[#64748B] text-[14px]">Invite agents or adjust your filters</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAgents.map((agent: HumanAgentType) => {
                      const rowId = String(agent._id);
                      const statusUi = getAccountStatusPresentation(agent);
                      const avatarUrl = resolveHumanAgentAvatarUrl(agent.avatar);
                      const isClientRow = Boolean(agent.isClient);
                      return (
                        <TableRow key={rowId} className="min-h-[50px] transition-colors hover:bg-[#F8FAFC]">
                            <TableCell className="w-[60px] !px-[20px] text-left">
                              {isClientRow ? (
                                <span className="inline-block h-[20px] w-[20px]" aria-hidden />
                              ) : (
                                <Checkbox
                                  className={checkboxUiClass}
                                  checked={selectedRowIds.includes(rowId)}
                                  onCheckedChange={() => toggleRowSelected(agent)}
                                />
                              )}
                            </TableCell>
                          <TableCell className="px-[20px] !pl-0 !pr-[20px] py-[10px]">
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
                          </TableCell>
                          <TableCell className="w-[130px] px-[20px] py-[10px]">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium border ${isClientRow
                                ? 'bg-[#EFF5FF] text-[#4686FE] border-[#4686FE]'
                                : 'bg-[#F8FAFC] text-[#64748B] border-[#64748B]'
                                }`}
                            >
                              {isClientRow ? 'Admin' : 'Agent'}
                            </span>
                          </TableCell>
                          <TableCell className="w-[130px] px-[20px] py-[10px]">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] font-medium h-[26px] min-h-[26px] ${statusUi.className}`}
                            >
                              {statusUi.icon === 'clock' ? (
                                <Clock size={12} strokeWidth={2} className="shrink-0" />
                              ) : (
                                <span
                                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusUi.dotActive ? 'bg-emerald-500' : 'bg-slate-400'
                                    }`}
                                />
                              )}
                              {statusUi.label}
                            </span>
                          </TableCell>
                          <TableCell className="w-[130px] px-[20px] py-[10px]">
                            <label className="toggle">
                              <input
                                className="toggle-checkbox"
                                type="checkbox"
                                checked={agent.isActive}
                                onChange={() => void handleStatusToggle(agent)}                              />
                              <div className="toggle-switch" />
                            </label>
                          </TableCell>
                          <TableCell className="px-[20px] py-[10px] max-w-[220px]">
                            {isClientRow ? (
                              <span className="text-slate-300 select-none">&nbsp;</span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {(() => {
                                  const rawIds =
                                    agent.assignedAgents?.map((aid) =>
                                      typeof aid === 'string'
                                        ? aid
                                        : String((aid as any)?.toString?.() ?? aid)
                                    ) ?? [];
                                  const rowWebsiteIds =
                                    aiAgents.length > 0 ? rawIds.filter((id) => id && websiteIdExists(id)) : rawIds;
                                  return rowWebsiteIds.length ? (
                                    rowWebsiteIds.map((aidStr) => (
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
                                    ))
                                  ) : (
                                    <span className="text-slate-400 text-xs">—</span>
                                  );
                                })()}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="px-[20px] !pl-0 !pr-[20px] py-[10px]">
                            <div className="flex items-center justify-end gap-0.5">
                                {isClientRow ? (
                                  <span className="inline-block h-8 w-8 shrink-0" aria-hidden />
                                ) : (
                                  <TooltipProvider delayDuration={0}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          type="button"
                                          onClick={() => openEditModal(agent)}
                                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94A3B8] transition-colors hover:bg-[#F1F5F9] hover:text-[#111827]"
                                        >
                                          <span className="material-symbols-outlined text-[#94A3B8] !text-[20px]">
                                            edit
                                          </span>
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>Edit</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}

                              {isClientRow ? (
                                <span className="inline-block h-8 w-8 shrink-0" aria-hidden />
                              ) : (
                                <TooltipProvider delayDuration={0}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        onClick={() => setConfirmDeleteId(agent._id)}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94A3B8] transition-colors hover:bg-red-50 hover:text-red-500"
                                      >
                                        <span className="material-symbols-outlined text-[#94A3B8] !text-[20px]">
                                          delete
                                        </span>
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              {selectedRowIds.length > 0 && (
                <div className="flex flex-col gap-3 border-t border-[#EEF2F7] bg-[#F8FAFC] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[14px] font-semibold leading-5 text-[#111827]">
                      {selectedRowIds.length} selected
                    </p>
                    <p className="text-[13px] leading-5 text-[#64748B]">Actions apply to selected content</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBulkDeleteOpen(true)}
                    className="inline-flex items-center gap-2 text-[14px] font-medium text-[#EC4899] transition-colors hover:text-[#DB2777]"
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
        <Dialog open={showAddModal} onOpenChange={(open) => { if (!open) resetModals() }}>
          <DialogContent
            className="w-full max-w-[450px] gap-0 overflow-hidden border border-[#E2E8F0] bg-white p-0"
            onPointerDownOutside={(e) => {
              if (isPointerFromRadixPopperLayer(e.target)) e.preventDefault()
            }}
            onInteractOutside={(e) => {
              if (isPointerFromRadixPopperLayer(e.target)) e.preventDefault()
            }}
          >
            <div className="flex items-center gap-2 border-b border-[#E5E5E5] bg-[#F9FBFD] px-[20px] py-[15px]">
              <h1 className="text-sm font-semibold text-[#111827]">Add New Human Agent</h1>
            </div>

            <form onSubmit={handleAddAgent} className="px-[20px] py-[18px]">
              <div className="space-y-4">
                <div>
                  <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">Full Name</label>
                  <div className='h-[40px] w-full rounded-[8px] border bg-white px-[14px] flex items-center gap-2 border-[#E2E8F0]'>
                    <span className="material-symbols-outlined !text-[16px] text-[#64748B]">
                      person
                    </span>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full text-[13px] text-[#111827] outline-none placeholder:text-[#94A3B8] ${formErrors.name ? 'border-red-300 bg-red-50' : 'border-[#E2E8F0]'}`}
                      placeholder="Enter agent full name"
                    />
                  </div>
                  {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">Email Address</label>
                  <div className='h-[40px] w-full rounded-[8px] border bg-white px-[14px] flex items-center gap-2 border-[#E2E8F0]'>
                    <span className="material-symbols-outlined !text-[16px] text-[#64748B]">
                      alternate_email
                    </span>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full text-[13px] text-[#111827] outline-none placeholder:text-[#94A3B8] ${formErrors.email ? 'border-red-300 bg-red-50' : ''}`}
                      placeholder="agent@example.com"
                    />
                  </div>
                  {formErrors.email && <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>}
                </div>

                <div>
                  <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">Assigned Websites (required)</label>
                  <Popover open={addWebsitePopoverOpen} onOpenChange={setAddWebsitePopoverOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex min-h-[40px] w-full items-center justify-between gap-2 rounded-[8px] border border-[#E2E8F0] bg-white px-[14px] py-1 text-left"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="material-symbols-outlined !text-[16px] text-[#64748B]">language</span>
                          {formData.assignedAgents.length === 0 ? (
                            <span className="text-[13px] text-[#94A3B8]">Select websites...</span>
                          ) : (
                            formData.assignedAgents.map((aid) => (
                              <span key={aid} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                                <span className="max-w-[140px] truncate">{getAgentName(aid)}</span>
                                <span
                                  role="button"
                                  tabIndex={0}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAssignedAgentsChange(aid, false);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleAssignedAgentsChange(aid, false);
                                    }
                                  }}
                                  className="material-symbols-outlined !text-[14px] text-slate-400 hover:text-slate-700"
                                >
                                  close
                                </span>
                              </span>
                            ))
                          )}
                        </div>
                        <ChevronsUpDown className="h-4 w-4 shrink-0 text-[#94A3B8]" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="z-[100] w-[--radix-popover-trigger-width] border-[#E2E8F0] p-2"
                      align="start"
                    >
                      <Input
                        value={addWebsiteSearch}
                        onChange={(e) => setAddWebsiteSearch(e.target.value)}
                        placeholder="Search websites..."
                        className="mb-2 h-9 border-[#E2E8F0] text-[13px]"
                      />
                      <div className="max-h-52 space-y-1 overflow-y-auto">
                        {filteredAddWebsiteOptions.length === 0 ? (
                          <p className="px-2 py-2 text-sm text-slate-500">No websites found.</p>
                        ) : (
                          filteredAddWebsiteOptions.map((ai) => {
                            const aid = String(ai._id ?? '');
                            const selected = formData.assignedAgents.includes(aid);
                            return (
                              <button
                                key={aid}
                                type="button"
                                onClick={() => handleAssignedAgentsChange(aid, !selected)}
                                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-[#334155] hover:bg-slate-50"
                              >
                                <span className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border ${selected ? 'border-[#4686FE] bg-[#4686FE] text-white' : 'border-[#CBD5E1] bg-white text-transparent'}`}>
                                  <Check className="h-3 w-3" />
                                </span>
                                <span className="truncate">{ai.agentName || ai.website_name || aid}</span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  {formErrors.assignedAgents && <p className="mt-1 text-sm text-red-600">{formErrors.assignedAgents}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-[20px] px-[20px] py-[20px] -mx-[20px] -mb-[18px]">
                <button type="button" className="cursor-pointer justify-center border border-[#E2E8F0] bg-white text-sm font-bold text-[#64748B] hover:text-[#111827] rounded-lg" onClick={resetModals}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || aiAgents.length === 0}
                  className="inline-flex justify-center h-10 items-center gap-2 rounded-lg bg-[#111827] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:bg-[#CBD5E1] disabled:text-[#64748B]"
                >
                  <span className="material-symbols-outlined !text-[18px]">add</span>
                  {isSubmitting ? 'Adding...' : 'Add Agent'}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Agent Modal */}
        <Dialog open={showEditModal && !!selectedAgent} onOpenChange={(open) => { if (!open) resetModals() }}>
          <DialogContent
            className="w-full max-w-[450px] gap-0 overflow-hidden border border-[#E2E8F0] bg-white p-0"
            onPointerDownOutside={(e) => {
              if (isPointerFromRadixPopperLayer(e.target)) e.preventDefault()
            }}
            onInteractOutside={(e) => {
              if (isPointerFromRadixPopperLayer(e.target)) e.preventDefault()
            }}
          >
            <div className="flex items-center gap-2 border-b border-[#E5E5E5] bg-[#F9FBFD] px-[20px] py-[15px]">
              <h1 className="text-sm font-semibold text-[#111827]">Edit Human Agent</h1>
            </div>

            <form onSubmit={handleEditAgent} className="px-[20px] py-[18px]">
              <div className="space-y-4">
                <div>
                  <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">Full Name</label>
                  <div className="relative">
                    <span className="material-symbols-outlined pointer-events-none absolute left-[12px] top-1/2 -translate-y-1/2 !text-[16px] text-[#94A3B8]">
                      person
                    </span>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`h-[40px] w-full rounded-[8px] border bg-white pl-[38px] pr-[14px] text-[13px] leading-5 text-[#111827] outline-none placeholder:text-[#94A3B8] ${formErrors.name ? 'border-red-300 bg-red-50' : 'border-[#E2E8F0]'}`}
                      placeholder="Enter agent full name"
                    />
                  </div>
                  {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">Email</label>
                  <div className="relative">
                    <span className="material-symbols-outlined pointer-events-none absolute left-[12px] top-1/2 -translate-y-1/2 !text-[16px] text-[#94A3B8]">
                      mail
                    </span>
                    <div className="h-[40px] w-full rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] pl-[38px] pr-[14px] text-[13px] leading-[40px] text-[#64748B]">
                      {selectedAgent?.email}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-[6px] block text-[12px] font-medium leading-5 text-[#64748B]">Assigned Websites (required)</label>
                  <Popover open={editWebsitePopoverOpen} onOpenChange={setEditWebsitePopoverOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex min-h-[40px] w-full items-center justify-between gap-2 rounded-[8px] border border-[#E2E8F0] bg-white px-[10px] py-1 text-left"
                      >
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="material-symbols-outlined !text-[16px] text-[#94A3B8]">language</span>
                          {formData.assignedAgents.length === 0 ? (
                            <span className="text-[13px] text-[#94A3B8]">Select websites...</span>
                          ) : (
                            formData.assignedAgents.map((aid) => (
                              <span key={aid} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                                <span className="max-w-[140px] truncate">{getAgentName(aid)}</span>
                                <span
                                  role="button"
                                  tabIndex={0}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAssignedAgentsChange(aid, false);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleAssignedAgentsChange(aid, false);
                                    }
                                  }}
                                  className="material-symbols-outlined !text-[14px] text-slate-400 hover:text-slate-700"
                                >
                                  close
                                </span>
                              </span>
                            ))
                          )}
                        </div>
                        <ChevronsUpDown className="h-4 w-4 shrink-0 text-[#94A3B8]" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="z-[100] w-[--radix-popover-trigger-width] border-[#E2E8F0] p-2"
                      align="start"
                    >
                      <Input
                        value={editWebsiteSearch}
                        onChange={(e) => setEditWebsiteSearch(e.target.value)}
                        placeholder="Search websites..."
                        className="mb-2 h-9 border-[#E2E8F0] text-[13px]"
                      />
                      <div className="max-h-52 space-y-1 overflow-y-auto">
                        {filteredEditWebsiteOptions.length === 0 ? (
                          <p className="px-2 py-2 text-sm text-slate-500">No websites found.</p>
                        ) : (
                          filteredEditWebsiteOptions.map((ai) => {
                            const aid = String(ai._id ?? '');
                            const selected = formData.assignedAgents.includes(aid);
                            return (
                              <button
                                key={aid}
                                type="button"
                                onClick={() => handleAssignedAgentsChange(aid, !selected)}
                                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-[#334155] hover:bg-slate-50"
                              >
                                <span className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border ${selected ? 'border-[#4686FE] bg-[#4686FE] text-white' : 'border-[#CBD5E1] bg-white text-transparent'}`}>
                                  <Check className="h-3 w-3" />
                                </span>
                                <span className="truncate">{ai.agentName || ai.website_name || aid}</span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  {formErrors.assignedAgents && <p className="mt-1 text-sm text-red-600">{formErrors.assignedAgents}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-[20px] px-[20px] py-[20px] -mx-[20px] -mb-[18px]">
                <button type="button" className="cursor-pointer justify-center border border-[#E2E8F0] bg-white text-sm font-bold text-[#64748B] hover:text-[#111827] rounded-lg" onClick={resetModals}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex justify-center h-10 items-center gap-2 rounded-lg bg-[#111827] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:bg-[#CBD5E1] disabled:text-[#64748B]"
                >
                  <span className="material-symbols-outlined !text-[18px]">save</span>
                  {isSubmitting ? 'Updating...' : 'Update Agent'}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

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
