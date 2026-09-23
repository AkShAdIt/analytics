'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, LayoutDashboard, Terminal, LogOut, User as UserIcon } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    if (!isConfigured) return;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [isConfigured]);

  const handleSignOut = async () => {
    if (isConfigured) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight group">
          <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-600/30 group-hover:scale-105 transition">
            <Activity size={20} />
          </div>
          <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Pulse<span className="text-indigo-400">Analytics</span>
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            v2
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4 text-sm font-medium">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-400 hover:text-white transition rounded-lg hover:bg-zinc-900"
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/test-site"
            className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-400 hover:text-white transition rounded-lg hover:bg-zinc-900"
          >
            <Terminal size={16} />
            <span className="hidden sm:inline">Test Sandbox</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">
                <UserIcon size={12} className="text-indigo-400" />
                <span className="truncate max-w-[140px]">{user.email}</span>
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium border border-zinc-800 transition"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition shadow-md shadow-indigo-600/20"
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
