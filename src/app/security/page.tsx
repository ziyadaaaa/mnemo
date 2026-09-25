'use client';

import React from 'react';
import Link from 'next/link';

export default function SecurityPage() {
  const points = [
    { title: "Workspace isolation", desc: "Every company's vector memory and documents are strictly separated at the database level." },
    { title: "Access control", desc: "Role-based permissions ensure only authorized members interact with sensitive company knowledge." },
    { title: "Private company knowledge", desc: "Your data is never used to train public or foundational models." },
    { title: "Secure authentication", desc: "Industry-standard encrypted sessions with support for secure credentials." },
    { title: "Source-level permissions", desc: "Every answer references verified origin documents directly within your vault." },
    { title: "Data handling", desc: "Compliant storage protocols designed for corporate data protection." }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e0] font-sans">
      <header className="border-b border-neutral-900 px-8 py-5 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="font-serif text-lg tracking-widest text-[#f5f5f0]">MNEMO</Link>
        <Link href="/signup" className="px-4 py-2 bg-[#f5f5f0] text-neutral-950 text-xs font-mono rounded">Get started</Link>
      </header>

      <section className="max-w-4xl mx-auto px-8 pt-20 pb-12 space-y-4">
        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">Security & Privacy</span>
        <h1 className="font-serif text-4xl md:text-5xl text-[#f5f5f0]">Your company's memory stays yours.</h1>
      </section>

      <section className="max-w-4xl mx-auto px-8 pb-24 grid grid-cols-1 md:grid-cols-2 gap-6">
        {points.map((p, idx) => (
          <div key={idx} className="bg-neutral-950 border border-neutral-900 p-6 rounded-xl space-y-2">
            <h3 className="font-serif text-lg text-white">{p.title}</h3>
            <p className="text-xs font-sans text-neutral-400 leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
