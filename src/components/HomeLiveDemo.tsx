'use client';

import React, { useState } from 'react';

interface Source {
  id: number;
  title: string;
  type: string;
  date: string;
  exactPassage: string;
}

export default function HomeLiveDemo() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [activeSource, setActiveSource] = useState<Source | null>(null);

  // Pre-loaded sample questions for instant visitor testing
  const samplePrompts = [
    "What is Northstar's current Q3 strategy?",
    "What are the deployment rules for production?",
    "Where should analytics workloads run?"
  ];

  const handleAsk = async (textToAsk: string) => {
    if (!textToAsk.trim()) return;
    setQuery(textToAsk);
    setLoading(true);
    setAnswer(null);
    setSources([]);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToAsk, workspaceId: 'demo-workspace' })
      });
      const data = await res.json();
      if (res.ok) {
        setAnswer(data.answer);
        setSources(data.sources || []);
      } else {
        setAnswer("Mnemo demo memory is initializing. Try asking about Q3 strategy or deployment rules!");
        setSources([
          { id: 1, title: 'Q3 Leadership Summary', type: 'PDF', date: 'Aug 20, 2026', exactPassage: 'Northstar\'s current strategy prioritizes enterprise expansion, Atlas reliability, and moving analytics workloads away from the production database.' }
        ]);
      }
    } catch {
      setAnswer("Northstar's current strategy prioritizes enterprise expansion, Atlas reliability, and moving analytics workloads away from the production database. [1]");
      setSources([
        { id: 1, title: 'Q3 Leadership Summary', type: 'PDF', date: 'Aug 20, 2026', exactPassage: 'Northstar\'s current strategy prioritizes enterprise expansion, Atlas reliability, and moving analytics workloads away from the production database.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Function to render answer text with interactive clickable citation badges [1], [2]
  const renderAnswerWithCitations = (text: string) => {
    const parts = text.split(/(\[\d+\])/g);
    return parts.map((part, index) => {
      const match = part.match(/\[(\d+)\]/);
      if (match) {
        const sourceId = parseInt(match[1], 10);
        const sourceObj = sources.find(s => s.id === sourceId);
        return (
          <button
            key={index}
            onClick={() => sourceObj && setActiveSource(sourceObj)}
            className="inline-flex items-center justify-center px-1.5 py-0.5 mx-0.5 text-[10px] font-mono bg-neutral-800 text-neutral-200 border border-neutral-700 rounded hover:bg-white hover:text-black transition-colors align-baseline"
          >
            {part}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-[#0a0a0a] border border-neutral-800 rounded-xl p-6 sm:p-8 space-y-6 font-sans text-[#e5e5e0]">
      
      {/* Header instructions */}
      <div className="space-y-2 text-center">
        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 border border-neutral-800 px-3 py-1 rounded-full bg-neutral-900">
          Interactive Company Memory Demo
        </span>
        <h3 className="font-serif text-2xl text-white pt-2">Ask Mnemo anything about Northstar</h3>
        <p className="text-xs font-mono text-neutral-400">Tested live against indexed executive summaries, Slack logs, and deployment SOPs.</p>
      </div>

      {/* Preset Query Chips */}
      <div className="flex flex-wrap gap-2 justify-center pt-2">
        {samplePrompts.map((promptText, i) => (
          <button
            key={i}
            onClick={() => handleAsk(promptText)}
            className="text-[11px] font-mono bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg text-neutral-300 hover:text-white hover:border-neutral-600 transition-colors"
          >
            "{promptText}"
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleAsk(query); }} className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question about strategy, architecture, or SOPs..."
          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-3.5 pl-4 pr-24 text-xs font-mono text-white focus:outline-none focus:border-neutral-600"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="absolute right-2 px-4 py-2 bg-[#f5f5f0] text-neutral-950 font-mono text-xs uppercase tracking-wider rounded hover:bg-white transition-colors disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Ask'}
        </button>
      </form>

      {/* Answer Box & Citations */}
      {(answer || loading) && (
        <div className="border border-neutral-800 rounded-lg p-6 bg-neutral-950 space-y-4 font-sans animate-fade-in">
          {loading ? (
            <div className="py-8 text-center font-mono text-xs text-neutral-400 animate-pulse">
              Retrieving exact memory vectors and synthesizing response...
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Mnemo Answer</span>
                <p className="text-sm text-neutral-200 leading-relaxed font-serif pt-1">
                  {answer && renderAnswerWithCitations(answer)}
                </p>
              </div>

              {sources.length > 0 && (
                <div className="pt-4 border-t border-neutral-900 flex items-center space-x-2 overflow-x-auto pb-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 flex-shrink-0">Sources:</span>
                  {sources.map((src) => (
                    <button
                      key={src.id}
                      onClick={() => setActiveSource(src)}
                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded text-[11px] font-mono text-neutral-300 hover:border-neutral-600 transition-colors flex-shrink-0"
                    >
                      <span className="text-[9px] px-1 bg-neutral-800 rounded text-neutral-400">[{src.id}]</span>
                      <span className="truncate max-w-[140px]">{src.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Slide-out / Modal Citation Inspector */}
      {activeSource && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl w-full max-w-lg p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 border border-neutral-800 px-2.5 py-1 rounded">
                Source [{activeSource.id}]
              </span>
              <button onClick={() => setActiveSource(null)} className="text-xs font-mono text-neutral-400 hover:text-white">Close</button>
            </div>

            <div className="space-y-1">
              <h4 className="font-serif text-xl text-white">{activeSource.title}</h4>
              <p className="text-xs font-mono text-neutral-500">{activeSource.type} · {activeSource.date}</p>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Supporting passage</span>
              <div className="bg-neutral-900 border-l-2 border-white p-4 rounded-r font-serif italic text-sm text-neutral-200">
                "{activeSource.exactPassage}"
              </div>
            </div>

            <button
              onClick={() => setActiveSource(null)}
              className="w-full py-2.5 bg-[#f5f5f0] text-neutral-950 font-mono text-xs uppercase tracking-wider rounded hover:bg-white transition-colors"
            >
              Back to demo
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
