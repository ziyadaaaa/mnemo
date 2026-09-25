'v'
'use client';

import React from 'react';
import Link from 'next/link';

export default function HowItWorksPage() {
  const stages = [
    { num: '01', title: 'ADD', desc: 'Upload company documents or add knowledge manually.' },
    { num: '02', title: 'INDEX', desc: 'Mnemo turns the information into searchable company memory.' },
    { num: '03', title: 'ASK', desc: 'Employees ask questions naturally.' },
    { num: '04', title: 'TRACE', desc: 'Every answer can be traced back to its supporting source.' }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e0] font-sans">
      <header className="border-b border-neutral-900 px-8 py-5 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="font-serif text-lg tracking-widest text-[#f5f5f0]">MNEMO</Link>
        <div className="flex items-center space-x-6 text-xs font-mono">
          <Link href="/signin" className="text-neutral-400 hover:text-white transition-colors">Sign in</Link>
          <Link href="/signup" className="px-4 py-2 bg-[#f5f5f0] text-neutral-950 rounded hover:bg-white transition-colors">Get started</Link>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-8 pt-20 pb-12 space-y-4 text-center">
        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 border border-neutral-800 px-3 py-1 rounded-full">
          Product Pipeline
        </span>
        <h1 className="font-serif text-4xl md:text-5xl text-[#f5f5f0]">"Give Mnemo something to remember."</h1>
      </section>

      <section className="max-w-4xl mx-auto px-8 pb-24 grid grid-cols-1 md:grid-cols-2 gap-6">
        {stages.map((stage, idx) => (
          <div key={idx} className="bg-neutral-950 border border-neutral-900 p-8 rounded-xl space-y-4">
            <span className="font-mono text-2xl text-neutral-600">{stage.num}</span>
            <h3 className="font-serif text-xl text-white tracking-wide">{stage.title}</h3>
            <p className="text-xs font-sans text-neutral-400 leading-relaxed">{stage.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
