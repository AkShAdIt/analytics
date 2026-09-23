'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [configured, setConfigured] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        setConfigured(Boolean(data.configured));
      })
      .catch(() => {});
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!configured) {
      router.push('/dashboard');
      return;
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign up');
      }

      setMessage('Account created! Please check your email to verify or sign in.');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-indigo-500/10 text-indigo-400 rounded-xl mb-3">
            <UserPlus size={24} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Create Developer Account</h2>
          <p className="text-sm text-zinc-400 mt-1">Start tracking analytics for your apps in minutes</p>
        </div>

        {!configured && (
          <div className="mb-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-indigo-400">
              <Sparkles size={16} />
              <span>Demo Mode Active</span>
            </div>
            <p>
              Supabase credentials are not yet configured in <code>.env.local</code>. You can click below to enter directly into the demo workspace.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3.5 text-zinc-500" />
              <input
                type="email"
                placeholder="developer@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-800/80 border border-zinc-700/80 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                required={configured}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3.5 text-zinc-500" />
              <input
                type="password"
                placeholder="Choose a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-800/80 border border-zinc-700/80 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                required={configured}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition shadow-lg shadow-indigo-600/25 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : configured ? 'Create Account' : 'Enter Dashboard (Demo Mode)'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-zinc-500">
          Already registered?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
