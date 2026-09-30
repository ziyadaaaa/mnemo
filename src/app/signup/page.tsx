'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const plan =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('plan')
      : null;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError('');
    setMessage('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding/workspace`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        const destination = plan
          ? `/onboarding/workspace?plan=${encodeURIComponent(plan)}`
          : '/onboarding/workspace';

        window.location.href = destination;
        return;
      }

      if (plan) {
        localStorage.setItem('mnemo_selected_plan', plan);
      }

      setMessage(
        'Account created. Check your email to confirm your account, then continue to your workspace.'
      );

      setLoading(false);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <a
            href="/"
            className="text-2xl font-semibold tracking-tight"
          >
            Mnemo
          </a>

          <h1 className="mt-8 text-2xl font-semibold tracking-tight">
            Create your account
          </h1>

          <p className="mt-2 text-sm text-white/45">
            Give your company a memory.
          </p>

          {plan === 'business' && (
            <div className="mt-5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-left">
              <p className="text-xs font-medium text-white/80">
                Business plan selected
              </p>
              <p className="mt-1 text-xs text-white/40">
                $99/month after checkout.
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label
              htmlFor="fullName"
              className="mb-2 block text-xs font-medium text-white/60"
            >
              Full name
            </label>

            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              required
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-xs font-medium text-white/60"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-xs font-medium text-white/60"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-white py-3 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/35">
          Already have an account?{' '}
          <a
            href="/signin"
            className="text-white/70 transition hover:text-white"
          >
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}