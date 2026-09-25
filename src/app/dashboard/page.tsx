'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkUser() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/auth');
      } else {
        setUser(user);
      }
      setLoading(false);
    }
    checkUser();
  }, [router, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-400 flex items-center justify-center text-sm">
        Loading Mnemo workspace...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-neutral-900 px-6 py-4 flex items-center justify-between max-w-7xl w-full mx-auto">
        <div className="flex items-center space-x-3">
          <span className="font-medium tracking-tight text-white text-lg">Mnemo</span>
          <span className="text-xs px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">Workspace</span>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <span className="text-neutral-400 hidden sm:inline">{user?.email}</span>
          <button
            onClick={handleSignOut}
            className="text-neutral-400 hover:text-white transition"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-12 space-y-10">
        
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-normal tracking-tight text-white">Good morning.</h1>
          <p className="text-neutral-400 text-sm">
            Your business memory is active. What would you like to recall or record today?
          </p>
        </div>

        {/* Core Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Ask Mnemo Card (Primary CTA) */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col justify-between space-y-6 hover:border-neutral-700 transition">
            <div>
              <div className="inline-block px-2.5 py-1 rounded bg-neutral-800 text-neutral-300 text-xs mb-3 font-medium">
                Retrieval Engine
              </div>
              <h2 className="text-xl font-medium text-white mb-2">Ask Mnemo</h2>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Query your company’s persistent memory. Ask about past decisions, client agreements, responsibilities, or project context.
              </p>
            </div>
            <Link
              href="/ask"
              className="inline-flex items-center justify-center w-full py-3 bg-white text-neutral-950 font-medium rounded-lg hover:bg-neutral-200 transition text-sm"
            >
              Open Ask Mnemo →
            </Link>
          </div>

          {/* Ingest Memory Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col justify-between space-y-6 hover:border-neutral-700 transition">
            <div>
              <div className="inline-block px-2.5 py-1 rounded bg-neutral-800 text-neutral-300 text-xs mb-3 font-medium">
                Automatic Ingestion
              </div>
              <h2 className="text-xl font-medium text-white mb-2">Feed Business Context</h2>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Input raw notes, meeting transcripts, or quick updates. Mnemo automatically extracts decisions, tasks, and people.
              </p>
            </div>
            <Link
              href="/ingest"
              className="inline-flex items-center justify-center w-full py-3 bg-neutral-800 text-white font-medium rounded-lg hover:bg-neutral-700 transition text-sm border border-neutral-700"
            >
              Ingest New Information →
            </Link>
          </div>

        </div>

        {/* Recent Memory Overview Section */}
        <div className="space-y-4 pt-6">
          <h3 className="text-xs uppercase tracking-wider text-neutral-500 font-medium">
            System Status
          </h3>
          <div className="bg-neutral-900/50 border border-neutral-900 rounded-xl p-6 text-center text-neutral-400 text-sm">
            No memories indexed yet. Use the <Link href="/ingest" className="text-white underline hover:text-neutral-300">ingestion tool</Link> to add your first business notes.
          </div>
        </div>

      </main>
    </div>
  );
}
