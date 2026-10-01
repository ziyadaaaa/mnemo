 'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Database,
  FileText,
  LayoutDashboard,
  Loader2,
  LogOut,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Trash2,
  Upload,
  Users,
  X,
  Eye,
  Tag,
  Link as LinkIcon,
} from 'lucide-react';

interface MemoryRelationship {
  id: string;
  target_memory_id?: string;
  source_memory_id?: string;
  relationship_type: string;
  confidence: number;
  created_at: string;
}

interface MemoryItem {
  id: string;
  documentId?: string;
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
  outgoing_relationships?: MemoryRelationship[];
  incoming_relationships?: MemoryRelationship[];
}

interface StagingFile {
  id: string;
  file: File;
  status: 'ready' | 'uploading' | 'success' | 'error';
  message?: string;
}

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'success' | 'info' | 'error';
}

const CATEGORIES = [
  'General',
  'Marketing',
  'Engineering',
  'Operations',
  'Finance',
  'Sales',
  'Support',
];

const ACCEPTED_TYPES = '.md,.txt,.csv,.pdf';

function formatDate(value?: string) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatRelativeTime(value?: string) {
  if (!value) return 'Just now';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Just now';
  }

  const diff = Date.now() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return formatDate(value);
}

function getFileType(title: string, sourceType?: string) {
  const extension = title.split('.').pop()?.toUpperCase();

  if (extension) {
    return extension;
  }

  if (sourceType === 'upload') {
    return 'FILE';
  }

  return 'TEXT';
}

function normalizeMemory(item: any): MemoryItem {
  const sourceType = item?.source_type ?? item?.source ?? 'upload';

  return {
    id: String(item?.id ?? crypto.randomUUID()),
    documentId: item?.document_id
      ? String(item.document_id)
      : undefined,
    title: item?.title ?? 'Untitled memory',
    type: item?.type ?? getFileType(item?.title ?? '', sourceType),
    category: item?.category ?? 'General',
    dateAdded:
      item?.dateAdded ??
      item?.created_at ??
      item?.createdAt ??
      new Date().toISOString(),
    status: item?.status ?? 'indexed',
    source: item?.source ?? sourceType,
    snippet: item?.snippet ?? item?.content?.slice?.(0, 180),
    content: item?.content,
    chunksCount: item?.chunksCount,
    error_message: item?.error_message,
    outgoing_relationships: item?.outgoing_relationships ?? [],
incoming_relationships: item?.incoming_relationships ?? [],
  };
}

export default function WorkspacePage() {
  const [activeSection, setActiveSection] = useState('overview');

  const [workspaceName, setWorkspaceName] = useState('Your workspace');
  const [userEmail, setUserEmail] = useState('');

  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
   const [billing, setBilling] = useState<{
  status: string;
  priceId: string | null;
  currentPeriodEnd: string | null;
  hasSubscription: boolean;
} | null>(null); 

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [selectedMemory, setSelectedMemory] =
    useState<MemoryItem | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [manualTitle, setManualTitle] = useState('');
  const [manualContent, setManualContent] = useState('');

  const [stagingFiles, setStagingFiles] = useState<StagingFile[]>([]);
const [uploading, setUploading] = useState(false);
const [uploadCategory, setUploadCategory] = useState('General');

  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const addActivity = (
    title: string,
    description: string,
    type: ActivityItem['type'] = 'info'
  ) => {
    const activity: ActivityItem = {
      id: crypto.randomUUID(),
      title,
      description,
      time: new Date().toISOString(),
      type,
    };

    setActivities((current) => [activity, ...current].slice(0, 20));
  };

  const showNotification = (
    message: string,
    type: 'success' | 'error' | 'info' = 'info'
  ) => {
    setNotification({ message, type });

    window.setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const fetchWorkspace = async () => {
    try {
      const response = await fetch('/api/workspace', {
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        return;
      }

      if (data?.workspace?.name) {
        setWorkspaceName(data.workspace.name);
      }

      if (data?.user?.email) {
        setUserEmail(data.user.email);
      }
    } catch {
      // Workspace information is non-blocking.
    }
  };

  const fetchMemories = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoadingMemories(true);
      }

      const response = await fetch('/api/memories', {
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || 'Unable to load workspace memory.'
        );
      }

      /*
       * The API currently returns:
       *
       * {
       *   success: true,
       *   workspaceId: "...",
       *   data: [...]
       * }
       *
       * We deliberately handle all three possible shapes so the
       * page can never accidentally call .filter() on an object.
       */
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.memories)
            ? data.memories
            : [];

      setMemories(items.map(normalizeMemory));
     const billingResponse = await fetch('/api/billing/status', {
  method: 'GET',
  credentials: 'include',
  cache: 'no-store',
});

if (billingResponse.ok) {
  const billingData = await billingResponse.json();
  setBilling(billingData.subscription);
}
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load memories.';

      showNotification(message, 'error');
      setMemories([]);
    } finally {
      setLoadingMemories(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkspace();
    fetchMemories();
  }, []);

  const filteredMemories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return memories.filter((memory) => {
      const matchesSearch =
        !query ||
        memory.title.toLowerCase().includes(query) ||
        memory.category.toLowerCase().includes(query) ||
        memory.source.toLowerCase().includes(query) ||
        (memory.content ?? '').toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === 'All' ||
        memory.category === categoryFilter;

      const matchesStatus =
        statusFilter === 'All' ||
        memory.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [memories, searchQuery, categoryFilter, statusFilter]);

  const indexedCount = memories.filter(
    (memory) => memory.status === 'indexed'
  ).length;

  const errorCount = memories.filter(
    (memory) => memory.status === 'error'
  ).length;

  const openMemory = (memory: MemoryItem) => {
    setSelectedMemory(memory);
    setShowMemoryModal(true);
  };

  const handleFilesSelected = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files ?? []);

    if (!files.length) {
      return;
    }

    const oversizedFiles = files.filter(
      (file) => file.size > 50 * 1024 * 1024
    );

    if (oversizedFiles.length) {
      showNotification(
        'Each file must be 50 MB or smaller.',
        'error'
      );
    }

    const invalidFiles = files.filter((file) => {
      const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
return !['.md', '.txt', '.csv', '.pdf'].includes(extension);
    });

    if (invalidFiles.length) {
      showNotification(
        'Mnemo currently accepts Markdown, TXT, CSV, and PDF files.',
        'error'
      );
    }

    const validFiles = files.filter((file) => {
      const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
      return (
        ['.md', '.txt', '.csv', '.pdf'].includes(extension) &&
        file.size <= 50 * 1024 * 1024
      );
    });

    const newFiles: StagingFile[] = validFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: 'ready',
    }));

    setStagingFiles((current) => [...current, ...newFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeStagedFile = (id: string) => {
    setStagingFiles((current) =>
      current.filter((item) => item.id !== id)
    );
  };

  const uploadFiles = async () => {
    if (!stagingFiles.length) {
      showNotification('Choose at least one file first.', 'error');
      return;
    }

    setUploading(true);

    let successCount = 0;

    for (const staged of stagingFiles) {
      setStagingFiles((current) =>
        current.map((item) =>
          item.id === staged.id
            ? { ...item, status: 'uploading' }
            : item
        )
      );

      try {
        const formData = new FormData();
formData.append('file', staged.file);
formData.append('category', uploadCategory);

        const response = await fetch('/api/ingest', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || `Failed to upload ${staged.file.name}.`
          );
        }

        successCount += 1;

        setStagingFiles((current) =>
          current.map((item) =>
            item.id === staged.id
              ? {
                  ...item,
                  status: 'success',
                  message: 'Indexed successfully',
                }
              : item
          )
        );

        addActivity(
          'Memory added',
          `${staged.file.name} was added to company memory.`,
          'success'
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Upload failed.';

        setStagingFiles((current) =>
          current.map((item) =>
            item.id === staged.id
              ? {
                  ...item,
                  status: 'error',
                  message,
                }
              : item
          )
        );

        addActivity(
          'Upload failed',
          `${staged.file.name}: ${message}`,
          'error'
        );
      }
    }

    setUploading(false);

    if (successCount > 0) {
      showNotification(
        `${successCount} file${successCount === 1 ? '' : 's'} added to memory.`,
        'success'
      );

      await fetchMemories(true);

      window.setTimeout(() => {
        setStagingFiles([]);
        setShowAddModal(false);
      }, 700);
    } else {
      showNotification(
        'No files were added. Check the errors above.',
        'error'
      );
    }
  };

  const addManualNote = async () => {
    const title = manualTitle.trim();
    const content = manualContent.trim();

    if (!title || !content) {
      showNotification(
        'Enter both a title and some content.',
        'error'
      );
      return;
    }

    /*
     * The current /api/ingest endpoint is the file-ingestion endpoint.
     * Manual-note persistence should use its own server route rather
     * than pretending a JSON body is a file upload.
     *
     * For now we keep the UI honest and tell the user exactly what
     * remains to be connected.
     */
    showNotification(
      'Manual notes are not connected to the backend yet. Use Upload File for now.',
      'info'
    );
  };

  const openOriginalFile = async () => {
    if (!selectedMemory) {
      return;
    }

    if (!selectedMemory.documentId) {
      showNotification(
        'This memory does not have an original file yet.',
        'error'
      );
      return;
    }

    try {
      const response = await fetch(
        `/api/documents/${selectedMemory.documentId}/file`
      );

      const data = await response.json();

      if (!response.ok || !data?.url) {
        throw new Error(
          data?.error || 'Unable to open the original file.'
        );
      }

      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to open the original file.';

      showNotification(message, 'error');
    }
  };

  const deleteMemory = async () => {
    if (!selectedMemory) {
      return;
    }

    try {
      const response = await fetch(
        `/api/memories/${selectedMemory.id}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || 'Unable to delete this memory.'
        );
      }

      setMemories((current) =>
        current.filter(
          (memory) => memory.id !== selectedMemory.id
        )
      );

      addActivity(
        'Memory deleted',
        `${selectedMemory.title} was removed from company memory.`,
        'success'
      );

      showNotification('Memory deleted.', 'success');

      setShowDeleteModal(false);
      setShowMemoryModal(false);
      setSelectedMemory(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to delete memory.';

      showNotification(message, 'error');
    }
  };

  const handleSignOut = () => {
    /*
     * Authentication remains handled by the existing auth flow.
     * The workspace itself does not need to maintain a second
     * authentication state.
     */
    window.location.href = '/';
  };

  const resetAddModal = () => {
    setManualTitle('');
    setManualContent('');
    setStagingFiles([]);
  };

  const navigate = (section: string) => {
    setActiveSection(section);
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      {/* Notification */}
      {notification && (
        <div className="fixed right-5 top-5 z-[100] w-[360px] max-w-[calc(100vw-40px)]">
          <div
            className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl ${
              notification.type === 'success'
                ? 'border-emerald-500/20 bg-emerald-500/10'
                : notification.type === 'error'
                  ? 'border-red-500/20 bg-red-500/10'
                  : 'border-white/10 bg-white/[0.06]'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            ) : (
              <Activity className="mt-0.5 h-5 w-5 shrink-0 text-white/60" />
            )}

            <p className="text-sm leading-5 text-white/80">
              {notification.message}
            </p>

            <button
              onClick={() => setNotification(null)}
              className="ml-auto text-white/30 transition hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-[250px] shrink-0 border-r border-white/[0.07] bg-[#090909] lg:flex lg:flex-col">
          <div className="flex h-20 items-center border-b border-white/[0.07] px-6">
            <div>
              <div className="text-xl font-semibold tracking-[-0.04em]">
                mnemo
              </div>
              <div className="mt-0.5 text-[10px] uppercase tracking-[0.22em] text-white/30">
                Company memory
              </div>
            </div>
          </div>

          <div className="border-b border-white/[0.07] px-4 py-4">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-3">
              <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-white/30">
                Workspace
              </div>

              <div className="truncate text-sm font-medium text-white/90">
                {workspaceName}
              </div>

              <div className="mt-1 truncate text-xs text-white/30">
                {userEmail || 'Authenticated workspace'}
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-5">
            <div className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-white/25">
              Workspace
            </div>

            <SidebarButton
              active={activeSection === 'overview'}
              icon={<LayoutDashboard className="h-4 w-4" />}
              label="Overview"
              onClick={() => navigate('overview')}
            />

            <SidebarButton
              active={activeSection === 'memory'}
              icon={<Database className="h-4 w-4" />}
              label="Memory"
              badge={memories.length}
              onClick={() => navigate('memory')}
            />

            <SidebarButton
              active={activeSection === 'chat'}
              icon={<MessageSquare className="h-4 w-4" />}
              label="Ask Mnemo"
              onClick={() => {
                window.location.href = '/chat';
              }}
            />

            <SidebarButton
              active={activeSection === 'activity'}
              icon={<Activity className="h-4 w-4" />}
              label="Activity"
              onClick={() => navigate('activity')}
            />

            <div className="mb-2 mt-7 px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-white/25">
              Manage
            </div>

            <SidebarButton
              active={activeSection === 'members'}
              icon={<Users className="h-4 w-4" />}
              label="Members"
              onClick={() => navigate('members')}
            />

            <SidebarButton
              active={activeSection === 'connections'}
              icon={<LinkIcon className="h-4 w-4" />}
              label="Connections"
              onClick={() => navigate('connections')}
            />

            <SidebarButton
              active={activeSection === 'settings'}
              icon={<Settings className="h-4 w-4" />}
              label="Settings"
              onClick={() => navigate('settings')}
            />
          </nav>

          <div className="border-t border-white/[0.07] p-3">
            <div className="mb-2 flex items-center gap-2 rounded-xl bg-emerald-500/[0.06] px-3 py-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
              </div>

              <div>
                <div className="text-xs font-medium text-white/70">
                  Secure isolation
                </div>
                <div className="text-[10px] text-emerald-400/60">
                  Workspace protected
                </div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/40 transition hover:bg-white/[0.04] hover:text-white/80"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/[0.07] bg-[#070707]/90 px-5 backdrop-blur-xl sm:px-8">
            <div>
              <div className="text-sm font-medium text-white/90">
                {activeSection === 'overview' && 'Overview'}
                {activeSection === 'memory' && 'Company Memory'}
                {activeSection === 'chat' && 'Ask Mnemo'}
                {activeSection === 'activity' && 'Activity'}
                {activeSection === 'members' && 'Members'}
                {activeSection === 'connections' && 'Connections'}
                {activeSection === 'settings' && 'Settings'}
              </div>

              <div className="mt-0.5 hidden text-xs text-white/30 sm:block">
                {workspaceName}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchMemories(true)}
                disabled={refreshing}
                className="flex h-9 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 text-xs text-white/50 transition hover:bg-white/[0.05] hover:text-white/80 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    refreshing ? 'animate-spin' : ''
                  }`}
                />
                <span className="hidden sm:block">Refresh</span>
              </button>

              <button
                onClick={() => {
                  resetAddModal();
                  setShowAddModal(true);
                }}
                className="flex h-9 items-center gap-2 rounded-xl bg-white px-3.5 text-xs font-semibold text-black transition hover:bg-white/90"
              >
                <Plus className="h-3.5 w-3.5" />
                Add memory
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:px-10">
            {/* Overview */}
            {activeSection === 'overview' && (
              <section>
                <div className="mb-8">
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-white/25">
                    Workspace overview
                  </div>

                  <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                    {workspaceName}
                  </h1>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/40">
                    Your company&apos;s knowledge, decisions, documents,
                    and context in one searchable memory layer.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label="Total memories"
                    value={memories.length}
                    description="Indexed knowledge items"
                    icon={<Database className="h-4 w-4" />}
                  />

                  <StatCard
                    label="Indexed"
                    value={indexedCount}
                    description="Ready for AI retrieval"
                    icon={<CheckCircle2 className="h-4 w-4" />}
                  />

                  <StatCard
                    label="Needs attention"
                    value={errorCount}
                    description="Items with ingestion errors"
                    icon={<AlertCircle className="h-4 w-4" />}
                  />

                  <StatCard
                    label="Workspace"
                    value="Protected"
                    description="Tenant-isolated memory"
                    icon={<Shield className="h-4 w-4" />}
                  />
                </div>

                <div className="mt-8 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02]">
                    <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
                      <div>
                        <h2 className="text-sm font-medium text-white/90">
                          Recent memory
                        </h2>
                        <p className="mt-1 text-xs text-white/30">
                          Latest knowledge available to Mnemo.
                        </p>
                      </div>

                      <button
                        onClick={() => navigate('memory')}
                        className="flex items-center gap-1.5 text-xs text-white/40 transition hover:text-white"
                      >
                        View all
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="divide-y divide-white/[0.06]">
                      {loadingMemories ? (
                        <LoadingRow />
                      ) : memories.length === 0 ? (
                        <EmptyState
                          title="No memories yet"
                          description="Upload your first company document to begin building memory."
                          action={
                            <button
                              onClick={() => {
                                resetAddModal();
                                setShowAddModal(true);
                              }}
                              className="mt-4 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black"
                            >
                              Add your first memory
                            </button>
                          }
                        />
                      ) : (
                        memories.slice(0, 6).map((memory) => (
                          <MemoryRow
                            key={memory.id}
                            memory={memory}
                            onClick={() => openMemory(memory)}
                          />
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02]">
                    <div className="border-b border-white/[0.07] px-5 py-4">
                      <h2 className="text-sm font-medium text-white/90">
                        Recent activity
                      </h2>
                      <p className="mt-1 text-xs text-white/30">
                        Changes made during this session.
                      </p>
                    </div>

                    <div className="p-5">
                      {activities.length === 0 ? (
                        <div className="py-8 text-center">
                          <Activity className="mx-auto h-5 w-5 text-white/20" />
                          <p className="mt-3 text-xs text-white/30">
                            No recent activity.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-5">
                          {activities.slice(0, 6).map((item) => (
                            <ActivityRow
                              key={item.id}
                              item={item}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Memory */}
            {activeSection === 'memory' && (
              <section>
                <div className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
                  <div>
                    <div className="mb-2 text-xs uppercase tracking-[0.2em] text-white/25">
                      Knowledge base
                    </div>

                    <h1 className="text-3xl font-semibold tracking-[-0.04em]">
                      Company Memory
                    </h1>

                    <p className="mt-2 text-sm text-white/40">
                      Everything Mnemo can currently retrieve for this
                      workspace.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      resetAddModal();
                      setShowAddModal(true);
                    }}
                    className="flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-semibold text-black"
                  >
                    <Plus className="h-4 w-4" />
                    Add memory
                  </button>
                </div>

                <div className="mb-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3">
                  <div className="flex flex-col gap-3 xl:flex-row">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />

                      <input
                        value={searchQuery}
                        onChange={(event) =>
                          setSearchQuery(event.target.value)
                        }
                        placeholder="Search company memory..."
                        className="h-10 w-full rounded-xl border border-white/[0.07] bg-black/20 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/15"
                      />
                    </div>

                    <select
                      value={categoryFilter}
                      onChange={(event) =>
                        setCategoryFilter(event.target.value)
                      }
                      className="h-10 rounded-xl border border-white/[0.07] bg-[#101010] px-3 text-xs text-white/60 outline-none"
                    >
                      <option value="All">All categories</option>

                      {CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(event) =>
                        setStatusFilter(event.target.value)
                      }
                      className="h-10 rounded-xl border border-white/[0.07] bg-[#101010] px-3 text-xs text-white/60 outline-none"
                    >
                      <option value="All">All status</option>
                      <option value="indexed">Indexed</option>
                      <option value="processing">Processing</option>
                      <option value="error">Error</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
                  <div className="hidden grid-cols-[minmax(0,2fr)_120px_140px_120px_100px] gap-4 border-b border-white/[0.07] px-5 py-3 text-[10px] uppercase tracking-[0.16em] text-white/25 md:grid">
                    <div>Memory</div>
                    <div>Type</div>
                    <div>Category</div>
                    <div>Added</div>
                    <div>Status</div>
                  </div>

                  {loadingMemories ? (
                    <LoadingRow />
                  ) : filteredMemories.length === 0 ? (
                    <EmptyState
                      title={
                        memories.length === 0
                          ? 'Your memory is empty'
                          : 'No memories match'
                      }
                      description={
                        memories.length === 0
                          ? 'Upload Markdown, TXT, or CSV files to start building your company memory.'
                          : 'Try a different search or filter.'
                      }
                      action={
                        memories.length === 0 ? (
                          <button
                            onClick={() => {
                              resetAddModal();
                              setShowAddModal(true);
                            }}
                            className="mt-4 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black"
                          >
                            Upload a file
                          </button>
                        ) : undefined
                      }
                    />
                  ) : (
                    filteredMemories.map((memory) => (
                      <MemoryTableRow
                        key={memory.id}
                        memory={memory}
                        onClick={() => openMemory(memory)}
                      />
                    ))
                  )}
                </div>
              </section>
            )}

            {/* Chat */}
            {activeSection === 'chat' && (
              <section>
                <div className="mx-auto max-w-3xl">
                  <div className="mb-8">
                    <div className="mb-2 text-xs uppercase tracking-[0.2em] text-white/25">
                      Company intelligence
                    </div>

                    <h1 className="text-3xl font-semibold tracking-[-0.04em]">
                      Ask Mnemo
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-white/40">
                      Ask questions about your company&apos;s documents
                      and retrieve answers with source context.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 sm:p-8">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04]">
                      <MessageSquare className="h-5 w-5 text-white/60" />
                    </div>

                    <h2 className="mt-5 text-center text-lg font-medium">
                      Ask questions about {workspaceName}
                    </h2>

                    <p className="mx-auto mt-2 max-w-md text-center text-sm leading-6 text-white/35">
                      Mnemo searches your workspace memory and returns
                      answers grounded in the documents you have indexed.
                    </p>

                    <button
                      onClick={() => {
                        window.location.href = '/chat';
                      }}
                      className="mx-auto mt-6 flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
                    >
                      Open company chat
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Activity */}
            {activeSection === 'activity' && (
              <section>
                <div className="mb-7">
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-white/25">
                    Workspace history
                  </div>

                  <h1 className="text-3xl font-semibold tracking-[-0.04em]">
                    Activity
                  </h1>

                  <p className="mt-2 text-sm text-white/40">
                    Recent changes made during this session.
                  </p>
                </div>

                <div className="max-w-3xl rounded-2xl border border-white/[0.07] bg-white/[0.02]">
                  {activities.length === 0 ? (
                    <EmptyState
                      title="No activity yet"
                      description="Upload a document or make a workspace change and activity will appear here."
                    />
                  ) : (
                    <div className="divide-y divide-white/[0.06]">
                      {activities.map((item) => (
                        <ActivityRow
                          key={item.id}
                          item={item}
                          detailed
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Members */}
            {activeSection === 'members' && (
              <section>
                <div className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
                  <div>
                    <div className="mb-2 text-xs uppercase tracking-[0.2em] text-white/25">
                      Access control
                    </div>

                    <h1 className="text-3xl font-semibold tracking-[-0.04em]">
                      Members
                    </h1>

                    <p className="mt-2 text-sm text-white/40">
                      Manage who can access this workspace.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-semibold text-black"
                  >
                    <Plus className="h-4 w-4" />
                    Invite member
                  </button>
                </div>

                <div className="max-w-3xl overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
                  <div className="flex items-center justify-between border-b border-white/[0.07] p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05]">
                        <Users className="h-4 w-4 text-white/50" />
                      </div>

                      <div>
                        <div className="text-sm font-medium">
                          Workspace owner
                        </div>
                        <div className="mt-1 text-xs text-white/30">
                          {userEmail || 'Current account'}
                        </div>
                      </div>
                    </div>

                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-400">
                      OWNER
                    </span>
                  </div>

                  <div className="p-5 text-xs leading-6 text-white/35">
                    Additional member invitations will be connected to
                    the workspace membership system here.
                  </div>
                </div>
              </section>
            )}

            {/* Connections */}
            {activeSection === 'connections' && (
              <section>
                <div className="mb-7">
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-white/25">
                    Data sources
                  </div>

                  <h1 className="text-3xl font-semibold tracking-[-0.04em]">
                    Connections
                  </h1>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/40">
                    Connect the systems where your company&apos;s
                    knowledge lives.
                  </p>
                </div>

                <div className="grid max-w-4xl gap-4 md:grid-cols-2">
                  <ConnectionCard
                    title="File upload"
                    description="Upload Markdown, TXT, and CSV documents directly into company memory."
                    connected
                    icon={<Upload className="h-5 w-5" />}
                  />

                 <ConnectionCard
  title="Google Drive"
  description="Connect company documents from Google Drive."
  icon={<Database className="h-5 w-5" />}
  onClick={async () => {
    try {
      const statusResponse = await fetch(
        '/api/integrations/google/status',
        {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        }
      );

      const statusData =
        await statusResponse.json();

      if (!statusData.connected) {
        window.location.href =
          '/api/auth/google';
        return;
      }

      showNotification(
        'Google Drive is connected. Starting sync...',
        'info'
      );

      const syncResponse = await fetch(
        '/api/integrations/google/sync',
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      const syncData =
        await syncResponse.json();

      if (!syncResponse.ok) {
        showNotification(
          syncData.error ||
            'Google Drive sync failed.',
          'error'
        );
        return;
      }

      showNotification(
        `Google Drive sync complete: ${syncData.imported} imported, ${syncData.skipped} skipped, ${syncData.failed} failed.`,
        'success'
      );
    } catch {
      showNotification(
        'Could not sync Google Drive.',
        'error'
      );
    }
  }}
/>

                  <ConnectionCard
                    title="Slack"
                    description="Bring conversations and decisions into company memory."
                    icon={<MessageSquare className="h-5 w-5" />}
                    onClick={() =>
                      showNotification(
                        'Slack connection is planned for a future integration.',
                        'info'
                      )
                    }
                  />

                  <ConnectionCard
                    title="Email"
                    description="Connect business email to create a searchable organizational memory."
                    icon={<LinkIcon className="h-5 w-5" />}
                    onClick={() =>
                      showNotification(
                        'Email connection is planned for a future integration.',
                        'info'
                      )
                    }
                  />
                </div>
              </section>
            )}

            {/* Settings */}
            {activeSection === 'settings' && (
              <section>
                <div className="mb-7">
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-white/25">
                    Workspace configuration
                  </div>

                  <h1 className="text-3xl font-semibold tracking-[-0.04em]">
                    Settings
                  </h1>

                  <p className="mt-2 text-sm text-white/40">
                    Workspace and security information.
                  </p>
                </div>

                <div className="max-w-3xl space-y-4">
                  <SettingsRow
                    title="Workspace"
                    description="The company workspace currently connected to your account."
                    value={workspaceName}
                  />

                  <SettingsRow
                    title="Account"
                    description="Authenticated account associated with this workspace."
                    value={userEmail || 'Authenticated'}
                  />

                  <SettingsRow
                    title="Memory isolation"
                    description="Queries and memory records are scoped to the authenticated workspace."
                    value="Active"
                    positive
                  />

                  <SettingsRow
                    title="Indexed memories"
                    description="Number of knowledge records currently available."
                    value={String(memories.length)}
                  />
                  <SettingsRow
  title="Subscription"
  description="Current Stripe subscription for this workspace."
  value={
    billing?.hasSubscription
      ? billing.status === 'active'
        ? 'Business · Active'
        : `Business · ${billing.status}`
      : 'No active subscription'
  }
  positive={billing?.status === 'active'}
/>

{billing?.currentPeriodEnd && (
  <SettingsRow
    title="Renewal date"
    description="Your current subscription period ends on this date."
    value={new Date(
      billing.currentPeriodEnd
    ).toLocaleDateString()}
  />
)}
                </div>
              </section>
            )}
          </div>
        </main>
      </div>

      {/* Add Memory Modal */}
      {showAddModal && (
        <Modal
          title="Add to company memory"
          onClose={() => {
            if (!uploading) {
              setShowAddModal(false);
              resetAddModal();
            }
          }}
        >
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05]">
                  <Upload className="h-4 w-4 text-white/50" />
                </div>

                <div>
                  <div className="text-sm font-medium">
                    Upload documents
                  </div>

                  <p className="mt-1 text-xs leading-5 text-white/35">
                    Add Markdown, TXT, CSV, or PDF files up to 50 MB each.
                    Mnemo will ingest the content, create embeddings, and add
                    it to this workspace&apos;s memory.
                  </p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED_TYPES}
                onChange={handleFilesSelected}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.035] text-xs font-medium text-white/70 transition hover:bg-white/[0.06] disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
                Choose files
              </button>

              <div className="mt-3 text-center text-[10px] uppercase tracking-[0.14em] text-white/20">
                MD · TXT · CSV · PDF
              </div>
            </div>


            <div className="space-y-2">
              <label
                htmlFor="upload-category"
                className="text-[10px] uppercase tracking-[0.16em] text-white/25"
              >
                Category
              </label>

              <select
                id="upload-category"
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                disabled={uploading}
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 text-sm text-white/75 outline-none transition focus:border-white/[0.16] disabled:opacity-40"
              >
                <option value="General">General</option>
                <option value="Company">Company</option>
                <option value="Strategy">Strategy</option>
                <option value="Marketing">Marketing</option>
                <option value="Product">Product</option>
                <option value="Sales">Sales</option>
                <option value="Customers">Customers</option>
                <option value="Operations">Operations</option>
                <option value="Finance">Finance</option>
                <option value="HR">HR</option>
                <option value="Legal">Legal</option>
                <option value="Security">Security</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {stagingFiles.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-[0.16em] text-white/25">
                  Selected files
                </div>

                {stagingFiles.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
                      <FileText className="h-4 w-4 text-white/40" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium text-white/75">
                        {item.file.name}
                      </div>

                      <div className="mt-1 text-[10px] text-white/25">
                        {(item.file.size / 1024).toFixed(1)} KB
                      </div>

                      {item.message && (
                        <div
                          className={`mt-1 text-[10px] ${
                            item.status === 'error'
                              ? 'text-red-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {item.message}
                        </div>
                      )}
                    </div>

                    {item.status === 'uploading' ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white/40" />
                    ) : item.status === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : item.status === 'error' ? (
                      <AlertCircle className="h-4 w-4 text-red-400" />
                    ) : (
                      <button
                        onClick={() => removeStagedFile(item.id)}
                        disabled={uploading}
                        className="text-white/25 transition hover:text-white/70"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  onClick={uploadFiles}
                  disabled={uploading}
                  className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Indexing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Add to memory
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="border-t border-white/[0.07] pt-5">
              <div className="mb-3 flex items-center gap-2">
                <Tag className="h-4 w-4 text-white/35" />

                <div>
                  <div className="text-sm font-medium text-white/70">
                    Manual note
                  </div>

                  <div className="text-[10px] text-white/25">
                    Backend connection coming next
                  </div>
                </div>
              </div>

              <input
                value={manualTitle}
                onChange={(event) =>
                  setManualTitle(event.target.value)
                }
                placeholder="Note title"
                className="mb-2 h-10 w-full rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 text-xs text-white outline-none placeholder:text-white/20 focus:border-white/15"
              />

              <textarea
                value={manualContent}
                onChange={(event) =>
                  setManualContent(event.target.value)
                }
                placeholder="Write a company note..."
                rows={4}
                className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-3 text-xs leading-5 text-white outline-none placeholder:text-white/20 focus:border-white/15"
              />

              <button
                onClick={addManualNote}
                className="mt-2 h-9 rounded-xl border border-white/[0.08] px-3 text-xs text-white/50 transition hover:bg-white/[0.04] hover:text-white"
              >
                Save manual note
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Memory Detail Modal */}
      {showMemoryModal && selectedMemory && (
        <Modal
          title={selectedMemory.title}
          onClose={() => {
            setShowMemoryModal(false);
            setSelectedMemory(null);
          }}
        >
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge>{selectedMemory.type}</Badge>
              <Badge>{selectedMemory.category}</Badge>
              <StatusBadge status={selectedMemory.status} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoBox
                label="Source"
                value={selectedMemory.source}
              />

              <InfoBox
                label="Added"
                value={formatDate(selectedMemory.dateAdded)}
              />
            </div>

            {selectedMemory.chunksCount !== undefined && (
              <InfoBox
                label="Chunks"
                value={String(selectedMemory.chunksCount)}
              />
            )}

            {selectedMemory.error_message && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

                  <div>
                    <div className="text-xs font-medium text-red-300">
                      Ingestion error
                    </div>

                    <p className="mt-1 text-xs leading-5 text-red-300/60">
                      {selectedMemory.error_message}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {(() => {
  const relationships = [
    ...(selectedMemory.outgoing_relationships ?? []).map(
      (relationship) => ({
        ...relationship,
        direction: 'outgoing' as const,
        relatedMemoryId: relationship.target_memory_id,
      })
    ),
    ...(selectedMemory.incoming_relationships ?? []).map(
      (relationship) => ({
        ...relationship,
        direction: 'incoming' as const,
        relatedMemoryId: relationship.source_memory_id,
      })
    ),
  ];

  const relatedMemories = relationships
    .map((relationship) => ({
      ...relationship,
      memory: memories.find(
        (memory) =>
          memory.id === relationship.relatedMemoryId
      ),
    }))
    .filter(
      (
        relationship
      ): relationship is typeof relationship & {
        memory: MemoryItem;
      } => Boolean(relationship.memory)
    );

  if (!relatedMemories.length) {
    return null;
  }

  return (
    <div>
      <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-white/25">
        Related memories
      </div>

      <div className="space-y-2">
        {relatedMemories.map((relationship) => (
          <button
            key={relationship.id}
            type="button"
            onClick={() => {
              setSelectedMemory(relationship.memory);
            }}
            className="w-full rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-left transition hover:bg-white/[0.05]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-medium text-white/75">
                  {relationship.memory.title}
                </div>

                <div className="mt-1 text-[11px] text-white/35">
                  {relationship.direction === 'outgoing'
                    ? relationship.relationship_type.replace(
                        /_/g,
                        ' '
                      )
                    : `related via ${relationship.relationship_type.replace(
                        /_/g,
                        ' '
                      )}`}
                </div>
              </div>

              <div className="shrink-0 text-[10px] text-white/20">
                {Math.round(
                  relationship.confidence * 100
                )}
                %
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
})()}

            <div>
              <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-white/25">
                Content
              </div>

              <div className="max-h-[380px] overflow-y-auto rounded-xl border border-white/[0.07] bg-black/20 p-4">
                <pre className="whitespace-pre-wrap break-words font-sans text-xs leading-6 text-white/60">
                  {selectedMemory.content ||
                    selectedMemory.snippet ||
                    'No content preview available.'}
                </pre>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-white/[0.07] pt-5">
              <button
                onClick={openOriginalFile}
                className="flex h-9 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-xs text-white/70 transition hover:bg-white/[0.07] hover:text-white"
              >
                Open original
              </button>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex h-9 items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.05] px-3 text-xs text-red-400 transition hover:bg-red-500/[0.1]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>

              <button
                onClick={() => {
                  setShowMemoryModal(false);
                  setSelectedMemory(null);
                }}
                className="h-9 rounded-xl border border-white/[0.08] px-4 text-xs text-white/50 transition hover:bg-white/[0.04] hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {showDeleteModal && selectedMemory && (
        <Modal
          title="Delete memory?"
          onClose={() => setShowDeleteModal(false)}
          small
        >
          <div>
            <p className="text-sm leading-6 text-white/45">
              This will remove{' '}
              <span className="text-white/80">
                {selectedMemory.title}
              </span>{' '}
              from this workspace&apos;s memory.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="h-10 rounded-xl border border-white/[0.08] px-4 text-xs text-white/50"
              >
                Cancel
              </button>

              <button
                onClick={deleteMemory}
                className="h-10 rounded-xl bg-red-500 px-4 text-xs font-semibold text-white"
              >
                Delete memory
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <Modal
          title="Invite member"
          onClose={() => setShowInviteModal(false)}
          small
        >
          <div>
            <p className="text-sm leading-6 text-white/40">
              Team invitations will be connected to the workspace
              membership system next.
            </p>

            <div className="mt-5">
              <input
                disabled
                placeholder="teammate@company.com"
                className="h-11 w-full rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 text-sm text-white/30 outline-none placeholder:text-white/20"
              />

              <button
                onClick={() => {
                  setShowInviteModal(false);
                  showNotification(
                    'Member invitations are not connected yet.',
                    'info'
                  );
                }}
                className="mt-3 h-10 w-full rounded-xl bg-white text-xs font-semibold text-black"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Components                                                                  */
/* -------------------------------------------------------------------------- */

function SidebarButton({
  active,
  icon,
  label,
  badge,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
        active
          ? 'bg-white/[0.07] text-white'
          : 'text-white/40 hover:bg-white/[0.035] hover:text-white/75'
      }`}
    >
      <span className={active ? 'text-white/80' : 'text-white/30'}>
        {icon}
      </span>

      <span className="flex-1">{label}</span>

      {badge !== undefined && (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] ${
            active
              ? 'bg-white/10 text-white/60'
              : 'bg-white/[0.04] text-white/25'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function StatCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs text-white/35">{label}</div>

        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-white/35">
          {icon}
        </div>
      </div>

      <div className="mt-5 text-2xl font-semibold tracking-[-0.03em]">
        {value}
      </div>

      <div className="mt-1 text-[11px] text-white/25">
        {description}
      </div>
    </div>
  );
}

function MemoryRow({
  memory,
  onClick,
}: {
  memory: MemoryItem;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-white/[0.025]"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025]">
        <FileText className="h-4 w-4 text-white/35" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-white/75">
          {memory.title}
        </div>

        <div className="mt-1 truncate text-xs text-white/25">
          {memory.snippet || memory.source}
        </div>
      </div>

      <div className="hidden shrink-0 sm:block">
        <StatusBadge status={memory.status} />
      </div>

      <ArrowRight className="h-4 w-4 shrink-0 text-white/15" />
    </button>
  );
}

function MemoryTableRow({
  memory,
  onClick,
}: {
  memory: MemoryItem;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="grid w-full grid-cols-1 gap-3 border-b border-white/[0.06] px-5 py-4 text-left transition hover:bg-white/[0.025] md:grid-cols-[minmax(0,2fr)_120px_140px_120px_100px] md:items-center md:gap-4"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025]">
          <FileText className="h-4 w-4 text-white/35" />
        </div>

        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-white/75">
            {memory.title}
          </div>

          <div className="mt-1 truncate text-xs text-white/25 md:hidden">
            {memory.category} · {formatDate(memory.dateAdded)}
          </div>
        </div>
      </div>

      <div className="hidden text-xs uppercase text-white/35 md:block">
        {memory.type}
      </div>

      <div className="hidden text-xs text-white/35 md:block">
        {memory.category}
      </div>

      <div className="hidden text-xs text-white/30 md:block">
        {formatDate(memory.dateAdded)}
      </div>

      <div className="hidden md:block">
        <StatusBadge status={memory.status} />
      </div>
    </button>
  );
}

function StatusBadge({
  status,
}: {
  status: MemoryItem['status'];
}) {
  const styles = {
    indexed:
      'border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-400',
    processing:
      'border-amber-500/20 bg-amber-500/[0.07] text-amber-400',
    error: 'border-red-500/20 bg-red-500/[0.07] text-red-400',
  };

  const labels = {
    indexed: 'Indexed',
    processing: 'Processing',
    error: 'Error',
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-[9px] font-medium uppercase tracking-[0.08em] ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/[0.08] bg-white/[0.035] px-2.5 py-1 text-[9px] uppercase tracking-[0.1em] text-white/35">
      {children}
    </span>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
      <div className="text-[9px] uppercase tracking-[0.15em] text-white/20">
        {label}
      </div>

      <div className="mt-1 truncate text-xs text-white/55">
        {value}
      </div>
    </div>
  );
}

function ActivityRow({
  item,
  detailed = false,
}: {
  item: ActivityItem;
  detailed?: boolean;
}) {
  return (
    <div
      className={`flex gap-3 ${
        detailed ? 'px-5 py-4' : ''
      }`}
    >
      <div
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
          item.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-400'
            : item.type === 'error'
              ? 'bg-red-500/10 text-red-400'
              : 'bg-white/[0.05] text-white/40'
        }`}
      >
        {item.type === 'success' ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : item.type === 'error' ? (
          <AlertCircle className="h-3.5 w-3.5" />
        ) : (
          <Activity className="h-3.5 w-3.5" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-white/65">
          {item.title}
        </div>

        <div className="mt-1 text-xs leading-5 text-white/30">
          {item.description}
        </div>

        <div className="mt-1.5 text-[10px] text-white/20">
          {formatRelativeTime(item.time)}
        </div>
      </div>
    </div>
  );
}

function LoadingRow() {
  return (
    <div className="flex items-center justify-center px-5 py-16">
      <div className="flex items-center gap-2 text-xs text-white/30">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading company memory...
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.025]">
        <Database className="h-4 w-4 text-white/25" />
      </div>

      <div className="mt-4 text-sm font-medium text-white/60">
        {title}
      </div>

      <p className="mt-1.5 max-w-sm text-xs leading-5 text-white/25">
        {description}
      </p>

      {action}
    </div>
  );
}

function ConnectionCard({
  title,
  description,
  icon,
  connected,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  connected?: boolean;
  onClick?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-white/40">
          {icon}
        </div>

        {connected ? (
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-2 py-1 text-[9px] uppercase tracking-[0.1em] text-emerald-400">
            Available
          </span>
        ) : (
          <span className="rounded-full border border-white/[0.07] bg-white/[0.025] px-2 py-1 text-[9px] uppercase tracking-[0.1em] text-white/25">
            Coming soon
          </span>
        )}
      </div>

      <h3 className="mt-5 text-sm font-medium text-white/80">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-white/30">
        {description}
      </p>

      {onClick && (
        <button
          onClick={onClick}
          className="mt-5 flex h-9 items-center gap-2 rounded-xl border border-white/[0.08] px-3 text-xs text-white/45 transition hover:bg-white/[0.04] hover:text-white"
        >
          Connect
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function SettingsRow({
  title,
  description,
  value,
  positive = false,
}: {
  title: string;
  description: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-sm font-medium text-white/75">
          {title}
        </div>

        <p className="mt-1 max-w-xl text-xs leading-5 text-white/30">
          {description}
        </p>
      </div>

      <div
        className={`shrink-0 rounded-xl border px-3 py-2 text-xs ${
          positive
            ? 'border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-400'
            : 'border-white/[0.07] bg-white/[0.025] text-white/45'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
function Modal({
  title,
  children,
  onClose,
  small = false,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  small?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div
        className={`max-h-[90vh] w-full overflow-y-auto rounded-3xl border border-white/[0.09] bg-[#0d0d0d] shadow-2xl ${
          small ? 'max-w-md' : 'max-w-2xl'
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.07] bg-[#0d0d0d]/95 px-5 py-4 backdrop-blur-xl">
          <h2 className="truncate pr-5 text-sm font-medium text-white/90">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/45 transition hover:bg-white/[0.06] hover:text-white"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}