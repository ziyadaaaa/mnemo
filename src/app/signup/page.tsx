'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
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
        window.location.href = '/onboarding/workspace';
        return;
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
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e0] font-sans flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        <div className="mb-8">
          <a
            href="/"
            className="font-serif text-2xl text-white tracking-tight"
          >
            Mnemo
          </a>
        </div>

        <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-8">

          <div className="space-y-2 mb-8">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
              Get started
            </span>

            <h1 className="font-serif text-3xl text-white">
              Create your account.
            </h1>

            <p className="text-sm text-neutral-400">
              Give your company a memory that stays with the team.
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">

            <div className="space-y-2">
              <label
                htmlFor="fullName"
                className="text-[10px] font-mono uppercase tracking-widest text-neutral-400"
              >
                Full name
              </label>

              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                disabled={loading}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-[10px] font-mono uppercase tracking-widest text-neutral-400"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                disabled={loading}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                disabled={loading}
                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 disabled:opacity-50"
              />
            </div>

            {error && (
              <div className="border border-red-900/50 bg-red-950/20 rounded px-3 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {message && (
              <div className="border border-neutral-800 bg-neutral-900 rounded px-3 py-3 text-sm text-neutral-300">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#f5f5f0] text-neutral-950 font-mono text-xs uppercase tracking-wider rounded hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>

          </form>

          <div className="mt-6 pt-6 border-t border-neutral-900 text-center">
            <p className="text-xs text-neutral-500">
              Already have an account?{' '}
              <a
                href="/signin"
                className="text-neutral-300 hover:text-white transition-colors"
              >
                Sign in
              </a>
            </p>
          </div>

        </div>

        <p className="mt-6 text-center text-[10px] text-neutral-600">
          By creating an account, you agree to Mnemo&apos;s terms and privacy policy.
        </p>

      </div>
    </div>
  );
}