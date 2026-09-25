'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function PublicHomepage() {
  const [demoQuery, setDemoQuery] = useState("What was Microsoft's total revenue in fiscal year 2025?");
  const [demoAnswer, setDemoAnswer] = useState("According to Microsoft Annual Report 2025, the company's total revenue for fiscal year 2025 was $245.1 billion. Within this total, Microsoft Cloud revenue accounted for $168.9 billion.");
  const [activeCitation, setActiveCitation] = useState<number | null>(1);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e0] font-sans selection:bg-neutral-800">
      
      {/* TOP NAVIGATION */}
      <header className="border-b border-neutral-900 px-8 py-5 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <span className="font-serif text-lg tracking-widest text-[#f5f5f0]">MNEMO</span>
        </div>

        <nav className="hidden md:flex items-center space-x-8 text-xs font-mono tracking-wider text-neutral-400">
          <Link href="/how-it-works" className="hover:text-white transition-colors">Product</Link>
          <Link href="/how-it-works" className="hover:text-white transition-colors">How it works</Link>
          <Link href="/security" className="hover:text-white transition-colors">Security</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
        </nav>

        <div className="flex items-center space-x-6 text-xs font-mono">
          <Link href="/signin" className="text-neutral-400 hover:text-white transition-colors">Sign in</Link>
          <Link href="/signup" className="px-4 py-2 bg-[#f5f5f0] text-neutral-950 hover:bg-white transition-colors rounded">Get started</Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="max-w-4xl mx-auto px-8 pt-24 pb-16 text-center space-y-6">
        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 border border-neutral-800 px-3 py-1 rounded-full">
          Company Memory
        </span>

        <h1 className="font-serif text-5xl md:text-6xl text-[#f5f5f0] tracking-tight leading-tight">
          "Your company's memory, answerable."
        </h1>

        <p className="text-sm md:text-base text-neutral-400 max-w-2xl mx-auto font-sans leading-relaxed">
          Mnemo remembers the documents, decisions, processes and knowledge your company accumulates — and lets your team ask questions and trace every answer back to its source.
        </p>

        <div className="flex items-center justify-center space-x-4 pt-4">
          <Link href="/signup" className="px-6 py-3 bg-[#f5f5f0] text-neutral-950 font-mono text-xs uppercase tracking-wider rounded hover:bg-white transition-colors">
            Get started
          </Link>
          <Link href="/how-it-works" className="px-6 py-3 bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono text-xs uppercase tracking-wider rounded hover:border-neutral-700 transition-colors">
            See how it works
          </Link>
        </div>
      </section>

      {/* PUBLIC DEMO SECTION */}
      <section className="max-w-5xl mx-auto px-8 py-16 border-t border-neutral-900 space-y-8">
        <div className="space-y-2 text-center">
          <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Public-Data Demonstration</span>
          <p className="text-xs font-mono text-neutral-500">This demonstration uses publicly available information. Microsoft is not a Mnemo customer.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 bg-neutral-950 border border-neutral-900 rounded-xl p-8">
          <div className="md:col-span-7 space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-xs font-mono text-neutral-300">
              {demoQuery}
            </div>

            <div className="space-y-4 text-sm text-neutral-200 leading-relaxed font-sans">
              <p>
                According to Microsoft Annual Report 2025, the company's total revenue for fiscal year 2025 was $245.1 billion. Within this total, Microsoft Cloud revenue accounted for $168.9 billion.
                <button onClick={() => setActiveCitation(1)} className="ml-1 text-xs font-mono text-neutral-400 hover:text-white underline">[1]</button>
              </p>
            </div>
          </div>

          <div className="md:col-span-5 bg-neutral-900/60 border border-neutral-800/80 rounded-lg p-5 space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Source Evidence</span>
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-neutral-300">Microsoft Annual Report 2025</span>
              <p className="font-serif italic text-xs text-neutral-400">
                "Microsoft 365 Commercial products and cloud services grew 14% driven by strong enterprise seat additions and average revenue per user expansion..."
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
