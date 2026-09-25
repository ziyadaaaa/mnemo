'use client';

import React from 'react';
import Link from 'next/link';

export default function PricingPage() {
  const tiers = [
    { name: 'Starter', price: '$49', desc: 'For early teams establishing their foundational memory.' },
    { name: 'Business', price: '$149', desc: 'For growing companies with active document ingestion and multi-user access.' },
    { name: 'Scale', price: '$399', desc: 'For organizations scaling institutional knowledge across multiple departments.' },
    { name: 'Enterprise', price: 'Custom', desc: 'Dedicated security, isolation, and custom vector store infrastructure.' }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e0] font-sans selection:bg-neutral-800">
      
      {/* TOP NAVIGATION */}
      <header className="border-b border-neutral-900 px-8 py-5 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <Link href="/" className="font-serif text-lg tracking-widest text-[#f5f5f0]">MNEMO</Link>
        </div>
        <div className="flex items-center space-x-6 text-xs font-mono">
          <Link href="/signin" className="text-neutral-400 hover:text-white transition-colors">Sign in</Link>
          <Link href="/signup" className="px-4 py-2 bg-[#f5f5f0] text-neutral-950 rounded hover:bg-white transition-colors">Get started</Link>
        </div>
      </header>

      {/* HEADER SECTION */}
      <section className="max-w-4xl mx-auto px-8 pt-20 pb-12 text-center space-y-4">
        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 border border-neutral-800 px-3 py-1 rounded-full">
          Pricing
        </span>
        <h1 className="font-serif text-4xl md:text-5xl text-[#f5f5f0]">Simple, transparent pricing.</h1>
        <p className="text-sm text-neutral-400 font-sans">Every plan includes a 7-day free trial. No credit card required.</p>
      </section>

      {/* PRICING GRID */}
      <section className="max-w-6xl mx-auto px-8 pb-24 grid grid-cols-1 md:grid-cols-4 gap-6">
        {tiers.map((tier, idx) => (
          <div key={idx} className="bg-neutral-950 border border-neutral-900 rounded-xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <h3 className="font-serif text-xl text-[#f5f5f0]">{tier.name}</h3>
              <div className="text-3xl font-mono text-white">{tier.price}</div>
              <p className="text-xs font-sans text-neutral-400 leading-relaxed">{tier.desc}</p>
            </div>
            <Link href="/signup" className="w-full text-center py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-mono uppercase rounded transition-colors">
              Start free
            </Link>
          </div>
        ))}
      </section>

    </div>
  );
}
