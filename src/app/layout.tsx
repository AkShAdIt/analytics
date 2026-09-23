import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

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
        <Navbar />

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
