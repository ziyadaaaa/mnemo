'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      const supabase = createClient();

      // 1. Sign in
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError('Unable to sign in. Please try again.');
        setLoading(false);
        return;
      }

      // 2. Ask the server whether this user already has a workspace.
      const workspaceResponse = await fetch('/api/auth/workspace', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      const workspaceData = await workspaceResponse.json();

      // 3. Server/authentication error
      if (!workspaceResponse.ok) {
        console.error(
          'Workspace check failed:',
          workspaceData
        );

        setError(
          workspaceData.error ||
            'Your account was signed in, but we could not check your workspace.'
        );

        setLoading(false);
        return;
      }

      // 4. No workspace yet → onboarding
      if (!workspaceData.hasWorkspace) {
        window.location.href = '/onboarding/workspace';
        return;
      }

      // 5. Existing workspace → workspace dashboard
      window.location.href = '/workspace';
    } catch (error) {
      console.error('SIGN IN ERROR:', error);

      setError(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.'
      );

      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e0] font-sans flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-sm space-y-8 bg-neutral-950 border border-neutral-900 p-8 rounded-xl">

        <div className="text-center space-y-2">
          <Link
            href="/"
            className="font-serif text-xl tracking-widest text-[#f5f5f0] inline-block mb-4"
          >
            MNEMO
          </Link>

          <h2 className="font-serif text-2xl text-white">
            Welcome back
          </h2>

          <p className="text-xs font-mono text-neutral-500">
            Return to your company&apos;s memory.
          </p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">

          <div className="space-y-1">
            <label
              htmlFor="email"
              className="text-[10px] font-mono uppercase tracking-widest text-neutral-400"
            >
              Work email
            </label>

            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-600 disabled:opacity-50"
              placeholder="you@company.com"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="password"
              className="text-[10px] font-mono uppercase tracking-widest text-neutral-400"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-600 disabled:opacity-50"
              placeholder="Your password"
            />
          </div>

          {error && (
            <div className="border border-red-900/50 bg-red-950/20 rounded p-3">
              <p className="text-xs font-mono text-red-400">
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#f5f5f0] text-neutral-950 font-mono text-xs uppercase tracking-wider rounded hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

        </form>

        <div className="text-center text-xs font-mono text-neutral-500 pt-4 border-t border-neutral-900">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="text-white underline"
          >
            Create one
          </Link>
        </div>

      </div>
    </div>
  );
}

