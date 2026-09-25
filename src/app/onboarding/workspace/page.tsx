'use client';

import React, { useState } from 'react';

export default function WorkspaceCreation() {
  const [companyName, setCompanyName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    window.location.href = '/workspace';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e0] font-sans flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md space-y-8 bg-neutral-950 border border-neutral-900 p-8 rounded-xl">
        
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Step 2 of 2</span>
          <h2 className="font-serif text-3xl text-white">Create your company's memory.</h2>
          <p className="text-xs font-sans text-neutral-400">Your workspace is a private environment for your company's knowledge.</p>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Company name</label>
            <input 
              type="text" 
              required 
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Corp" 
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-600" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Company website (Optional)</label>
            <input type="text" placeholder="acmecorp.com" className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-600" />
          </div>

          <button type="submit" className="w-full py-3 bg-[#f5f5f0] text-neutral-950 font-mono text-xs uppercase tracking-wider rounded hover:bg-white transition-colors">
            Create workspace
          </button>
        </form>

      </div>
    </div>
  );
}
