'use client';

import React from 'react';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e0] font-sans flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-sm space-y-8 bg-neutral-950 border border-neutral-900 p-8 rounded-xl">
        
        <div className="text-center space-y-2">
          <Link href="/" className="font-serif text-xl tracking-widest text-[#f5f5f0] inline-block mb-4">MNEMO</Link>
          <h2 className="font-serif text-2xl text-white">Create your Mnemo account</h2>
          <p className="text-xs font-mono text-neutral-500">Start your 7-day free trial.</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); window.location.href='/onboarding/workspace'; }} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Full name</label>
            <input type="text" required className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-600" />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Work email</label>
            <input type="email" required className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-600" />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Password</label>
            <input type="password" required className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-600" />
          </div>

          <button type="submit" className="w-full py-2.5 bg-[#f5f5f0] text-neutral-950 font-mono text-xs uppercase tracking-wider rounded hover:bg-white transition-colors">
            Create account
          </button>
        </form>

        <div className="text-center text-xs font-mono text-neutral-500 pt-4 border-t border-neutral-900">
          Already have an account? <Link href="/signin" className="text-white underline">Sign in</Link>
        </div>

      </div>
    </div>
  );
}
