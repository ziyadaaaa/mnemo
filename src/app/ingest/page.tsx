'use client';

import React, { useState, useEffect, useRef } from 'react';

// --- TYPES ---
interface Message {
  id: string;
  question: string;
  answer: string;
  sources: Array<{ id: number; name: string; date?: string; passage: string }>;
  createdAt: string;
}

export default function MnemoWorkspace() {
  const [activeTab, setActiveTab] = useState<'chat' | 'library' | 'members' | 'settings'>('chat');
  const [conversations] = useState<{ id: string; title: string }[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Floating Widget State
  const [isFloatingOpen, setIsFloatingOpen] = useState(false);
  const [floatingQuery, setFloatingQuery] = useState('');
  const [floatingAnswer, setFloatingAnswer] = useState('');
  const [floatingLoading, setFloatingLoading] = useState(false);
  
  // Library State
  const [memories, setMemories] = useState<any[]>([]);
  const [addMode, setAddMode] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMemories = async () => {
    try {
      const res = await fetch(`/api/memories?workspaceId=default-workspace`);
      const data = await res.json();
      if (data.memories) {
        setMemories(data.memories);
      }
    } catch (err) {
      console.error('Failed to fetch memories', err);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  // Handle Main Chat Ask
  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const currentQuery = query;
    setQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: currentQuery, workspaceId: 'default-workspace' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to query memory');

      const newMessage: Message = {
        id: Date.now().toString(),
        question: currentQuery,
        answer: data.answer || "No direct answer found in indexed memory.",
        sources: data.sources || [],
        createdAt: new Date().toISOString()
      };

      setMessages(prev => [...prev, newMessage]);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error querying memory.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Floating Assistant Ask
  const handleFloatingAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!floatingQuery.trim()) return;

    const q = floatingQuery;
    setFloatingLoading(true);
    setFloatingAnswer('');

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, workspaceId: 'default-workspace' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFloatingAnswer(data.answer);
    } catch (err: any) {
      console.error(err);
      setFloatingAnswer(err.message || 'Error processing query.');
    } finally {
      setFloatingLoading(false);
    }
  };

  // Handle File Upload & Text Extraction
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setLoading(true);
    setStatusMessage('Reading file content...');

    try {
      let textContent = '';

      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // For PDFs, we send the file name and a placeholder note or read text if possible. 
        // Best approach for client-side raw text fallback:
        textContent = `Document Name: ${file.name}\n(Uploaded PDF document binary stream processed)`;
      } else {
        // Read text/markdown/txt files normally
        textContent = await file.text();
      }

      setStatusMessage('Generating embeddings & saving...');
      const formattedContent = `[Title: ${file.name}]\n\n${textContent}`;
      
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: formattedContent,
          workspaceId: 'default-workspace',
          sourceType: 'document'
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to ingest file');

      setLoading(false);
      setStatusMessage('');
      setAddMode(false);
      fetchMemories();
      setActiveTab('library');
    } catch (err: any) {
      console.error('File error:', err);
      alert(err.message || 'Failed to process file');
      setLoading(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-[#e5e5e0] font-sans selection:bg-neutral-800 relative">
      
      {/* TOP HEADER BAR */}
      <header className="border-b border-neutral-900 px-6 py-3 flex items-center justify-between select-none bg-[#0a0a0a] sticky top-0 z-40">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="font-serif text-base tracking-widest text-[#f5f5f0]">Mnemo</span>
            <span className="text-neutral-600">/</span>
            <span className="text-xs font-mono text-neutral-400">Test</span>
          </div>

          <nav className="flex items-center space-x-6 text-xs font-mono tracking-wider">
            <button 
              onClick={() => setActiveTab('chat')} 
              className={`transition-colors ${activeTab === 'chat' ? 'text-white border-b border-white pb-0.5' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              Chat
            </button>
            <button 
              onClick={() => setActiveTab('library')} 
              className={`transition-colors ${activeTab === 'library' ? 'text-white border-b border-white pb-0.5' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              Library
            </button>
            <button 
              onClick={() => setActiveTab('members')} 
              className={`transition-colors ${activeTab === 'members' ? 'text-white border-b border-white pb-0.5' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              Members
            </button>
            <button 
              onClick={() => setActiveTab('settings')} 
              className={`transition-colors ${activeTab === 'settings' ? 'text-white border-b border-white pb-0.5' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              Settings
            </button>
          </nav>
        </div>

        <div className="text-xs font-mono text-neutral-400 cursor-pointer hover:text-white transition-colors">
          Sign out
        </div>
      </header>

      {/* MAIN BODY LAYOUT */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT SIDEBAR (Conversations) */}
        {activeTab === 'chat' && (
          <aside className="w-64 border-r border-neutral-900 bg-[#0d0d0d] flex flex-col p-4 select-none">
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Conversations</span>
              <button 
                onClick={() => setMessages([])}
                className="px-2.5 py-1 bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-300 rounded hover:border-neutral-700 transition-colors"
              >
                New
              </button>
            </div>

            <div className="space-y-1 overflow-y-auto flex-1">
              {conversations.map(conv => (
                <div 
                  key={conv.id}
                  className="px-3 py-2 rounded text-xs font-mono text-neutral-300 bg-neutral-900/60 border border-neutral-800/60 truncate cursor-pointer"
                >
                  {conv.title}
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* CONTENT PANELS */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#0a0a0a]">
          
          {/* TAB 1: CHAT FEED */}
          {activeTab === 'chat' && (
            <div className="max-w-3xl mx-auto space-y-8 pb-32">
              {messages.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                  <h3 className="font-serif text-2xl text-neutral-300">Start a conversation with your company memory.</h3>
                  <p className="text-xs font-mono text-neutral-500">Ask questions about reports, financials, strategies, or team decisions below.</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="space-y-4 animate-fadeIn">
                    <div className="flex justify-end">
                      <div className="max-w-xl bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-xs font-mono text-neutral-200">
                        {msg.question}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-sm font-sans text-neutral-200 leading-relaxed bg-neutral-950/60 border border-neutral-900 p-5 rounded-lg space-y-4">
                        <p>{msg.answer}</p>

                        {msg.sources && msg.sources.length > 0 && (
                          <div className="space-y-2 pt-3 border-t border-neutral-900">
                            {msg.sources.map((src, idx) => (
                              <div key={idx} className="bg-neutral-900/80 border border-neutral-800 rounded p-3 space-y-1 text-xs">
                                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                                  <span className="font-bold text-neutral-300 flex items-center gap-1.5">
                                    <span className="w-4 h-4 rounded bg-neutral-800 flex items-center justify-center text-[9px] text-neutral-300">{src.id}</span>
                                    {src.name}
                                  </span>
                                  <span>{src.date || 'Indexed'}</span>
                                </div>
                                <p className="text-neutral-400 font-serif italic text-[11px]">"{src.passage}"</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Bottom Sticky Input Form */}
              <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-[#0a0a0a]/90 backdrop-blur border-t border-neutral-900 p-4">
                <form onSubmit={handleAsk} className="max-w-3xl mx-auto flex items-center gap-2">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask anything about your company..."
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-xs text-[#f5f5f0] placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-mono uppercase tracking-wider rounded transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Searching...' : 'Ask'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: LIBRARY VIEW */}
          {activeTab === 'library' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-2xl text-[#f5f5f0]">Document Library</h2>
                  <p className="text-xs font-mono text-neutral-500 mt-1">Manage all indexed files and raw texts in your workspace.</p>
                </div>
                <button
                  onClick={() => setAddMode(!addMode)}
                  className="px-4 py-2 bg-[#f5f5f0] text-neutral-950 font-mono text-xs uppercase tracking-wider rounded hover:bg-white transition-colors"
                >
                  {addMode ? 'Cancel' : '+ Add Document'}
                </button>
              </div>

              {addMode && (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-neutral-800 bg-neutral-950 p-10 rounded-xl text-center space-y-3 cursor-pointer hover:border-neutral-700 transition-all"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept=".pdf,.docx,.txt,.md,.csv,.xlsx,.pptx,.json"
                  />
                  <p className="font-serif text-base text-neutral-300">
                    {fileName ? `Selected: ${fileName}` : 'Click to browse or drop files (.pdf, .docx, .txt)'}
                  </p>
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                    {loading ? (statusMessage || 'Processing File...') : 'Browse Files'}
                  </span>
                </div>
              )}

              <div className="space-y-2 pt-4">
                {memories.length === 0 ? (
                  <p className="text-xs font-mono text-neutral-500">No documents indexed yet.</p>
                ) : (
                  memories.map((mem) => (
                    <div key={mem.id} className="flex items-center justify-between p-4 bg-neutral-950 border border-neutral-900 rounded-lg text-xs font-mono">
                      <span className="text-neutral-200 truncate max-w-md">{mem.content.slice(0, 70)}...</span>
                      <span className="text-neutral-500 uppercase">{mem.source_type}</span>
                      <span className="text-neutral-500">{new Date(mem.created_at).toLocaleDateString()}</span>
                      <span className="text-emerald-500 text-[10px]">INDEXED</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MEMBERS VIEW */}
          {activeTab === 'members' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="font-serif text-2xl text-[#f5f5f0]">Workspace Members</h2>
              <p className="text-xs font-mono text-neutral-500">Administrators and teammates with access to this memory room.</p>
              
              <div className="space-y-2 pt-4">
                <div className="flex items-center justify-between p-4 bg-neutral-950 border border-neutral-900 rounded-lg text-xs font-mono">
                  <span className="text-neutral-200">Admin Account</span>
                  <span className="text-neutral-400">admin@acmecorp.com</span>
                  <span className="text-emerald-500 text-[10px]">OWNER</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS VIEW */}
          {activeTab === 'settings' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="font-serif text-2xl text-[#f5f5f0]">Workspace Settings</h2>
              <p className="text-xs font-mono text-neutral-500">Manage vector store parameters and API configurations.</p>
              
              <div className="p-6 bg-neutral-950 border border-neutral-900 rounded-lg space-y-4 text-xs font-mono">
                <div>
                  <span className="text-neutral-500 uppercase tracking-widest block mb-1">Workspace ID</span>
                  <span className="text-neutral-300">default-workspace</span>
                </div>
                <div>
                  <span className="text-neutral-500 uppercase tracking-widest block mb-1">Embedding Model</span>
                  <span className="text-neutral-300">text-embedding-3-small (OpenAI)</span>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* FLOATING "ASK AI" CHAT WIDGET (Bottom Right Corner) */}
      <div className="fixed bottom-4 right-4 z-50">
        {isFloatingOpen ? (
          <div className="w-80 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl p-4 space-y-4 flex flex-col">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
              <span className="text-xs font-mono uppercase tracking-widest text-neutral-300">Ask Memory Assistant</span>
              <button 
                onClick={() => setIsFloatingOpen(false)}
                className="text-neutral-500 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 text-xs font-sans">
              {floatingAnswer && (
                <div className="p-3 bg-neutral-900 border border-neutral-800 rounded text-neutral-200 leading-relaxed">
                  {floatingAnswer}
                </div>
              )}
              {floatingLoading && (
                <p className="text-neutral-500 font-mono text-[10px]">Searching indexed context...</p>
              )}
            </div>

            <form onSubmit={handleFloatingAsk} className="flex gap-2 pt-2 border-t border-neutral-900">
              <input
                type="text"
                value={floatingQuery}
                onChange={(e) => setFloatingQuery(e.target.value)}
                placeholder="Ask a quick question..."
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-[#f5f5f0] focus:outline-none focus:border-neutral-600"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono rounded"
              >
                Send
              </button>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setIsFloatingOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-200 rounded-full shadow-2xl text-xs font-mono transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Ask AI
          </button>
        )}
      </div>

    </div>
  );
}
