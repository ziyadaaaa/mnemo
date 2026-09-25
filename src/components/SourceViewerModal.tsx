'use client';

import React from 'react';

interface SourceItem {
  id: number;
  title: string;
  type: string;
  date: string;
  exactPassage: string;
  fullContent: string;
}

export default function SourceViewerModal({ source, onClose, onOpenFullLibrary }: { source: SourceItem; onClose: () => void; onOpenFullLibrary: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-end z-50 font-sans">
      <div className="bg-[#0a0a0a] border-l border-neutral-800 w-full max-w-lg h-full p-8 flex flex-col justify-between overflow-y-auto text-[#e5e5e0]">
        
        {/* Top Header */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 border border-neutral-800 px-3 py-1 rounded-full">
              Source [{source.id}]
            </span>
            <button onClick={onClose} className="text-xs font-mono text-neutral-400 hover:text-white transition-colors">Close</button>
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-2xl text-white">{source.title}</h2>
            <div className="flex space-x-3 text-xs font-mono text-neutral-500">
              <span>{source.type}</span>
              <span>·</span>
              <span>{source.date}</span>
            </div>
          </div>

          {/* Exact Passage Highlight */}
          <div className="space-y-3 pt-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Supporting passage</p>
            <div className="bg-neutral-950 border-l-2 border-white p-5 rounded-r-lg space-y-2">
              <p className="font-serif italic text-sm text-neutral-200 leading-relaxed">
                "{source.exactPassage}"
              </p>
            </div>
          </div>

          {/* Full context preview */}
          <div className="space-y-2 pt-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Document snippet context</p>
            <div className="bg-neutral-900/40 border border-neutral-900 p-4 rounded-lg font-mono text-xs text-neutral-400 whitespace-pre-wrap leading-relaxed">
              {source.fullContent}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-neutral-900">
          <button 
            onClick={onOpenFullLibrary}
            className="w-full py-3 bg-[#f5f5f0] text-neutral-950 font-mono text-xs uppercase tracking-wider rounded hover:bg-white transition-colors"
          >
            Open in library
          </button>
        </div>

      </div>
    </div>
  );
}
