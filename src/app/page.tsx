'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, Shield, Database, MessageSquare, Search, 
  FileText, CheckCircle2, Lock, ChevronDown, Sparkles, 
  Layers, Cpu, Zap, ExternalLink 
} from 'lucide-react';

const SAMPLE_QUESTIONS = [
  "What was our Q3 marketing budget?",
  "What did the team decide about hiring?",
  "What are our customer support policies?",
  "When is the next product launch?"
];

const SAMPLE_ANSWERS: Record<string, { answer: string; sources: { title: string; type: string; page?: string }[] }> = {
  "What was our Q3 marketing budget?": {
    answer: "The Q3 campaign budget was approved at $48,000. The team agreed to prioritize paid social and creator partnerships.",
    sources: [
      { title: "Q3 Marketing Planning.pdf", type: "PDF", page: "p. 4" },
      { title: "Campaign Meeting (June 14)", type: "Notes", page: "Meeting Log" }
    ]
  },
  "What did the team decide about hiring?": {
    answer: "Engineering headcount is frozen for Q3, but two senior full-stack roles are approved for backfill starting August 1.",
    sources: [
      { title: "Q3 Headcount & Operations.docx", type: "DOCX", page: "p. 2" },
      { title: "Leadership Sync (July 02)", type: "Notes" }
    ]
  },
  "What are our customer support policies?": {
    answer: "Standard response SLA is under 2 hours for enterprise clients and 24 hours for self-serve. Refunds require manager sign-off if exceeding $150.",
    sources: [
      { title: "Support Handbook v4.md", type: "MD", page: "Section 2" },
      { title: "Client SLA Guidelines.pdf", type: "PDF" }
    ]
  },
  "When is the next product launch?": {
    answer: "The v2.4 platform launch was moved to September 18 to accommodate additional security audit testing.",
    sources: [
      { title: "Product Roadmap.pdf", type: "PDF", page: "p. 8" },
      { title: "Launch Meeting Notes (Aug 21)", type: "Notes" }
    ]
  }
};

export default function LandingPage() {
  const [activeQuestion, setActiveQuestion] = useState(SAMPLE_QUESTIONS[0]);
  const [customQuery, setCustomQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSource, setSelectedSource] = useState<{ title: string; type: string; page?: string } | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const currentData = SAMPLE_ANSWERS[activeQuestion] || {
    answer: `Mnemo analyzed sample company knowledge for "${activeQuestion}" and found relevant documentation across internal repositories.`,
    sources: [
      { title: "Enterprise Knowledge Base.pdf", type: "PDF", page: "p. 1" },
      { title: "Internal Wiki SOPs", type: "MD" }
    ]
  };

  const handleQuestionClick = (q: string) => {
    setIsSearching(true);
    setActiveQuestion(q);
    setCustomQuery('');
    setTimeout(() => setIsSearching(false), 300);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim()) return;
    setIsSearching(true);
    setActiveQuestion(customQuery);
    setTimeout(() => setIsSearching(false), 300);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] font-sans antialiased selection:bg-white selection:text-black">
      
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-neutral-800/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-bold text-sm">
                M
              </div>
              <span className="font-semibold text-white tracking-tight text-lg">MNEMO</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-xs text-neutral-400">
              <a href="#product" className="hover:text-white transition-colors">Product</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
              <a href="#security" className="hover:text-white transition-colors">Security</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/signin" className="text-xs text-neutral-400 hover:text-white transition-colors hidden sm:inline-block">
              Sign in
            </Link>
            <Link href="/signup" className="bg-white text-black text-xs font-medium px-4 py-2 rounded-md hover:bg-neutral-200 transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* 1. Hero Section with Prominent MNEMO Branding */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-400">
            <Shield className="w-3.5 h-3.5 text-emerald-400" /> Enterprise Knowledge Security Active
          </div>
          
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold tracking-tight text-white leading-none">
            MNEMO
          </h1>
        </div>
        
        <div className="max-w-3xl mx-auto space-y-4">
          <p className="text-2xl sm:text-3xl font-medium tracking-tight text-white">
            Your company's memory, answerable.
          </p>
          
          <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Mnemo remembers your company's documents, decisions, processes, projects, and context, so your team can ask questions and find answers grounded in the information your company actually has.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-black text-xs font-medium px-6 py-3 rounded-md hover:bg-neutral-200 transition-colors">
            Try Mnemo <ArrowRight className="w-4 h-4" />
          </Link>
          <a href="#how-it-works" className="inline-flex items-center gap-2 bg-neutral-900 border border-neutral-800 text-white text-xs font-medium px-6 py-3 rounded-md hover:bg-neutral-800 transition-colors">
            See how it works
          </a>
        </div>
      </section>

      {/* 2 & 3. The Live Mnemo Demo (Centerpiece) */}
      <section className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-8 relative overflow-hidden">
          
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4 text-xs">
            <span className="inline-flex items-center gap-1.5 text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Demo workspace (sample company data)
            </span>
            <span className="text-neutral-500 font-mono">Interactive Preview</span>
          </div>

          <div className="space-y-4">
            <p className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Try asking a question:</p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleQuestionClick(q)}
                  className={`text-xs px-3.5 py-2 rounded-lg border transition-all ${
                    activeQuestion === q 
                      ? 'bg-white text-black border-white font-medium' 
                      : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>

            <form onSubmit={handleCustomSubmit} className="relative mt-2">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input 
                type="text"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="Or ask your own question about this sample company..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-28 py-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors"
              >
                Ask Mnemo →
              </button>
            </form>
          </div>

          {/* Answer Box */}
          <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-6 space-y-6">
            {isSearching ? (
              <div className="flex items-center justify-center py-8 text-neutral-500 gap-2 text-xs">
                <span className="w-4 h-4 rounded-full border-2 border-neutral-500 border-t-transparent animate-spin" />
                Searching company memory vectors...
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-neutral-400 font-medium">
                    <MessageSquare className="w-3.5 h-3.5 text-neutral-300" /> Answer
                  </div>
                  <p className="text-sm sm:text-base text-white leading-relaxed font-normal">
                    {currentData.answer}
                  </p>
                </div>

                {/* 4. Show Evidence / Sources */}
                <div className="pt-4 border-t border-neutral-900 space-y-3">
                  <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
                    Sources ({currentData.sources.length} memories referenced)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {currentData.sources.map((src, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedSource(src)}
                        className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-3 py-1.5 rounded-md text-xs text-neutral-200 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{src.title}</span>
                        {src.page && <span className="text-[10px] text-neutral-500">({src.page})</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </section>

      {/* Source Inspection Modal */}
      {selectedSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px]">
                {selectedSource.type} Document
              </span>
              <button onClick={() => setSelectedSource(null)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <h3 className="text-base font-medium text-white">{selectedSource.title}</h3>
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 text-xs text-neutral-300 font-mono leading-relaxed">
              [Excerpt from vector chunk index] <br/><br/>
              "The referenced strategic parameter confirms alignment across departmental requirements. All approved operational guidelines reflect this baseline."
            </div>
            <div className="flex justify-end">
              <button 
                onClick={() => setSelectedSource(null)}
                className="bg-white text-black text-xs font-medium px-4 py-2 rounded-md hover:bg-neutral-200"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Problem Section */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center space-y-6">
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
          Your company already knows the answer. It is just buried.
        </h2>
        <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto">
          Scattered across Google Drive, Slack DMs, Notion pages, email threads, or someone's memory. When they leave, the knowledge leaves with them.
        </p>
        <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-neutral-400">
          <div className="bg-neutral-900/40 border border-neutral-800 p-4 rounded-lg">Google Drive silos</div>
          <div className="bg-neutral-900/40 border border-neutral-800 p-4 rounded-lg">Lost Slack threads</div>
          <div className="bg-neutral-900/40 border border-neutral-800 p-4 rounded-lg">Outdated Notion wikis</div>
          <div className="bg-neutral-900/40 border border-neutral-800 p-4 rounded-lg">Undocumented decisions</div>
        </div>
      </section>

      {/* 5. What Mnemo Remembers */}
      <section id="product" className="max-w-6xl mx-auto px-6 py-16 space-y-12">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">What Mnemo remembers</h2>
          <p className="text-xs sm:text-sm text-neutral-400">Structured indexes built for fast organizational retrieval.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: "Documents & Reports", desc: "Contracts, client briefs, spreadsheets, and foundational PDFs.", icon: FileText },
            { title: "Decisions & Strategy", desc: "Why choices were made, meeting outcomes, and policy rationales.", icon: Layers },
            { title: "Processes & SOPs", desc: "Step-by-step internal workflows on how your team operates.", icon: Cpu },
            { title: "Projects & Timelines", desc: "Milestones, scope documents, and delivery expectations.", icon: Database },
            { title: "Customer Knowledge", desc: "Recurring notes, client agreements, and support baselines.", icon: MessageSquare },
            { title: "Team Context", desc: "Institutional history and tribal knowledge across departments.", icon: Sparkles }
          ].map((item, i) => (
            <div key={i} className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-6 space-y-3 hover:border-neutral-700 transition-colors">
              <item.icon className="w-5 h-5 text-white" />
              <h3 className="text-sm font-medium text-white">{item.title}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. How it works */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-20 border-t border-neutral-800/60 space-y-16">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">How Mnemo works</h2>
          <p className="text-xs sm:text-sm text-neutral-400">Three straightforward steps to institutional clarity.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Give Mnemo your knowledge", desc: "Upload documents, notes, spreadsheets, and company files securely." },
            { step: "02", title: "Mnemo remembers it", desc: "Advanced vector extraction indexes and organizes your information." },
            { step: "03", title: "Ask instead of searching", desc: "Ask normal questions and receive verified answers with exact sources." }
          ].map((s, i) => (
            <div key={i} className="space-y-3 bg-neutral-900/20 border border-neutral-800 p-6 rounded-xl">
              <span className="text-xs font-mono text-neutral-500 font-semibold">{s.step}</span>
              <h3 className="text-sm font-medium text-white">{s.title}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 9. Use Cases */}
      <section className="max-w-6xl mx-auto px-6 py-16 space-y-12">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Built for fast-moving teams</h2>
          <p className="text-xs sm:text-sm text-neutral-400">Designed with marketing agencies and growing businesses in mind.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { q: "What did we promise this client?", cat: "Client Knowledge" },
            { q: "Why did we change the campaign strategy?", cat: "Campaign History" },
            { q: "How do we handle a new onboarding?", cat: "Internal Processes" },
            { q: "Who approved this budget expansion?", cat: "Team Decisions" },
            { q: "What were the results of the last launch?", cat: "Reporting" },
            { q: "Where is our brand guidelines document?", cat: "Asset Retrieval" }
          ].map((uc, i) => (
            <div key={i} className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500">{uc.cat}</span>
              <p className="text-xs font-medium text-white">"{uc.q}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* 10. Integrations */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-neutral-800/60 text-center space-y-8">
        <div className="space-y-3 max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-white">Connect the knowledge you already have</h2>
          <p className="text-xs text-neutral-400">Integrations that sync cleanly without disrupting your team's workflow.</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {["Google Drive", "Slack", "Notion", "Microsoft 365", "PDF, DOCX & CSV Uploads"].map((int, i) => (
            <span key={i} className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-lg text-xs text-neutral-300 font-medium">
              {int}
            </span>
          ))}
        </div>
      </section>

      {/* 11. Security */}
      <section id="security" className="max-w-4xl mx-auto px-6 py-16 space-y-8">
        <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-8 space-y-6">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
            <Lock className="w-4 h-4" /> Enterprise Security & Privacy
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Your company's knowledge stays yours.</h2>
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
            Mnemo is built with strict data isolation. Your workspace files are encrypted at rest and in transit, never used to train public models, and fully deletable at any time.
          </p>
          <div className="flex items-center gap-4 text-xs text-neutral-300 pt-2">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Private workspaces</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Secure auth</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Instant data deletion</span>
          </div>
        </div>
      </section>

      {/* 12. Pricing Preview */}
      <section id="pricing" className="max-w-5xl mx-auto px-6 py-16 space-y-12">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-white">Simple, predictable pricing</h2>
          <p className="text-xs text-neutral-400">Scale your company memory as you grow.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: "Starter", desc: "For small teams and agencies getting started.", price: "$29", btn: "Start Free Trial" },
            { name: "Business", desc: "For growing companies requiring deep integrations.", price: "$99", btn: "Get Business" },
            { name: "Enterprise", desc: "For larger organizations with custom security needs.", price: "Custom", btn: "Contact Sales" }
          ].map((plan, i) => (
            <div key={i} className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-6 space-y-6 flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white">{plan.name}</h3>
                <p className="text-xs text-neutral-400">{plan.desc}</p>
                <p className="text-2xl font-bold text-white pt-2">{plan.price}<span className="text-xs font-normal text-neutral-500"> /mo</span></p>
              </div>
              <Link href="/signup" className="w-full text-center bg-white text-black text-xs font-medium py-2.5 rounded-md hover:bg-neutral-200 transition-colors">
                {plan.btn}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 13. FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-16 space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {[
            { q: "What is Mnemo?", a: "Mnemo is an enterprise knowledge assistant that indexes your company's internal files and SOPs into a secure vector space, giving you grounded, source-backed answers." },
            { q: "What can I upload?", a: "You can upload PDFs, DOCX, TXT, CSV, XLSX, PPTX, and Markdown files directly through the workspace." },
            { q: "Is my company's information private?", a: "Yes. Your data is isolated to your private workspace, encrypted, and never used to train public models." },
            { q: "Does it work with Google Drive or Slack?", a: "Yes, connection modules are available to seamlessly index files from your existing tools." }
          ].map((faq, i) => (
            <div key={i} className="border border-neutral-800 rounded-xl bg-neutral-900/20 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left text-xs font-medium text-white"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 text-xs text-neutral-400 leading-relaxed border-t border-neutral-800/50 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 14. Final CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Stop searching for what your company already knows.
        </h2>
        <div className="flex items-center justify-center gap-4 pt-4">
          <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-black text-xs font-medium px-6 py-3 rounded-md hover:bg-neutral-200 transition-colors">
            Try Mnemo <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/signin" className="inline-flex items-center gap-2 bg-neutral-900 border border-neutral-800 text-white text-xs font-medium px-6 py-3 rounded-md hover:bg-neutral-800 transition-colors">
            Sign in
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800/60 py-8 px-6 text-center text-xs text-neutral-500 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>&copy; 2026 Mnemo Corp. All rights reserved.</span>
        <div className="flex items-center gap-6 text-neutral-400">
          <a href="#security" className="hover:text-white">Security</a>
          <a href="#pricing" className="hover:text-white">Pricing</a>
          <Link href="/workspace" className="hover:text-white">Workspace</Link>
        </div>
      </footer>

    </div>
  );
}