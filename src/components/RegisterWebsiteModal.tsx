'use client';

import React, { useState } from 'react';
import { Website } from '@/lib/types';
import { X, Copy, Check, Code, ShieldAlert, Globe, ArrowRight, Database, ExternalLink, RefreshCw } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onWebsiteCreated: (website: Website) => void;
}

export default function RegisterWebsiteModal({ isOpen, onClose, onWebsiteCreated }: Props) {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsMigration, setNeedsMigration] = useState(false);
  const [createdSite, setCreatedSite] = useState<Website | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const snippet = createdSite
    ? `<script defer src="${appUrl}/tracker.js" data-site-id="${createdSite.id}"></script>`
    : '';

  const handleSubmit = async (e?: React.FormEvent, forceDemo = false) => {
    if (e) e.preventDefault();
    if (!name || !domain) {
      setError('Please fill in both name and domain.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/websites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, domain, fallback_demo: forceDemo }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.needsMigration || (data.error && data.error.includes('schema cache'))) {
          setNeedsMigration(true);
          setError("Supabase table 'public.websites' was not found in schema cache. You can run the SQL migration or continue in demo mode.");
          return;
        }
        throw new Error(data.error || 'Failed to register website');
      }

      setCreatedSite(data.website);
      onWebsiteCreated(data.website);
      setNeedsMigration(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!snippet) return;
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const copySqlSchema = () => {
    const sql = `-- Quick fix for Supabase schema cache
CREATE TABLE IF NOT EXISTS public.websites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    domain TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.pageviews (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    website_id UUID REFERENCES public.websites(id) ON DELETE CASCADE NOT NULL,
    url TEXT NOT NULL,
    path TEXT NOT NULL,
    referrer TEXT,
    visitor_id TEXT NOT NULL,
    session_id TEXT,
    country TEXT,
    country_code VARCHAR(10),
    region TEXT,
    city TEXT,
    browser VARCHAR(50),
    os VARCHAR(50),
    device_type VARCHAR(20) DEFAULT 'desktop',
    screen_size VARCHAR(20),
    language VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.websites TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.pageviews TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleReset = () => {
    setCreatedSite(null);
    setName('');
    setDomain('');
    setError('');
    setNeedsMigration(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-zinc-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleReset}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition"
        >
          <X size={18} />
        </button>

        {!createdSite ? (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                <Globe size={22} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Register Website</h3>
                <p className="text-sm text-zinc-400">Add your web application to get tracking analytics.</p>
              </div>
            </div>

            {/* Schema Cache Alert Helper */}
            {needsMigration && (
              <div className="mb-5 p-4 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-200 text-xs space-y-3">
                <div className="flex items-center gap-2 font-semibold text-amber-400">
                  <Database size={16} />
                  <span>Supabase Schema Setup Required</span>
                </div>
                <p className="leading-relaxed">
                  Your Supabase project is connected, but the <code>public.websites</code> table hasn't been created or granted permissions in PostgreSQL yet.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={copySqlSchema}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded-lg font-medium transition"
                  >
                    {copiedSql ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedSql ? 'SQL Copied!' : 'Copy SQL Script'}</span>
                  </button>

                  <a
                    href="https://supabase.com/dashboard/project/_/sql"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition font-medium"
                  >
                    <span>Open Supabase SQL Editor</span>
                    <ExternalLink size={12} />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleSubmit(undefined, true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition font-medium shadow-sm ml-auto"
                  >
                    <span>Continue in Demo Mode</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {error && !needsMigration && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Website Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. My SaaS Landing"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-800/80 border border-zinc-700/70 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Domain / URL
                </label>
                <input
                  type="text"
                  placeholder="e.g. app.mycompany.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-800/80 border border-zinc-700/70 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {loading ? 'Registering...' : 'Register & Generate Snippet'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <Code size={22} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Your Tracking Snippet is Ready</h3>
                <p className="text-sm text-zinc-400">
                  Embed this single line inside the <code className="text-zinc-200 bg-zinc-800 px-1 py-0.5 rounded">&lt;head&gt;</code> of your website.
                </p>
              </div>
            </div>

            {/* Code Snippet Box */}
            <div className="relative group bg-zinc-950 border border-zinc-800 rounded-xl p-4 my-4 font-mono text-xs text-indigo-300 overflow-x-auto">
              <pre className="pr-12">{snippet}</pre>
              <button
                onClick={handleCopy}
                className="absolute top-3 right-3 p-2 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-200 rounded-lg transition border border-zinc-700 flex items-center gap-1.5 text-xs font-sans"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Disclaimer & Privacy Guidance as requested in spec item 3 */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200/90 text-xs space-y-1.5 mb-6">
              <div className="flex items-center gap-2 font-semibold text-amber-400">
                <ShieldAlert size={16} />
                <span>Privacy & Disclaimer Recommendation</span>
              </div>
              <p className="leading-relaxed">
                This tracking script collects anonymous browser telemetry and resolves approximate IP-based geolocation (country, region, city).
                Please ensure you update your website's <strong>Privacy Policy</strong> or present a <strong>Cookie / Analytics notice</strong> informing your users that approximate location and usage analytics are gathered.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-zinc-500">
                Site ID: <code className="text-zinc-400">{createdSite.id}</code>
              </span>
              <button
                onClick={handleReset}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-white rounded-lg text-sm font-medium transition"
              >
                Done & View Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
