'use client';

import React, { useState } from 'react';

export default function WorkspaceCreation() {
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim()) {
      setError('Company name is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/onboarding/workspace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName,
          website,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to create workspace.');
        setLoading(false);
        return;
      }

      window.location.href = '/workspace';
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e0] font-sans flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md space-y-8 bg-neutral-950 border border-neutral-900 p-8 rounded-xl">

        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
            Step 2 of 2
          </span>

          <h2 className="font-serif text-3xl text-white">
            Create your company&apos;s memory.
          </h2>

          <p className="text-xs font-sans text-neutral-400">
            Your workspace is a private environment for your company&apos;s knowledge.
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">

          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
              Company name
            </label>

            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Corp"
              disabled={loading}
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-600 disabled:opacity-50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
              Company website (Optional)
            </label>

            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="acmecorp.com"
              disabled={loading}
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-600 disabled:opacity-50"
            />
          </div>

          {error && (
            <div className="border border-red-900/50 bg-red-950/20 rounded px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#f5f5f0] text-neutral-950 font-mono text-xs uppercase tracking-wider rounded hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating workspace...' : 'Create workspace'}
          </button>

        </form>

      </div>
    </div>
  );
}