'use client';

import React, { useState } from 'react';

interface MemoryItem {
  id: string;
  title: string;
  type: string;
  sizeOrTypeLabel: string;
  dateAdded: string;
  status: string;
  citationsCount: number;
  content: string;
}

export default function WorkspaceLibrary({ onOpenItem, onOpenAddModal }: { onOpenItem: (item: MemoryItem) => void; onOpenAddModal: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'DOCUMENTS' | 'TEXT' | 'RECENT' | 'INDEXED'>('ALL');

  // Initial mock seed matching unified records
  const [memories] = useState<MemoryItem[]>([
    {
      id: '1',
      title: 'Q3 Leadership Summary',
      type: 'PDF',
      sizeOrTypeLabel: 'PDF · Aug 20, 2026',
      dateAdded: '2026-08-20',
      status: 'Indexed',
      citationsCount: 4,
      content: "Q3 Leadership Summary Document:\n\nNorthstar's current strategy prioritizes enterprise expansion, Atlas reliability, and moving analytics workloads away from the production database. Enterprise expansion remains a major priority across all regional business segments."
    },
    {
      id: '2',
      title: 'Leadership Meeting Notes',
      type: 'TXT',
      sizeOrTypeLabel: 'Text · Aug 20, 2026',
      dateAdded: '2026-08-20',
      status: 'Indexed',
      citationsCount: 2,
      content: "Leadership Meeting Notes — August 20, 2026:\n\nDiscussed scaling infrastructure limits. Agreed to decouple analytical reporting queries from primary transactional clusters to protect latency metrics."
    },
    {
      id: '3',
      title: 'Deployment SOP',
      type: 'DOCX',
      sizeOrTypeLabel: 'DOCX · Jun 28, 2026',
      dateAdded: '2026-06-28',
      status: 'Indexed',
      citationsCount: 6,
      content: "Standard Operating Procedure: Production Deployments\n\nAll releases must pass staging integration testing. Zero-downtime rolling upgrades are mandatory for core backend services."
    }
  ]);

  const filteredMemories = memories.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.content.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeFilter === 'DOCUMENTS') return item.type !== 'TXT';
    if (activeFilter === 'TEXT') return item.type === 'TXT';
    if (activeFilter === 'INDEXED') return item.status === 'Indexed';
    return true;
  });

  if (memories.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center space-y-6">
        <h2 className="font-serif text-3xl text-[#f5f5f0]">LIBRARY</h2>
        <div className="space-y-2">
          <p className="font-serif text-xl text-neutral-400">"Your company's memory starts here."</p>
          <p className="text-xs font-mono text-neutral-500">Upload a file or add written knowledge to give Mnemo something to remember.</p>
        </div>
        <div className="flex justify-center space-x-4 pt-4">
          <button onClick={onOpenAddModal} className="px-5 py-2.5 bg-[#f5f5f0] text-neutral-950 font-mono text-xs uppercase tracking-wider rounded hover:bg-white transition-colors">
            Upload files
          </button>
          <button onClick={onOpenAddModal} className="px-5 py-2.5 bg-neutral-900 border border-neutral-800 text-neutral-200 font-mono text-xs uppercase tracking-wider rounded hover:bg-neutral-800 transition-colors">
            Add text
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans">
      
      {/* Header & Action */}
      <div className="flex items-center justify-between border-b border-neutral-900 pb-6">
        <div className="space-y-1">
          <h2 className="font-serif text-2xl text-[#f5f5f0]">LIBRARY</h2>
          <p className="text-xs font-mono text-neutral-500">Everything Mnemo remembers about this company.</p>
        </div>
        <button 
          onClick={onOpenAddModal}
          className="px-4 py-2 bg-[#f5f5f0] text-neutral-950 font-mono text-xs uppercase tracking-wider rounded hover:bg-white transition-colors"
        >
          + Add to memory
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search company memory…" 
          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-xs text-white focus:outline-none focus:border-neutral-600 font-mono"
        />
      </div>

      {/* Filters */}
      <div className="flex space-x-2 text-[10px] font-mono">
        {(['ALL', 'DOCUMENTS', 'TEXT', 'RECENT', 'INDEXED'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3 py-1.5 rounded transition-colors ${activeFilter === filter ? 'bg-neutral-200 text-neutral-950 font-bold' : 'bg-neutral-900 text-neutral-400 hover:text-white'}`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Clean List Table */}
      <div className="border border-neutral-900 rounded-xl bg-neutral-950 overflow-hidden divide-y divide-neutral-900">
        {filteredMemories.map((item) => (
          <div 
            key={item.id} 
            onClick={() => onOpenItem(item)}
            className="grid grid-cols-12 px-6 py-4 items-center hover:bg-neutral-900/50 transition-colors cursor-pointer text-xs font-mono"
          >
            <div className="col-span-1 flex items-center">
              <span className="px-2 py-1 bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-300 font-bold rounded">
                {item.type}
              </span>
            </div>
            
            <div className="col-span-6 font-sans font-medium text-white px-4 truncate">
              {item.title}
            </div>

            <div className="col-span-2 text-neutral-500">
              {item.sizeOrTypeLabel}
            </div>

            <div className="col-span-2">
              <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px]">
                {item.status}
              </span>
            </div>

            <div className="col-span-1 text-right text-neutral-500 text-[11px]">
              {item.citationsCount} citations
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
