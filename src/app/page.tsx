'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Shield,
  Database,
  MessageSquare,
  Search,
  FileText,
  CheckCircle2,
  Lock,
  ChevronDown,
  Sparkles,
  Layers,
  Cpu,
} from 'lucide-react';

const SAMPLE_QUESTIONS = [
  'What was our Q3 marketing budget?',
  'What did the team decide about hiring?',
  'What are our customer support policies?',
  'When is the next product launch?',
];

type Citation = {
  title?: string;
  category?: string;
  type?: string;
  source_type?: string;
  snippet?: string;
  similarity?: number;
};

type AskResponse = {
  answer: string;
  citations?: Citation[];
};

export default function LandingPage() {
  const [activeQuestion, setActiveQuestion] = useState(
    SAMPLE_QUESTIONS[0]
  );
  const [customQuery, setCustomQuery] = useState('');
  const [answer, setAnswer] = useState(
    'Ask a question to search the Northstar Labs demo company memory.'
  );
  const [sources, setSources] = useState<Citation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [selectedSource, setSelectedSource] = useState<Citation | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const askMnemo = async (query: string) => {
    const trimmed = query.trim();

    if (!trimmed) return;

    setActiveQuestion(trimmed);
    setCustomQuery('');
    setIsSearching(true);
    setError('');
    setSources([]);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: trimmed,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Mnemo could not answer that question.');
      }

      setAnswer(
        data?.answer ||
          'Mnemo found relevant company knowledge, but no answer was returned.'
      );

      setSources(Array.isArray(data?.citations) ? data.citations : []);
    } catch (err) {
      console.error('Homepage Mnemo demo error:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while asking Mnemo.'
      );

      setAnswer('');
      setSources([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuestionClick = (question: string) => {
    askMnemo(question);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customQuery.trim()) return;

    askMnemo(customQuery);
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

              <span className="font-semibold text-white tracking-tight text-lg">
                MNEMO
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-xs text-neutral-400">
              <a
                href="#product"
                className="hover:text-white transition-colors"
              >
                Product
              </a>

              <a
                href="#how-it-works"
                className="hover:text-white transition-colors"
              >
                How it works
              </a>

              <a
                href="#security"
                className="hover:text-white transition-colors"
              >
                Security
              </a>

              <a
                href="#pricing"
                className="hover:text-white transition-colors"
              >
                Pricing
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/signin"
              className="text-xs text-neutral-400 hover:text-white transition-colors hidden sm:inline-block"
            >
              Sign in
            </Link>

            <Link
              href="/signup"
              className="bg-white text-black text-xs font-medium px-4 py-2 rounded-md hover:bg-neutral-200 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center space-y-8">

        <div className="space-y-4">

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-400">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            Company knowledge, answerable
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
            Mnemo remembers your company's documents, decisions, processes,
            projects, and context, so your team can ask questions and find
            answers grounded in the information your company actually has.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">

          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-black text-xs font-medium px-6 py-3 rounded-md hover:bg-neutral-200 transition-colors"
          >
            Try Mnemo
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 bg-neutral-900 border border-neutral-800 text-white text-xs font-medium px-6 py-3 rounded-md hover:bg-neutral-800 transition-colors"
          >
            See how it works
          </a>
        </div>
      </section>

      {/* Live Mnemo Demo */}
      <section className="max-w-4xl mx-auto px-6 py-8">

        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-8 relative overflow-hidden">

          <div className="flex items-center justify-between border-b border-neutral-800 pb-4 text-xs">

            <span className="inline-flex items-center gap-1.5 text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live demo · Northstar Labs
            </span>

            <span className="text-neutral-500 font-mono">
              Powered by Mnemo
            </span>
          </div>

          <div className="space-y-4">

            <p className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
              Try asking a question:
            </p>

            <div className="flex flex-wrap gap-2">

              {SAMPLE_QUESTIONS.map((question) => (

                <button
                  key={question}
                  onClick={() => handleQuestionClick(question)}
                  disabled={isSearching}
                  className={`text-xs px-3.5 py-2 rounded-lg border transition-all disabled:opacity-60 ${
                    activeQuestion === question
                      ? 'bg-white text-black border-white font-medium'
                      : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  {question}
                </button>

              ))}
            </div>

            <form
              onSubmit={handleCustomSubmit}
              className="relative mt-2"
            >

              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />

              <input
                type="text"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="Or ask your own question about this company..."
                disabled={isSearching}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-28 py-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={isSearching || !customQuery.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors"
              >
                Ask Mnemo →
              </button>
            </form>
          </div>

          {/* Answer */}
          <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-6 space-y-6">

            {isSearching ? (

              <div className="flex flex-col items-center justify-center py-10 text-neutral-500 gap-3 text-xs">

                <span className="w-5 h-5 rounded-full border-2 border-neutral-500 border-t-transparent animate-spin" />

                <span>
                  Searching company memory...
                </span>

              </div>

            ) : error ? (

              <div className="space-y-3 py-4">

                <div className="text-xs text-red-400 font-medium">
                  Mnemo couldn't answer that.
                </div>

                <p className="text-xs text-neutral-500 leading-relaxed">
                  {error}
                </p>

                <button
                  onClick={() => askMnemo(activeQuestion)}
                  className="text-xs bg-neutral-800 hover:bg-neutral-700 px-3 py-2 rounded-md text-white"
                >
                  Try again
                </button>

              </div>

            ) : (

              <>
                <div className="space-y-2">

                  <div className="flex items-center gap-2 text-xs text-neutral-400 font-medium">
                    <MessageSquare className="w-3.5 h-3.5 text-neutral-300" />
                    Answer
                  </div>

                  <p className="text-sm sm:text-base text-white leading-relaxed font-normal">
                    {answer}
                  </p>
                </div>

                {sources.length > 0 && (

                  <div className="pt-4 border-t border-neutral-900 space-y-3">

                    <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
                      Sources ({sources.length} memories referenced)
                    </p>

                    <div className="flex flex-wrap gap-2">

                      {sources.map((source, index) => (

                        <button
                          key={`${source.title}-${index}`}
                          onClick={() => setSelectedSource(source)}
                          className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-3 py-1.5 rounded-md text-xs text-neutral-200 transition-colors"
                        >

                          <FileText className="w-3.5 h-3.5 text-neutral-400" />

                          <span>
                            {source.title || 'Company document'}
                          </span>

                          {source.type && (
                            <span className="text-[10px] text-neutral-500">
                              {source.type}
                            </span>
                          )}

                        </button>

                      ))}
                    </div>
                  </div>

                )}

                {sources.length === 0 && (

                  <div className="pt-4 border-t border-neutral-900">
                    <p className="text-[11px] text-neutral-500">
                      No source documents were returned for this question.
                    </p>
                  </div>

                )}
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
                {selectedSource.type ||
                  selectedSource.source_type ||
                  'Document'}
              </span>

              <button
                onClick={() => setSelectedSource(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <h3 className="text-base font-medium text-white">
              {selectedSource.title || 'Company document'}
            </h3>

            {selectedSource.category && (
              <p className="text-[11px] text-neutral-500">
                {selectedSource.category}
              </p>
            )}

            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 text-xs text-neutral-300 font-mono leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap">
              {selectedSource.snippet ||
                'No excerpt was returned for this source.'}
            </div>

            {typeof selectedSource.similarity === 'number' && (
              <div className="text-[10px] text-neutral-500">
                Relevance match:{' '}
                {(selectedSource.similarity * 100).toFixed(1)}%
              </div>
            )}

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

      {/* Problem */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center space-y-6">

        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
          Your company already knows the answer. It is just buried.
        </h2>

        <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto">
          Scattered across Google Drive, Slack DMs, Notion pages, email
          threads, or someone's memory. When they leave, the knowledge leaves
          with them.
        </p>

        <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-neutral-400">

          <div className="bg-neutral-900/40 border border-neutral-800 p-4 rounded-lg">
            Google Drive silos
          </div>

          <div className="bg-neutral-900/40 border border-neutral-800 p-4 rounded-lg">
            Lost Slack threads
          </div>

          <div className="bg-neutral-900/40 border border-neutral-800 p-4 rounded-lg">
            Outdated Notion wikis
          </div>

          <div className="bg-neutral-900/40 border border-neutral-800 p-4 rounded-lg">
            Undocumented decisions
          </div>
        </div>
      </section>

      {/* What Mnemo Remembers */}
      <section
        id="product"
        className="max-w-6xl mx-auto px-6 py-16 space-y-12"
      >

        <div className="text-center space-y-3 max-w-xl mx-auto">

          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            What Mnemo remembers
          </h2>

          <p className="text-xs sm:text-sm text-neutral-400">
            Structured indexes built for fast organizational retrieval.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {[
            {
              title: 'Documents & Reports',
              desc: 'Contracts, client briefs, spreadsheets, and foundational PDFs.',
              icon: FileText,
            },
            {
              title: 'Decisions & Strategy',
              desc: 'Why choices were made, meeting outcomes, and policy rationales.',
              icon: Layers,
            },
            {
              title: 'Processes & SOPs',
              desc: 'Step-by-step internal workflows on how your team operates.',
              icon: Cpu,
            },
            {
              title: 'Projects & Timelines',
              desc: 'Milestones, scope documents, and delivery expectations.',
              icon: Database,
            },
            {
              title: 'Customer Knowledge',
              desc: 'Recurring notes, client agreements, and support baselines.',
              icon: MessageSquare,
            },
            {
              title: 'Team Context',
              desc: 'Institutional history and tribal knowledge across departments.',
              icon: Sparkles,
            },
          ].map((item, i) => (

            <div
              key={i}
              className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-6 space-y-3 hover:border-neutral-700 transition-colors"
            >
              <item.icon className="w-5 h-5 text-white" />

              <h3 className="text-sm font-medium text-white">
                {item.title}
              </h3>

              <p className="text-xs text-neutral-400 leading-relaxed">
                {item.desc}
              </p>
            </div>

          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="max-w-5xl mx-auto px-6 py-20 border-t border-neutral-800/60 space-y-16"
      >

        <div className="text-center space-y-3 max-w-xl mx-auto">

          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            How Mnemo works
          </h2>

          <p className="text-xs sm:text-sm text-neutral-400">
            Three straightforward steps to institutional clarity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {[
            {
              step: '01',
              title: 'Give Mnemo your knowledge',
              desc: 'Upload documents, notes, spreadsheets, and company files securely.',
            },
            {
              step: '02',
              title: 'Mnemo remembers it',
              desc: 'Advanced vector extraction indexes and organizes your information.',
            },
            {
              step: '03',
              title: 'Ask instead of searching',
              desc: 'Ask normal questions and receive verified answers with exact sources.',
            },
          ].map((step, i) => (

            <div
              key={i}
              className="space-y-3 bg-neutral-900/20 border border-neutral-800 p-6 rounded-xl"
            >
              <span className="text-xs font-mono text-neutral-500 font-semibold">
                {step.step}
              </span>

              <h3 className="text-sm font-medium text-white">
                {step.title}
              </h3>

              <p className="text-xs text-neutral-400 leading-relaxed">
                {step.desc}
              </p>
            </div>

          ))}
        </div>
      </section>

      {/* Use Cases */}
      <section className="max-w-6xl mx-auto px-6 py-16 space-y-12">

        <div className="text-center space-y-3 max-w-xl mx-auto">

          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Built for fast-moving teams
          </h2>

          <p className="text-xs sm:text-sm text-neutral-400">
            Designed with marketing agencies and growing businesses in mind.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

          {[
            {
              q: 'What did we promise this client?',
              cat: 'Client Knowledge',
            },
            {
              q: 'Why did we change the campaign strategy?',
              cat: 'Campaign History',
            },
            {
              q: 'How do we handle a new onboarding?',
              cat: 'Internal Processes',
            },
            {
              q: 'Who approved this budget expansion?',
              cat: 'Team Decisions',
            },
            {
              q: 'What were the results of the last launch?',
              cat: 'Reporting',
            },
            {
              q: 'Where is our brand guidelines document?',
              cat: 'Asset Retrieval',
            },
          ].map((useCase, i) => (

            <div
              key={i}
              className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 space-y-2"
            >
              <span className="text-[10px] uppercase tracking-wider text-neutral-500">
                {useCase.cat}
              </span>

              <p className="text-xs font-medium text-white">
                "{useCase.q}"
              </p>
            </div>

          ))}
        </div>
      </section>

      {/* Integrations */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-neutral-800/60 text-center space-y-8">

        <div className="space-y-3 max-w-xl mx-auto">

          <h2 className="text-2xl font-bold text-white">
            Connect the knowledge you already have
          </h2>

          <p className="text-xs text-neutral-400">
            Start with your existing company knowledge and expand from there.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">

          {[
            'Google Drive',
            'Slack',
            'Notion',
            'Microsoft 365',
            'File uploads',
          ].map((integration, i) => (

            <span
              key={i}
              className="bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-lg text-xs text-neutral-300 font-medium"
            >
              {integration}
            </span>

          ))}
        </div>
      </section>

      {/* Security */}
      <section
        id="security"
        className="max-w-4xl mx-auto px-6 py-16 space-y-8"
      >

        <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-8 space-y-6">

          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
            <Lock className="w-4 h-4" />
            Security & Privacy
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Your company's knowledge stays yours.
          </h2>

          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
            Mnemo is designed around private company workspaces and controlled
            access to company knowledge.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-300 pt-2">

            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Private workspaces
            </span>

            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Secure authentication
            </span>

            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Workspace-controlled data
            </span>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="max-w-5xl mx-auto px-6 py-16 space-y-12"
      >

        <div className="text-center space-y-3 max-w-xl mx-auto">

          <h2 className="text-2xl font-bold text-white">
            Simple, predictable pricing
          </h2>

          <p className="text-xs text-neutral-400">
            Start small and scale your company memory as you grow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {[
            {
              name: 'Starter',
              desc: 'For small teams and agencies getting started.',
              price: '$29',
              btn: 'Start Free Trial',
            },
            {
              name: 'Business',
              desc: 'For growing companies requiring deeper knowledge access.',
              price: '$99',
              btn: 'Get Business',
            },
            {
              name: 'Enterprise',
              desc: 'For larger organizations with custom requirements.',
              price: 'Custom',
              btn: 'Contact Sales',
            },
          ].map((plan, i) => (

            <div
              key={i}
              className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-6 space-y-6 flex flex-col justify-between"
            >

              <div className="space-y-3">

                <h3 className="text-sm font-medium text-white">
                  {plan.name}
                </h3>

                <p className="text-xs text-neutral-400">
                  {plan.desc}
                </p>

                <p className="text-2xl font-bold text-white pt-2">
                  {plan.price}

                  {plan.price !== 'Custom' && (
                    <span className="text-xs font-normal text-neutral-500">
                      {' '}
                      /mo
                    </span>
                  )}
                </p>
              </div>

             <Link
  href={
    plan.name === 'Business'
      ? '/signup?plan=business'
      : plan.name === 'Enterprise'
        ? '/signup?plan=enterprise'
        : '/signup'
  }
  className="w-full text-center bg-white text-black text-xs font-medium py-2.5 rounded-md hover:bg-neutral-200 transition-colors"
>
  {plan.btn}
</Link>
            </div>

          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-16 space-y-8">

        <div className="text-center space-y-3">

          <h2 className="text-2xl font-bold text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">

          {[
            {
              q: 'What is Mnemo?',
              a: "Mnemo is a company knowledge assistant that indexes internal information and lets teams ask questions against that knowledge.",
            },
            {
              q: 'What can I upload?',
              a: 'The current ingestion pipeline supports Markdown, TXT, and CSV files. Additional formats will be added as the ingestion layer expands.',
            },
            {
              q: "Is my company's information private?",
              a: 'Mnemo is being built around isolated company workspaces and controlled access to company knowledge.',
            },
            {
              q: 'Does it work with Google Drive or Slack?',
              a: 'Google Drive and Slack are planned connection sources. The current live demo uses indexed company documents.',
            },
          ].map((faq, i) => (

            <div
              key={i}
              className="border border-neutral-800 rounded-xl bg-neutral-900/20 overflow-hidden"
            >

              <button
                onClick={() =>
                  setOpenFaq(openFaq === i ? null : i)
                }
                className="w-full flex items-center justify-between p-4 text-left text-xs font-medium text-white"
              >

                <span>{faq.q}</span>

                <ChevronDown
                  className={`w-4 h-4 text-neutral-400 transition-transform ${
                    openFaq === i ? 'rotate-180' : ''
                  }`}
                />

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

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center space-y-6">

        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Stop searching for what your company already knows.
        </h2>

        <div className="flex items-center justify-center gap-4 pt-4">

          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-black text-xs font-medium px-6 py-3 rounded-md hover:bg-neutral-200 transition-colors"
          >
            Try Mnemo
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/signin"
            className="inline-flex items-center gap-2 bg-neutral-900 border border-neutral-800 text-white text-xs font-medium px-6 py-3 rounded-md hover:bg-neutral-800 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800/60 py-8 px-6 text-center text-xs text-neutral-500 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">

        <span>
          © 2026 Mnemo Corp. All rights reserved.
        </span>

        <div className="flex items-center gap-6 text-neutral-400">

          <a href="#security" className="hover:text-white">
            Security
          </a>

          <a href="#pricing" className="hover:text-white">
            Pricing
          </a>

          <Link href="/workspace" className="hover:text-white">
            Workspace
          </Link>
        </div>
      </footer>

    </div>
  );
}