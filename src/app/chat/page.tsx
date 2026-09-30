'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Database,
  FileText,
  Loader2,
  MessageSquare,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';

interface Citation {
  title?: string;
  category?: string;
  source_type?: string;
  type?: string;
  snippet?: string;
  similarity?: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  error?: boolean;
}

const STARTER_QUESTIONS = [
  'What was our Q3 marketing budget?',
  'What did the team decide about hiring?',
  'What are our customer support policies?',
  'When is the next product launch?',
];

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get('q');

    if (initialQuery) {
      setInput(initialQuery);

      // Automatically ask the question passed from the workspace.
      setTimeout(() => {
        askQuestion(initialQuery);
      }, 150);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [messages, isLoading]);

  const askQuestion = async (question: string) => {
    const trimmed = question.trim();

    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

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

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error || 'Mnemo could not answer this question.'
        );
      }

      const assistantMessage: Message = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content:
          data?.answer ||
          'I could not find a useful answer in the company memory.',
        citations: Array.isArray(data?.citations)
          ? data.citations
          : [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const assistantMessage: Message = {
        id: `${Date.now()}-error`,
        role: 'assistant',
        content:
          error?.message ||
          'Something went wrong while searching company memory.',
        error: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    askQuestion(input);
  };

  const handleStarterQuestion = (question: string) => {
    if (isLoading) return;
    askQuestion(question);
  };

  const clearConversation = () => {
    setMessages([]);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] antialiased">
      {/* Top navigation */}
      <header className="sticky top-0 z-40 border-b border-neutral-800/70 bg-[#0a0a0a]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/workspace"
              className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Workspace
            </Link>

            <div className="h-5 w-px bg-neutral-800" />

            <Link
              href="/"
              className="flex items-center gap-2.5"
            >
              <div className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center font-bold text-xs">
                M
              </div>

              <span className="font-semibold tracking-tight text-white">
                MNEMO
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-neutral-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Private workspace
            </div>

            {messages.length > 0 && (
              <button
                onClick={clearConversation}
                className="text-xs text-neutral-500 hover:text-white transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 sm:px-6">
        {/* Intro */}
        {messages.length === 0 ? (
          <section className="min-h-[calc(100vh-64px)] flex flex-col justify-center py-16">
            <div className="max-w-3xl mx-auto w-full">
              <div className="flex justify-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="text-center space-y-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-medium">
                  Company memory
                </p>

                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                  Ask Mnemo.
                </h1>

                <p className="text-sm text-neutral-400 max-w-xl mx-auto leading-relaxed">
                  Ask questions about your company&apos;s documents,
                  decisions, processes, projects, and stored knowledge.
                  Mnemo searches the company memory and returns answers
                  grounded in its sources.
                </p>
              </div>

              {/* Main input */}
              <form
                onSubmit={handleSubmit}
                className="mt-10"
              >
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />

                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about a decision, project, client, process..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-11 pr-14 py-4 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 shadow-2xl"
                    autoFocus
                  />

                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-200 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Starter questions */}
              <div className="mt-8">
                <p className="text-[10px] uppercase tracking-wider text-neutral-600 font-medium mb-3">
                  Try a question
                </p>

                <div className="grid sm:grid-cols-2 gap-2">
                  {STARTER_QUESTIONS.map((question) => (
                    <button
                      key={question}
                      onClick={() => handleStarterQuestion(question)}
                      className="group text-left px-4 py-3 rounded-xl border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900 hover:border-neutral-700 transition-all"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-neutral-300 group-hover:text-white">
                          {question}
                        </span>

                        <ArrowRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-300 shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Trust line */}
              <div className="flex justify-center items-center gap-5 mt-10 text-[10px] text-neutral-600">
                <span className="flex items-center gap-1.5">
                  <Database className="w-3 h-3" />
                  Vector search
                </span>

                <span>·</span>

                <span className="flex items-center gap-1.5">
                  <FileText className="w-3 h-3" />
                  Source-backed
                </span>

                <span>·</span>

                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3" />
                  Workspace isolated
                </span>
              </div>
            </div>
          </section>
        ) : (
          <section className="py-10 pb-40">
            <div className="space-y-8">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.role === 'user'
                      ? 'flex justify-end'
                      : 'flex justify-start'
                  }
                >
                  {message.role === 'user' ? (
                    <div className="max-w-[85%] sm:max-w-[75%]">
                      <div className="bg-white text-black rounded-2xl rounded-br-md px-4 py-3">
                        <p className="text-sm leading-relaxed">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full max-w-3xl">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                          <Sparkles className="w-3.5 h-3.5 text-white" />
                        </div>

                        <span className="text-xs font-medium text-white">
                          Mnemo
                        </span>

                        {!message.error && (
                          <span className="text-[10px] text-neutral-600">
                            Company memory
                          </span>
                        )}
                      </div>

                      <div
                        className={`rounded-2xl border p-5 ${
                          message.error
                            ? 'bg-red-500/5 border-red-500/20'
                            : 'bg-neutral-900/50 border-neutral-800'
                        }`}
                      >
                        <p
                          className={`text-sm leading-7 whitespace-pre-wrap ${
                            message.error
                              ? 'text-red-300'
                              : 'text-neutral-200'
                          }`}
                        >
                          {message.content}
                        </p>

                        {!message.error &&
                          message.citations &&
                          message.citations.length > 0 && (
                            <div className="mt-6 pt-5 border-t border-neutral-800">
                              <div className="flex items-center gap-2 mb-3">
                                <FileText className="w-3.5 h-3.5 text-neutral-500" />

                                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">
                                  Sources
                                </span>

                                <span className="text-[10px] text-neutral-700">
                                  {message.citations.length} memories
                                </span>
                              </div>

                              <div className="grid sm:grid-cols-2 gap-2">
                                {message.citations.map(
                                  (citation, index) => (
                                    <button
                                      key={`${citation.title}-${index}`}
                                      onClick={() =>
                                        setSelectedCitation(citation)
                                      }
                                      className="text-left p-3 rounded-xl border border-neutral-800 bg-neutral-950/70 hover:bg-neutral-900 hover:border-neutral-700 transition-colors"
                                    >
                                      <div className="flex items-start gap-2.5">
                                        <FileText className="w-3.5 h-3.5 text-neutral-500 mt-0.5 shrink-0" />

                                        <div className="min-w-0">
                                          <p className="text-xs text-neutral-200 font-medium truncate">
                                            {citation.title ||
                                              'Company document'}
                                          </p>

                                          <p className="text-[10px] text-neutral-600 mt-1">
                                            {citation.category ||
                                              citation.source_type ||
                                              citation.type ||
                                              'Company memory'}
                                          </p>
                                        </div>
                                      </div>
                                    </button>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="w-full max-w-3xl">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>

                      <span className="text-xs font-medium text-white">
                        Mnemo
                      </span>
                    </div>

                    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
                      <div className="flex items-center gap-3 text-xs text-neutral-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Searching company memory...
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </section>
        )}
      </main>

      {/* Persistent composer after conversation starts */}
      {messages.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-8 pb-5">
          <div className="max-w-4xl mx-auto px-5 sm:px-6">
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />

                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask another question..."
                  disabled={isLoading}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-11 pr-14 py-4 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 shadow-2xl disabled:opacity-60"
                />

                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-200 transition-colors"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>

            <p className="text-center text-[9px] text-neutral-700 mt-2">
              Mnemo answers from indexed company knowledge. Always verify
              critical information against the cited source.
            </p>
          </div>
        </div>
      )}

      {/* Citation inspection modal */}
      {selectedCitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full shadow-2xl">
            <div className="flex items-start justify-between p-5 border-b border-neutral-800">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-neutral-300" />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {selectedCitation.title || 'Company document'}
                  </p>

                  <p className="text-[10px] text-neutral-500 mt-1">
                    {selectedCitation.category ||
                      selectedCitation.source_type ||
                      selectedCitation.type ||
                      'Company memory'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCitation(null)}
                className="text-neutral-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium mb-2">
                  Retrieved source excerpt
                </p>

                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 max-h-72 overflow-y-auto">
                  <p className="text-xs text-neutral-300 leading-6 whitespace-pre-wrap">
                    {selectedCitation.snippet ||
                      'No source excerpt was returned for this memory.'}
                  </p>
                </div>
              </div>

              {typeof selectedCitation.similarity === 'number' && (
                <div className="flex items-center justify-between text-[10px] text-neutral-500">
                  <span>Retrieval relevance</span>
                  <span className="font-mono text-neutral-400">
                    {Math.round(selectedCitation.similarity * 100)}%
                  </span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedCitation(null)}
                  className="bg-white text-black text-xs font-medium px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}