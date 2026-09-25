'use client';

import React, { useState } from 'react';

interface AddMemoryViewProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function AddMemoryView({ onBack, onSuccess }: AddMemoryViewProps) {
  const [addMode, setAddMode] = useState<'file' | 'text'>('file');
  const [memoryTitle, setMemoryTitle] = useState('');
  const [memoryContent, setMemoryContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoryContent.trim()) return;

    setLoading(true);
    try {
      const formattedContent = memoryTitle ? `[Title: ${memoryTitle}]\n\n${memoryContent}` : memoryContent;
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: formattedContent, 
          workspaceId: 'default-workspace', 
          sourceType: memoryTitle ? 'document' : 'note' 
        }),
      });

      if (res.ok) {
        setMemoryTitle('');
        setMemoryContent('');
        onSuccess();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Top navigation header & mode switcher */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="text-xs font-mono text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          ← Back to Company Memory
        </button>
        <div className="space-x-2">
          <button 
            onClick={() => setAddMode('file')}
            className={`px-4 py-1.5 rounded text-xs font-mono tracking-wider transition-colors ${addMode === 'file' ? 'bg-neutral-800 text-neutral-100 border border-neutral-700' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            Upload file
          </button>
          <button 
            onClick={() => setAddMode('text')}
            className={`px-4 py-1.5 rounded text-xs font-mono tracking-wider transition-colors ${addMode === 'text' ? 'bg-neutral-800 text-neutral-100 border border-neutral-700' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            Add text
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-500">Knowledge Ingestion</span>
        <h2 className="font-serif text-3xl text-[#f5f5f0] tracking-tight">Add to company memory</h2>
      </div>

      {addMode === 'file' ? (
        <div className="border border-dashed border-neutral-800 bg-neutral-950/50 p-16 rounded-xl text-center space-y-4 hover:border-neutral-700 transition-all cursor-pointer">
          <p className="font-serif text-lg text-neutral-300">Drop company documents here</p>
          <p className="text-xs font-mono text-neutral-500 max-w-sm mx-auto">
            Supports PDF, DOCX, TXT, CSV, XLSX, PPTX, Markdown, and images. All files integrate directly into your unified company memory.
          </p>
          <div className="pt-2">
            <span className="px-4 py-2 bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-300 rounded hover:border-neutral-600 transition-colors inline-block">
              Browse Files
            </span>
          </div>
        </div>
      ) : (
        <form onSubmit={handleAddMemory} className="space-y-6 bg-neutral-950 border border-neutral-900 p-8 rounded-xl shadow-xl">
          <div className="space-y-2">
            <label className="block text-[11px] font-mono tracking-widest uppercase text-neutral-500">Title</label>
            <input
              type="text"
              value={memoryTitle}
              onChange={(e) => setMemoryTitle(e.target.value)}
              placeholder="Give this memory a title"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-sm text-[#f5f5f0] placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-mono tracking-widest uppercase text-neutral-500">Content</label>
            <textarea
              rows={8}
              value={memoryContent}
              onChange={(e) => setMemoryContent(e.target.value)}
              placeholder="Write or paste company knowledge here (meeting notes, decisions, policies, processes, customer information)..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-sm text-[#f5f5f0] placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 leading-relaxed"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#f5f5f0] text-neutral-950 font-mono text-xs uppercase tracking-wider rounded hover:bg-white transition-colors disabled:opacity-50"
          >
            {loading ? 'Adding to Memory...' : 'Add to memory'}
          </button>
        </form>
      )}
    </div>
  );
}
