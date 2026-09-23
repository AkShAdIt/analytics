'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [configured, setConfigured] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        setConfigured(Boolean(data.configured));
      })
      .catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!configured) {
      // In demo mode, bypass auth and navigate straight to dashboard
      router.push('/dashboard');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-indigo-500/10 text-indigo-400 rounded-xl mb-3">
            <Lock size={24} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Developer Login</h2>
          <p className="text-sm text-zinc-400 mt-1">Access your registered websites and visitor telemetry</p>
        </div>

        {!configured && (
          <div className="mb-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-indigo-400">
              <Sparkles size={16} />
              <span>Demo Mode Active</span>
            </div>
            <p>
              Supabase credentials are not yet configured in <code>.env.local</code>. You can log in with any placeholder email or click below to enter directly.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
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
                placeholder="••••••••"
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
            {loading ? 'Authenticating...' : configured ? 'Sign In' : 'Enter Dashboard (Demo Mode)'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-zinc-500">
          Don't have an account yet?{' '}
          <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
