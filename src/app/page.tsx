import Link from 'next/link';
import { ArrowRight, BarChart3, Globe, ShieldCheck, Zap, Code, Laptop, Database } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="relative overflow-hidden py-16 sm:py-24">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-xs font-medium text-indigo-400">
            <Zap size={14} />
            <span>Developer-First Web Analytics • v1</span>
          </div>
        </div>

        {/* Hero Title */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight sm:leading-tight">
            Lightweight Web Analytics for Modern Developers
          </h1>
          <p className="mt-5 text-lg text-zinc-400 leading-relaxed">
            Drop a single script tag into your website. Track visitor telemetry, approximate IP geolocation, device metrics, and referral funnels directly into PostgreSQL on Supabase.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-base font-semibold transition shadow-lg shadow-indigo-600/30"
          >
            <span>Open Analytics Dashboard</span>
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/test-site"
            className="flex items-center gap-2 px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-base font-semibold transition"
          >
            <Laptop size={18} />
            <span>Live Tracking Sandbox</span>
          </Link>
        </div>

        {/* Embed Snippet Highlight */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-sm mb-16 shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-zinc-500">embed-snippet.html</span>
            </div>
            <span className="text-xs text-zinc-400 font-mono">Under 1.5 KB</span>
          </div>
          <pre className="font-mono text-sm text-indigo-300 overflow-x-auto whitespace-pre-wrap py-2">
            {`<script defer src="http://localhost:3000/tracker.js" data-site-id="YOUR_SITE_ID"></script>`}
          </pre>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl w-fit mb-4">
              <Globe size={22} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Approximate IP Geolocation</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Instantly resolve visitor country, region, and city without intrusive tracking or heavy client libraries.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl w-fit mb-4">
              <Database size={22} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">PostgreSQL & Supabase</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              All raw and aggregated telemetry belongs to you. Fully transparent database schema with high-performance indexes.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl w-fit mb-4">
              <ShieldCheck size={22} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Privacy & Disclaimer Ready</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Equipped with recommended disclaimer notices and cookie banners for transparent visitor analytics disclosure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
