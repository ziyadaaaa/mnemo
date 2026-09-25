'use client';

import React, { useState } from 'react';

export default function WorkspaceMembers() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const members = [
    { name: 'Alex Vance', email: 'alex@acmecorp.com', role: 'Owner', status: 'Active' },
    { name: 'Sarah Chen', email: 'sarah@acmecorp.com', role: 'Admin', status: 'Active' },
    { name: 'Marcus Brody', email: 'marcus@acmecorp.com', role: 'Member', status: 'Pending' }
  ];

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    alert(`Invitation sent to ${inviteEmail}`);
    setInviteEmail('');
    setShowInviteModal(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between border-b border-neutral-900 pb-6">
        <div className="space-y-1">
          <h2 className="font-serif text-2xl text-[#f5f5f0]">Members</h2>
          <p className="text-xs font-mono text-neutral-500">People with access to this company's memory.</p>
        </div>
        <button 
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 bg-[#f5f5f0] text-neutral-950 font-mono text-xs uppercase tracking-wider rounded hover:bg-white transition-colors"
        >
          Invite member
        </button>
      </div>

      {/* MEMBER LIST TABLE */}
      <div className="border border-neutral-900 rounded-xl bg-neutral-950 overflow-hidden">
        <div className="grid grid-cols-4 px-6 py-3 border-b border-neutral-900 text-[10px] font-mono uppercase tracking-widest text-neutral-500">
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Status</span>
        </div>

        <div className="divide-y divide-neutral-900 text-xs font-mono">
          {members.map((m, idx) => (
            <div key={idx} className="grid grid-cols-4 px-6 py-4 items-center text-neutral-300">
              <span className="font-sans font-medium text-white">{m.name}</span>
              <span className="text-neutral-400">{m.email}</span>
              <span className="text-neutral-400">{m.role}</span>
              <div>
                <span className={`px-2 py-0.5 rounded text-[10px] ${m.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-neutral-800 text-neutral-400'}`}>
                  {m.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* INVITE MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-950 border border-neutral-900 rounded-xl w-full max-w-md p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
              <h3 className="font-serif text-lg text-white">Invite team member</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-xs font-mono text-neutral-400 hover:text-white">Close</button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Work email</label>
                <input 
                  type="email" 
                  required 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@acmecorp.com" 
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-600" 
                />
              </div>

              <button type="submit" className="w-full py-2.5 bg-[#f5f5f0] text-neutral-950 font-mono text-xs uppercase tracking-wider rounded hover:bg-white transition-colors">
                Send invitation
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
