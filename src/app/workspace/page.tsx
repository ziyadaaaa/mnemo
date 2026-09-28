 'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  FileText, Upload, Plus, CheckCircle2, AlertCircle, 
  Loader2, Search, Trash2, Tag, Eye, X, RefreshCw, 
  LayoutDashboard, Database, MessageSquare, Settings, 
  LogOut, Users, Activity as ActivityIcon, Shield, 
  Bell, Command, Share2, ArrowRight
} from 'lucide-react';

interface MemoryItem {
  id: string;
  title: string;
  type: string;
  category: string;
  dateAdded: string;
  status: 'indexed' | 'processing' | 'error';
  source: string;
  snippet?: string;
  content?: string;
  chunksCount?: number;
  error_message?: string;
}

interface StagingFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'indexed' | 'error';
  errorMessage?: string;
  category: string;
}

interface ActivityItem {
  id: string;
  action: string;
  target: string;
  timestamp: string;
  type: 'added' | 'indexed' | 'error' | 'deleted';
}

const CATEGORIES = ['General', 'Marketing', 'Engineering', 'Operations', 'Finance', 'Sales', 'Support'];
const FILE_TYPES = ['All', 'PDF', 'DOCX', 'TXT', 'CSV', 'XLSX', 'PPTX', 'MD'];
const ACCEPTED_TYPES = '.pdf,.docx,.txt,.csv,.xlsx,.pptx,.md';

export default function WorkspacePage() {
  const [activeNav, setActiveNav] = useState<'overview' | 'memory' | 'chat' | 'activity' | 'members' | 'connections' | 'settings'>('overview');
  
  // Dynamic Workspace State from DB
  const [companyName, setCompanyName] = useState<string>('Your workspace');
  const [userName, setUserName] = useState<string>('User');
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true);

  // Add Memory Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'upload' | 'manual'>('upload');
  const [memoryTitle, setMemoryTitle] = useState('');
  const [memoryText, setMemoryText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [isSubmittingText, setIsSubmittingText] = useState(false);
  const [textStatus, setTextStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // File Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<StagingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memory Library State
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [isLoadingMemories, setIsLoadingMemories] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal & Activity State
  const [selectedMemoryModal, setSelectedMemoryModal] = useState<MemoryItem | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [overviewPrompt, setOverviewPrompt] = useState('');

  useEffect(() => {
    fetchWorkspaceData();
    fetchMemories();
  }, []);

  const fetchWorkspaceData = async () => {
    try {
      setIsLoadingWorkspace(true);
      const res = await fetch('/api/workspace');
      if (res.ok) {
        const data = await res.json();
        if (data.companyName) setCompanyName(data.companyName);
        if (data.userName) setUserName(data.userName);
      }
    } catch (err) {
      console.error('Failed to fetch workspace metadata:', err);
    } finally {
      setIsLoadingWorkspace(false);
    }
  };

  const fetchMemories = async () => {
    try {
      setIsLoadingMemories(true);
      const res = await fetch('/api/memories');
      if (res.ok) {
        const data = await res.json();
        const items = data.memories || data || [];
        setMemories(items);
      }
    } catch (err) {
      console.error('Failed to fetch memories:', err);
    } finally {
      setIsLoadingMemories(false);
    }
  };

  const logActivity = (action: string, target: string, type: ActivityItem['type']) => {
    const newAct: ActivityItem = {
      id: Date.now().toString(),
      action,
      target,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type,
    };
    setActivities(prev => [newAct, ...prev.slice(0, 19)]);
  };

  const handleFilesSelected = (files: FileList | File[]) => {
    const newFiles: StagingFile[] = Array.from(files).map((file, idx) => ({
      id: `${Date.now()}-${idx}-${file.name}`,
      file,
      progress: 0,
      status: 'uploading',
      category: selectedCategory,
    }));

    setStagedFiles(prev => [...prev, ...newFiles]);

    newFiles.forEach(stagingItem => {
      uploadFileToBackend(stagingItem);
    });
  };

  const uploadFileToBackend = async (stagingItem: StagingFile) => {
    const formData = new FormData();
    formData.append('file', stagingItem.file);
    formData.append('category', stagingItem.category);

    const progressInterval = setInterval(() => {
      setStagedFiles(prev => prev.map(item => {
        if (item.id === stagingItem.id && item.status === 'uploading') {
          const nextProg = item.progress + 25;
          return { ...item, progress: nextProg >= 90 ? 90 : nextProg };
        }
        return item;
      }));
    }, 180);

    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Indexing failed.');
      }

      setStagedFiles(prev => prev.map(item => {
        if (item.id === stagingItem.id) {
          return { ...item, progress: 100, status: 'indexed' };
        }
        return item;
      }));

      logActivity('Document indexed successfully', stagingItem.file.name, 'indexed');
      fetchMemories();
    } catch (err: any) {
      clearInterval(progressInterval);
      setStagedFiles(prev => prev.map(item => {
        if (item.id === stagingItem.id) {
          return { ...item, status: 'error', errorMessage: err.message || 'Indexing failed.' };
        }
        return item;
      }));
      logActivity('Indexing failed', stagingItem.file.name, 'error');
    }
  };

  const retryUpload = (stagingItem: StagingFile) => {
    setStagedFiles(prev => prev.map(item => item.id === stagingItem.id ? { ...item, status: 'uploading', progress: 10, errorMessage: undefined } : item));
    uploadFileToBackend(stagingItem);
  };

  const handleSaveTextMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoryTitle.trim() || !memoryText.trim()) return;

    setIsSubmittingText(true);
    setTextStatus(null);

    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: memoryTitle,
          content: memoryText,
          category: selectedCategory,
          type: 'Text',
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save text memory');
      }

      setTextStatus({ type: 'success', message: 'Successfully saved and indexed to memory.' });
      logActivity('Note added to memory', memoryTitle, 'indexed');
      setMemoryTitle('');
      setMemoryText('');
      fetchMemories();
      setTimeout(() => setShowAddModal(false), 1000);
    } catch (err: any) {
      setTextStatus({ type: 'error', message: err.message || 'Failed to save note.' });
      logActivity('Failed to save manual memory', memoryTitle, 'error');
    } finally {
      setIsSubmittingText(false);
    }
  };

  const handleDeleteMemory = async (id: string, title: string = 'Memory') => {
    try {
      await fetch(`/api/memories/${id}`, { method: 'DELETE' });
    } catch {
      // local removal fallback
    }
    setMemories(prev => prev.filter(m => m.id !== id));
    if (selectedMemoryModal?.id === id) setSelectedMemoryModal(null);
    logActivity('Memory deleted', title, 'deleted');
  };

  const filteredMemories = memories.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.source?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesType = typeFilter === 'All' || item.type?.toUpperCase() === typeFilter.toUpperCase();
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesType && matchesStatus;
  });

  // Real Database Metrics & States
  const totalMemories = memories.length;
  const indexedCount = memories.filter(m => m.status === 'indexed' || !m.status).length;
  const processingCount = memories.filter(m => m.status === 'processing').length + stagedFiles.filter(f => f.status === 'uploading').length;
  const errorMemories = memories.filter(m => m.status === 'error');
  const errorStaged = stagedFiles.filter(f => f.status === 'error');
  const needsAttentionCount = errorMemories.length + errorStaged.length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] font-sans flex antialiased">
      
      {/* Persistent Dark Sidebar */}
      <aside className="w-64 border-r border-neutral-800 bg-[#0c0c0c] flex-col justify-between hidden md:flex sticky top-0 h-screen select-none">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center font-bold text-xs">
                M
              </div>
              <span className="font-semibold text-white tracking-tight">MNEMO</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">v1.2</span>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-500 px-3 pb-1">Workspace</p>
            <button 
              onClick={() => setActiveNav('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeNav === 'overview' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}
            >
              <LayoutDashboard className="w-4 h-4" /> Overview
            </button>
            <button 
              onClick={() => setActiveNav('memory')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeNav === 'memory' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}
            >
              <Database className="w-4 h-4" /> Memory
            </button>
            <button 
              onClick={() => window.location.href = '/chat'}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors"
            >
              <MessageSquare className="w-4 h-4" /> Ask Mnemo
            </button>
            <button 
              onClick={() => setActiveNav('activity')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeNav === 'activity' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}
            >
              <ActivityIcon className="w-4 h-4" /> Activity
            </button>
          </div>

          <div className="space-y-1 pt-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-500 px-3 pb-1">Management</p>
            <button 
              onClick={() => setActiveNav('members')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeNav === 'members' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}
            >
              <Users className="w-4 h-4" /> Members
            </button>
            <button 
              onClick={() => setActiveNav('connections')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeNav === 'connections' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}
            >
              <Share2 className="w-4 h-4" /> Connections
            </button>
            <button 
              onClick={() => setActiveNav('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeNav === 'settings' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}
            >
              <Settings className="w-4 h-4" /> Settings
            </button>
          </div>
        </div>

        <div className="p-6 border-t border-neutral-800/60 space-y-4 bg-neutral-950/40">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-xs font-medium text-white truncate">{companyName}</p>
              <p className="text-[10px] text-neutral-400 truncate">{userName}</p>
            </div>
            <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-medium text-white shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-neutral-900 text-xs">
            <span className="text-neutral-500">Account</span>
            <button 
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-1.5 text-neutral-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12 space-y-10">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-6 border-b border-neutral-800/80">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white">
              {activeNav === 'overview' && `Good morning, ${companyName}.`}
              {activeNav === 'memory' && "Memory Library"}
              {activeNav === 'activity' && "Workspace Activity"}
              {activeNav === 'members' && "Workspace Members"}
              {activeNav === 'connections' && "Knowledge Connections"}
              {activeNav === 'settings' && "Workspace Settings"}
            </h1>
            <p className="text-xs text-neutral-400 mt-1">Your company's memory, in one place.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400" />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 bg-white text-black text-xs font-medium px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add to Memory
            </button>
          </div>
        </div>

        {/* Workspace Overview */}
        {activeNav === 'overview' && (
          <div className="space-y-10">
            
            {/* Conditional Needs Attention Section */}
            {needsAttentionCount > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-medium text-red-400">
                  <AlertCircle className="w-4 h-4" /> {needsAttentionCount} item{needsAttentionCount > 1 ? 's' : ''} require your attention
                </div>
                <div className="space-y-2">
                  {errorStaged.map(err => (
                    <div key={err.id} className="flex items-center justify-between text-xs bg-neutral-950/80 border border-red-500/20 p-3 rounded-lg">
                      <span className="text-white truncate font-medium">{err.file.name} — <span className="text-red-400">{err.errorMessage || 'Indexing failed'}</span></span>
                      <button onClick={() => retryUpload(err)} className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[11px]">Retry</button>
                    </div>
                  ))}
                  {errorMemories.map(mem => (
                    <div key={mem.id} className="flex items-center justify-between text-xs bg-neutral-950/80 border border-red-500/20 p-3 rounded-lg">
                      <span className="text-white truncate font-medium">{mem.title} — <span className="text-red-400">{mem.error_message || 'Indexing error'}</span></span>
                      <button onClick={() => handleDeleteMemory(mem.id, mem.title)} className="text-neutral-400 hover:text-red-400">Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quiet Memory Status Line */}
            <div className="flex items-center justify-between bg-neutral-900/30 border border-neutral-800 rounded-xl px-5 py-3.5 text-xs">
              <div className="flex items-center gap-2 text-neutral-300 font-medium">
                <Database className="w-4 h-4 text-neutral-400" />
                {totalMemories === 0 ? (
                  <span>Your memory is empty.</span>
                ) : (
                  <span>
                    {totalMemories} memor{totalMemories === 1 ? 'y' : 'ies'} · {indexedCount} indexed{processingCount > 0 ? ` · ${processingCount} processing` : ''}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-neutral-500 font-mono">Secure Isolation Active</span>
            </div>

            {/* Primary Ask Mnemo Area */}
            <div className="bg-gradient-to-b from-neutral-900/80 to-neutral-900/40 border border-neutral-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
              <div className="space-y-1">
                <h2 className="text-lg font-medium text-white">What do you need to remember?</h2>
                <p className="text-xs text-neutral-400">Ask about a decision, client, project, process, document, or anything your team has stored.</p>
              </div>

              <div className="relative">
                <input 
                  type="text"
                  value={overviewPrompt}
                  onChange={(e) => setOverviewPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && overviewPrompt.trim()) {
                      window.location.href = `/chat?q=${encodeURIComponent(overviewPrompt)}`;
                    }
                  }}
                  placeholder="Ask about a decision, client, project, process, document..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-4 pr-32 py-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 shadow-inner"
                />
                <button
                  onClick={() => {
                    if (overviewPrompt.trim()) {
                      window.location.href = `/chat?q=${encodeURIComponent(overviewPrompt)}`;
                    } else {
                      window.location.href = '/chat';
                    }
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white hover:bg-neutral-200 text-black text-xs font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  Ask Mnemo <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Conditional Empty State or Recently Added Memories */}
            {totalMemories === 0 && stagedFiles.length === 0 ? (
              <div className="border border-neutral-800 rounded-2xl bg-neutral-900/20 p-12 text-center space-y-6">
                <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center mx-auto text-neutral-300">
                  <Database className="w-6 h-6" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-base font-medium text-white">Your company's memory is empty.</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Give Mnemo something to remember. Upload a document or add information manually.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <button onClick={() => setShowAddModal(true)} className="bg-white text-black text-xs font-medium px-5 py-2.5 rounded-lg hover:bg-neutral-200 transition-colors">
                    + Add to Memory
                  </button>
                </div>
                <div className="pt-6 border-t border-neutral-800/60 flex justify-center gap-8 text-xs text-neutral-500">
                  <span>1. Add</span>
                  <span>→</span>
                  <span>2. Remember</span>
                  <span>→</span>
                  <span>3. Ask</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white">Recently added</h3>
                  <button 
                    onClick={() => setActiveNav('memory')}
                    className="text-xs text-neutral-400 hover:text-white transition-colors"
                  >
                    View all →
                  </button>
                </div>

                <div className="border border-neutral-800 rounded-xl bg-neutral-900/30 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-900/80 text-neutral-400 font-medium uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Memory</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Category</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Added</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/40">
                      {memories.slice(0, 5).map(item => (
                        <tr key={item.id} onClick={() => setSelectedMemoryModal(item)} className="hover:bg-neutral-800/40 transition-colors cursor-pointer">
                          <td className="px-6 py-4 font-medium text-white">{item.title}</td>
                          <td className="px-6 py-4 text-neutral-400"><span className="px-2 py-0.5 rounded bg-neutral-800 text-[10px]">{item.type || 'PDF'}</span></td>
                          <td className="px-6 py-4 text-neutral-400">{item.category || 'General'}</td>
                          <td className="px-6 py-4"><span className="text-emerald-400 font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{item.status || 'Indexed'}</span></td>
                          <td className="px-6 py-4 text-right text-neutral-500">{item.dateAdded || 'Recently'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Memory Library View */}
        {activeNav === 'memory' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-neutral-400">Everything Mnemo knows about your company.</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search memory..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="All">All categories</option>
                  {CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-neutral-950">{cat}</option>)}
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="All">All types</option>
                  {FILE_TYPES.map(t => <option key={t} value={t} className="bg-neutral-950">{t}</option>)}
                </select>
              </div>
            </div>

            <div className="border border-neutral-800 rounded-xl bg-neutral-900/30 overflow-hidden">
              {isLoadingMemories ? (
                <div className="flex items-center justify-center py-16 text-neutral-500 gap-2 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading library...
                </div>
              ) : filteredMemories.length === 0 ? (
                <div className="text-center py-20 px-4 space-y-4">
                  <Database className="w-8 h-8 text-neutral-600 mx-auto" />
                  <div className="space-y-1 max-w-sm mx-auto">
                    <p className="text-sm font-medium text-white">Your memory library is empty.</p>
                    <p className="text-xs text-neutral-400">Add documents or notes to make them searchable and answerable.</p>
                  </div>
                  <button onClick={() => setShowAddModal(true)} className="bg-white text-black text-xs font-medium px-4 py-2 rounded-lg">
                    Add to Memory
                  </button>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-900/80 text-neutral-400 font-medium uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3">Title</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Added</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/40">
                    {filteredMemories.map(item => (
                      <tr key={item.id} className="hover:bg-neutral-800/40 transition-colors">
                        <td onClick={() => setSelectedMemoryModal(item)} className="px-6 py-4 font-medium text-white cursor-pointer">{item.title}</td>
                        <td className="px-6 py-4 text-neutral-400"><span className="px-2 py-0.5 rounded bg-neutral-800 text-[10px]">{item.type || 'PDF'}</span></td>
                        <td className="px-6 py-4 text-neutral-400">{item.category || 'General'}</td>
                        <td className="px-6 py-4"><span className="text-emerald-400 font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{item.status || 'Indexed'}</span></td>
                        <td className="px-6 py-4 text-neutral-500">{item.dateAdded || 'Recently'}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setSelectedMemoryModal(item)} className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white" title="Inspect">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteMemory(item.id, item.title)} className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-red-400" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Activity View */}
        {activeNav === 'activity' && (
          <div className="space-y-4 max-w-3xl">
            <h2 className="text-sm font-medium text-white">Recent Workspace Activity</h2>
            <div className="border border-neutral-800 rounded-xl bg-neutral-900/30 p-6 space-y-4">
              {activities.length === 0 ? (
                <p className="text-xs text-neutral-500">No recent activity logged in this session.</p>
              ) : (
                <div className="space-y-3">
                  {activities.map(act => (
                    <div key={act.id} className="flex items-center justify-between text-xs py-2 border-b border-neutral-800/50">
                      <span className="text-neutral-300">{act.timestamp} — <strong className="text-white">{act.action}</strong>: {act.target}</span>
                      <span className="text-neutral-500 uppercase text-[10px]">{act.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Members View */}
        {activeNav === 'members' && (
          <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
              <p className="text-xs text-neutral-400">Manage team access and permissions across your workspace.</p>
              <button onClick={() => alert('Invite modal simulation')} className="bg-white text-black text-xs font-medium px-4 py-2 rounded-lg">
                + Invite member
              </button>
            </div>
            <div className="border border-neutral-800 rounded-xl bg-neutral-900/30 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-900/80 text-neutral-400 font-medium uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Person</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/40">
                  <tr>
                    <td className="px-6 py-4 font-medium text-white">{userName} ({companyName.toLowerCase().replace(/\s+/g, '')} user)</td>
                    <td className="px-6 py-4 text-neutral-400">Owner</td>
                    <td className="px-6 py-4 text-emerald-400 font-medium">Active</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Connections View */}
        {activeNav === 'connections' && (
          <div className="space-y-6 max-w-3xl">
            <p className="text-xs text-neutral-400">Connect external apps and data sources to sync knowledge continuously.</p>
            <div className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-6 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-white">Google Drive</h3>
                <p className="text-xs text-neutral-400">Import and continuously sync your shared folder documents.</p>
              </div>
              <button onClick={() => alert('Google Drive OAuth simulation')} className="bg-white text-black text-xs font-medium px-4 py-2 rounded-lg">
                Connect Google Drive
              </button>
            </div>
          </div>
        )}

        {/* Settings View */}
        {activeNav === 'settings' && (
          <div className="space-y-6 max-w-2xl">
            <div className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-medium text-white">Workspace Settings</h3>
              <div className="space-y-2">
                <label className="block text-xs text-neutral-400">Company name</label>
                <input type="text" value={companyName} readOnly className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white opacity-80" />
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <h3 className="text-sm font-medium text-white">Add to company memory</h3>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs font-medium">
              <button 
                onClick={() => setAddMode('upload')}
                className={`flex-1 py-2 rounded-md transition-colors ${addMode === 'upload' ? 'bg-neutral-800 text-white' : 'text-neutral-400'}`}
              >
                Upload File
              </button>
              <button 
                onClick={() => setAddMode('manual')}
                className={`flex-1 py-2 rounded-md transition-colors ${addMode === 'manual' ? 'bg-neutral-800 text-white' : 'text-neutral-400'}`}
              >
                Manual Note
              </button>
            </div>

            {addMode === 'upload' ? (
              <div className="space-y-4">
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files) handleFilesSelected(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] ${
                    isDragging ? 'border-white bg-neutral-800/80' : 'border-neutral-700 hover:border-neutral-500 bg-neutral-950/40'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={(e) => e.target.files && handleFilesSelected(e.target.files)} 
                    multiple 
                    accept={ACCEPTED_TYPES}
                    className="hidden" 
                  />
                  <Upload className="w-6 h-6 text-neutral-400 mb-2" />
                  <p className="text-xs font-medium text-white">Drop files here or browse files</p>
                  <p className="text-[10px] text-neutral-500 mt-1">PDF · DOCX · TXT · CSV · XLSX · PPTX · MD</p>
                </div>

                {stagedFiles.length > 0 && (
                  <div className="space-y-2">
                    {stagedFiles.map((item) => (
                      <div key={item.id} className="bg-neutral-950 border border-neutral-800 p-3 rounded-lg text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white truncate">{item.file.name}</span>
                          {item.status === 'uploading' && <span className="text-neutral-400">{item.progress}%</span>}
                          {item.status === 'indexed' && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Indexed</span>}
                          {item.status === 'error' && (
                            <div className="flex items-center gap-2">
                              <span className="text-red-400 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Failed</span>
                              <button onClick={() => retryUpload(item)} className="px-2 py-0.5 bg-neutral-800 text-white rounded text-[10px]">Retry</button>
                            </div>
                          )}
                        </div>
                        {item.status === 'uploading' && (
                          <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-white h-full transition-all duration-200" style={{ width: `${item.progress}%` }} />
                          </div>
                        )}
                        {item.errorMessage && (
                          <p className="text-[10px] text-red-400">{item.errorMessage}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSaveTextMemory} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs text-neutral-400">Title</label>
                  <input 
                    type="text"
                    value={memoryTitle}
                    onChange={(e) => setMemoryTitle(e.target.value)}
                    placeholder="e.g. Client onboarding process"
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs text-neutral-400">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-neutral-950">{cat}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs text-neutral-400">Knowledge content</label>
                  <textarea
                    value={memoryText}
                    onChange={(e) => setMemoryText(e.target.value)}
                    rows={4}
                    placeholder="Type the knowledge Mnemo should remember..."
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-white resize-none"
                  />
                </div>

                {textStatus && (
                  <p className={`text-xs ${textStatus.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {textStatus.message}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-xs text-neutral-400 hover:text-white">Cancel</button>
                  <button type="submit" disabled={isSubmittingText} className="bg-white text-black text-xs font-medium px-4 py-2 rounded-lg">
                    {isSubmittingText ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save to memory'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Memory Details Modal */}
      {selectedMemoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
              <div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                  {selectedMemoryModal.type || 'PDF'} · {selectedMemoryModal.category || 'General'} · Indexed
                </span>
                <h3 className="text-lg font-medium text-white mt-2">{selectedMemoryModal.title}</h3>
              </div>
              <button onClick={() => setSelectedMemoryModal(null)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase font-medium text-neutral-400 tracking-wider">Memory content</p>
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 max-h-56 overflow-y-auto text-xs text-neutral-300 font-mono whitespace-pre-wrap leading-relaxed">
                {selectedMemoryModal.content || selectedMemoryModal.snippet || 'No extracted text preview available.'}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
              <button 
                onClick={() => window.location.href = `/chat?q=${encodeURIComponent(selectedMemoryModal.title)}`}
                className="bg-white text-black text-xs font-medium px-4 py-2 rounded-lg"
              >
                Ask Mnemo about this →
              </button>
              <button 
                onClick={() => handleDeleteMemory(selectedMemoryModal.id, selectedMemoryModal.title)}
                className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete memory
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}