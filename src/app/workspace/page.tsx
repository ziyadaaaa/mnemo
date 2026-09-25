'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  question: string;
  answer: string;
  sources: Array<{ id: number; name: string; passage: string }>;
}

export default function WorkspacePage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'library' | 'members' | 'settings'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [memories, setMemories] = useState<any[]>([]);

  // Fetch company memories for library tab
  useEffect(() => {
    fetch('/api/memories?workspaceId=default-workspace')
      .then(res => res.json())
      .then(data => { if (data.memories) setMemories(data.memories); })
      .catch(() => {});
  }, []);

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
      if (!res.ok) throw new Error(data.error);

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        question: currentQuery,
        answer: data.answer,
        sources: data.sources || []
      }]);
    } catch (err: any) {
      // Fallback response if OpenAI credits/API are not configured yet
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        question: currentQuery,
        answer: "Mnemo doesn't have enough active credits or information in this workspace to complete the vector query. Please configure your billing state or add documents to memory.",
        sources: []
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-[#e5e5e0] font-sans">
      
      {/* TOP HEADER NAVIGATION */}
      <header className="border-b border-neutral-900 px-6 py-3 flex items-center justify-between sticky top-0 z-40 bg-[#0a0a0a]">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="font-serif text-sm tracking-widest text-[#f5f5f0]">MNEMO</span>
            <span className="text-neutral-700">/</span>
            <span className="text-xs font-mono text-neutral-400">Acme Corp</span>
          </div>

          <nav className="flex items-center space-x-6 text-xs font-mono">
            <button onClick={() => setActiveTab('chat')} className={activeTab === 'chat' ? 'text-white border-b border-white pb-0.5' : 'text-neutral-500'}>Chat</button>
            <button onClick={() => setActiveTab('library')} className={activeTab === 'library' ? 'text-white border-b border-white pb-0.5' : 'text-neutral-500'}>Library</button>
            <button onClick={() => setActiveTab('members')} className={activeTab === 'members' ? 'text-white border-b border-white pb-0.5' : 'text-neutral-500'}>Members</button>
            <button onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'text-white border-b border-white pb-0.5' : 'text-neutral-500'}>Settings</button>
          </nav>
        </div>

        <div className="text-[11px] font-mono text-amber-500/90 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
          7 days remaining in trial
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT SIDEBAR */}
        {activeTab === 'chat' && (
          <aside className="w-64 border-r border-neutral-900 bg-[#0d0d0d] flex flex-col p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Recent</span>
              <button onClick={() => setMessages([])} className="text-[10px] font-mono text-neutral-400 hover:text-white">+ New</button>
            </div>
            <div className="space-y-1 text-xs font-mono text-neutral-400">
              <div className="px-2 py-1.5 rounded hover:bg-neutral-900 cursor-pointer truncate">Current strategic priorities</div>
              <div className="px-2 py-1.5 rounded hover:bg-neutral-900 cursor-pointer truncate">Q3 financial assumptions</div>
            </div>
          </aside>
        )}

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-8">
          {activeTab === 'chat' && (
            <div className="max-w-3xl mx-auto space-y-8 pb-28">
              {messages.length === 0 ? (
                <div className="text-center py-20 space-y-3">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Company Memory</span>
                  <h2 className="font-serif text-3xl text-[#f5f5f0]">What do you need to remember?</h2>
                  <p className="text-xs font-mono text-neutral-500">Ask anything about your company's strategies, reports, or decisions.</p>
                </div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className="space-y-4">
                    <div className="flex justify-end">
                      <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-xs font-mono text-neutral-200">
                        {m.question}
                      </div>
                    </div>
                    <div className="bg-neutral-950 border border-neutral-900 p-5 rounded-lg space-y-4 text-sm font-sans text-neutral-200 leading-relaxed">
                      <p>{m.answer}</p>
                      {m.sources.length > 0 && (
                        <div className="space-y-2 pt-3 border-t border-neutral-900">
                          {m.sources.map((s, i) => (
                            <div key={i} className="bg-neutral-900/60 border border-neutral-800 p-3 rounded text-xs space-y-1">
                              <span className="font-mono text-[10px] text-neutral-400">Source [{s.id}] — {s.name}</span>
                              <p className="font-serif italic text-neutral-400 text-[11px]">"{s.passage}"</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* STICKY INPUT BAR */}
              <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-[#0a0a0a]/90 backdrop-blur border-t border-neutral-900 p-4">
                <form onSubmit={handleAsk} className="max-w-3xl mx-auto flex items-center gap-2">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask anything about your company…"
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-xs text-[#f5f5f0] placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
                  />
                  <button type="submit" disabled={loading} className="px-5 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-mono uppercase rounded">
                    {loading ? 'Searching' : 'Ask'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'library' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="font-serif text-2xl text-[#f5f5f0]">Library</h2>
              <p className="text-xs font-mono text-neutral-500">Everything Mnemo remembers about this company.</p>
              <div className="space-y-2 pt-4">
                {memories.map(m => (
                  <div key={m.id} className="p-4 bg-neutral-950 border border-neutral-900 rounded text-xs font-mono flex justify-between">
                    <span className="text-neutral-300">{m.content.slice(0, 60)}...</span>
                    <span className="text-emerald-500 text-[10px]">INDEXED</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
