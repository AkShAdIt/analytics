import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { Activity, LayoutDashboard, Globe, Shield, Terminal } from 'lucide-react';

export const metadata: Metadata = {
  title: 'PulseAnalytics - Developer Web Analytics',
  description: 'Lightweight, privacy-conscious web analytics with IP approximate geolocation for developers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen flex flex-col antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
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
                v1
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
              <Link
                href="/login"
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition shadow-md shadow-indigo-600/20"
              >
                Sign In
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-600">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© 2026 PulseAnalytics. Lightweight developer-first telemetry & approximate IP geolocation.</p>
            <div className="flex items-center gap-4 text-zinc-500">
              <Link href="/test-site" className="hover:text-zinc-300">Sandbox</Link>
              <Link href="/dashboard" className="hover:text-zinc-300">Dashboard</Link>
              <span>Built with Next.js & Supabase</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
