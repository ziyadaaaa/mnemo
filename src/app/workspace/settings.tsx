'use client';

import React from 'react';

export default function WorkspaceSettings() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-16">
      
      <div className="border-b border-neutral-900 pb-6">
        <h2 className="font-serif text-2xl text-[#f5f5f0]">Settings</h2>
        <p className="text-xs font-mono text-neutral-500">Manage your workspace parameters, security, and plan.</p>
      </div>

      {/* WORKSPACE SECTION */}
      <section className="space-y-4 bg-neutral-950 border border-neutral-900 p-6 rounded-xl">
        <h3 className="font-serif text-lg text-white">Workspace</h3>
        <div className="space-y-3 max-w-md">
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Company Name</label>
            <input type="text" defaultValue="Acme Corp" className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white focus:outline-none" />
          </div>
          <button className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-mono uppercase rounded transition-colors">
            Save changes
          </button>
        </div>
      </section>

      {/* SECURITY & DATA SECTION */}
      <section className="space-y-4 bg-neutral-950 border border-neutral-900 p-6 rounded-xl">
        <h3 className="font-serif text-lg text-white">Security & Data</h3>
        <p className="text-xs font-sans text-neutral-400 leading-relaxed">
          Your workspace vectors are strictly isolated. Data is indexed locally within your schema configuration and never exposed to public model training sets.
        </p>
      </section>

      {/* BILLING & TRIAL SECTION */}
      <section className="space-y-4 bg-neutral-950 border border-neutral-900 p-6 rounded-xl">
        <h3 className="font-serif text-lg text-white">Billing & Plan</h3>
        <div className="flex items-center justify-between text-xs font-mono pt-2">
          <div>
            <p className="text-white font-bold">Starter Plan (Trial)</p>
            <p className="text-neutral-500">7 days remaining in trial</p>
          </div>
          <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
            Trial Active
          </span>
        </div>
      </section>

    </div>
  );
}
