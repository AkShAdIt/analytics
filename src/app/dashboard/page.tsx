'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Website, AnalyticsSummary, Pageview } from '@/lib/types';
import RegisterWebsiteModal from '@/components/RegisterWebsiteModal';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Users, Eye, Globe, Laptop, Smartphone, Tablet,
  Plus, Code, RefreshCw, ExternalLink, ShieldAlert,
  ArrowUpRight, Clock, Compass, Layers, Monitor, Trash2, CheckCircle2, Radio
} from 'lucide-react';

// Country flag emoji helper
function getFlagEmoji(countryCode: string | null): string {
  if (!countryCode || countryCode === 'UN' || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default function DashboardPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [selectedSite, setSelectedSite] = useState<Website | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSnippetOpen, setIsSnippetOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isConfigured = isSupabaseConfigured();

  // Fetch websites list
  const loadWebsites = async () => {
    try {
      const res = await fetch('/api/websites');
      const data = await res.json();
      if (data.websites && data.websites.length > 0) {
        setWebsites(data.websites);
        setIsDemo(Boolean(data.isDemo));
        setSelectedSite((current) => {
          if (current && data.websites.some((w: Website) => w.id === current.id)) {
            return current;
          }
          return data.websites[0];
        });
      }
    } catch (err) {
      console.error('Failed to load websites', err);
    }
  };

  // Fetch analytics for selected site & range
  const loadAnalytics = useCallback(async () => {
    if (!selectedSite) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?site_id=${selectedSite.id}&range=${timeRange}`);
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  }, [selectedSite, timeRange]);

  useEffect(() => {
    loadWebsites();
  }, []);

  useEffect(() => {
    if (selectedSite) {
      loadAnalytics();
    }
  }, [selectedSite, timeRange, loadAnalytics]);

  // Realtime Supabase Database Listener
  useEffect(() => {
    if (!isConfigured || !selectedSite || selectedSite.id.startsWith('demo-') || selectedSite.id.startsWith('site-')) {
      return;
    }

    try {
      const supabase = createClient();
      const channel = supabase
        .channel(`realtime-views:${selectedSite.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'pageviews',
            filter: `website_id=eq.${selectedSite.id}`,
          },
          () => {
            loadAnalytics();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.error('Realtime subscription error:', err);
    }
  }, [isConfigured, selectedSite, loadAnalytics]);

  const handleWebsiteCreated = (newSite: Website) => {
    setWebsites((prev) => [newSite, ...prev]);
    setSelectedSite(newSite);
  };

  const handleDeleteWebsite = async () => {
    if (!selectedSite) return;
    if (!confirm(`Are you sure you want to delete ${selectedSite.name}? This will remove all associated pageview analytics.`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/websites?id=${selectedSite.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const remaining = websites.filter((w) => w.id !== selectedSite.id);
        setWebsites(remaining);
        setSelectedSite(remaining[0] || null);
      }
    } catch (err) {
      console.error('Failed to delete website', err);
    } finally {
      setDeleting(false);
    }
  };

  const currentSnippet = selectedSite
    ? `<script defer src="${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/tracker.js" data-site-id="${selectedSite.id}"></script>`
    : '';

  const copySnippet = () => {
    if (!currentSnippet) return;
    navigator.clipboard.writeText(currentSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Database Connection Status Banner */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
        <div className="flex items-center gap-2.5">
          {!isDemo ? (
            <>
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-zinc-200">
                <strong>Database Connected:</strong> Supabase PostgreSQL with Realtime active
              </span>
            </>
          ) : (
            <>
              <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="text-zinc-300">
                <strong>Demo Preview Mode:</strong> Connect your Supabase project in <code>.env.local</code> or Vercel environment variables to persist live visits.
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
          >
            <span>Supabase Dashboard</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div className="flex flex-wrap items-center gap-3">
          {/* Site Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedSite?.id || ''}
              onChange={(e) => {
                const site = websites.find((w) => w.id === e.target.value);
                if (site) setSelectedSite(site);
              }}
              className="px-3.5 py-2 bg-zinc-900 border border-zinc-700/80 rounded-xl text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer pr-8"
            >
              {websites.map((w) => (
                <option key={w.id} value={w.id} className="bg-zinc-900 text-white">
                  {w.name} ({w.domain})
                </option>
              ))}
            </select>
          </div>

          {/* Add Site Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-medium transition"
          >
            <Plus size={15} />
            <span>Add Website</span>
          </button>

          {/* View Snippet Button */}
          {selectedSite && (
            <button
              onClick={() => setIsSnippetOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-medium transition"
            >
              <Code size={15} />
              <span>Get Tracking Code</span>
            </button>
          )}

          {/* Delete Site Button */}
          {selectedSite && websites.length > 1 && (
            <button
              onClick={handleDeleteWebsite}
              disabled={deleting}
              className="p-2 text-zinc-500 hover:text-red-400 bg-zinc-900 border border-zinc-800 hover:border-red-500/30 rounded-xl transition"
              title="Delete Website"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>

        {/* Controls: Time Range & Refresh */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="flex rounded-xl bg-zinc-900 p-1 border border-zinc-800 text-xs font-medium">
            {(['24h', '7d', '30d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  timeRange === r
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {r === '24h' ? '24 Hours' : r === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>

          <button
            onClick={loadAnalytics}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Snippet Modal */}
      {isSnippetOpen && selectedSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative w-full max-w-xl rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-zinc-100">
            <h3 className="text-lg font-bold text-white mb-2">Tracking Code for {selectedSite.name}</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Embed this snippet inside your application's <code className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-200">&lt;head&gt;</code> or root layout:
            </p>

            <div className="relative bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-xs text-indigo-300 overflow-x-auto mb-4">
              <pre>{currentSnippet}</pre>
            </div>

            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200/90 text-xs space-y-1 mb-5">
              <div className="flex items-center gap-1.5 font-semibold text-amber-400">
                <ShieldAlert size={15} />
                <span>Disclaimer / Cookies Recommendation</span>
              </div>
              <p>
                Inform your website visitors through your Privacy Policy or Cookie banner that approximate geolocation and device analytics are collected.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={copySnippet}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
              >
                {copied ? 'Copied!' : 'Copy Snippet'}
              </button>
              <button
                onClick={() => setIsSnippetOpen(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Pageviews</span>
            <Eye size={18} className="text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {analytics?.totalPageviews?.toLocaleString() ?? 0}
          </div>
          <span className="text-[11px] text-zinc-500">Across all tracked routes</span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Unique Visitors</span>
            <Users size={18} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {analytics?.uniqueVisitors?.toLocaleString() ?? 0}
          </div>
          <span className="text-[11px] text-zinc-500">Distinct visitor telemetry</span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Top Location</span>
            <Globe size={18} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white flex items-center gap-2 truncate">
            <span>{getFlagEmoji(analytics?.topCountry?.countryCode || null)}</span>
            <span className="truncate">{analytics?.topCountry?.country || 'N/A'}</span>
          </div>
          <span className="text-[11px] text-zinc-500">
            {analytics?.topCountry?.count?.toLocaleString() ?? 0} visitors
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Views / Visitor</span>
            <Layers size={18} className="text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {analytics && analytics.uniqueVisitors > 0
              ? (analytics.totalPageviews / analytics.uniqueVisitors).toFixed(1)
              : '0.0'}
          </div>
          <span className="text-[11px] text-zinc-500">Engagement depth</span>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-white">Traffic Trends</h3>
            <p className="text-xs text-zinc-400">Visitors and pageviews over time</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span className="text-zinc-300">Pageviews</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-zinc-300">Unique Visitors</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          {analytics?.chartData && analytics.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#52525b" fontSize={11} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '0.75rem',
                    color: '#f4f4f5',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="pageviews" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
                <Area type="monotone" dataKey="visitors" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorVisitors)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
              No traffic recorded yet for this time range.
            </div>
          )}
        </div>
      </div>

      {/* Grid: Geolocation Breakdown & Top Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Geolocation Section */}
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-indigo-400" />
              <h3 className="text-base font-semibold text-white">Approximate IP Geolocation</h3>
            </div>
            <span className="text-xs text-zinc-500">Visitor Origin</span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-80 pr-1">
            {analytics?.countries && analytics.countries.length > 0 ? (
              analytics.countries.map((c, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-medium text-zinc-200">
                      <span>{getFlagEmoji(c.countryCode)}</span>
                      <span>{c.country}</span>
                    </span>
                    <span className="text-zinc-400 font-mono">
                      {c.visitors.toLocaleString()} ({c.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${c.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-zinc-500 text-xs py-4 text-center">No location metrics available.</p>
            )}
          </div>
        </div>

        {/* Top Pages Section */}
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-emerald-400" />
              <h3 className="text-base font-semibold text-white">Top Pages & Paths</h3>
            </div>
            <span className="text-xs text-zinc-500">Views</span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-80 pr-1">
            {analytics?.topPages && analytics.topPages.length > 0 ? (
              analytics.topPages.map((p, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-zinc-300 truncate max-w-[280px]">
                      {p.path}
                    </span>
                    <span className="text-zinc-400 font-mono">
                      {p.views.toLocaleString()} ({p.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${p.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-zinc-500 text-xs py-4 text-center">No pageview paths recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Devices, Browsers, Referrers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Devices */}
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Laptop size={18} className="text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Device Breakdown</h3>
          </div>
          <div className="space-y-3">
            {analytics?.devices && analytics.devices.length > 0 ? (
              analytics.devices.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-zinc-300">
                    {d.device.toLowerCase() === 'mobile' ? (
                      <Smartphone size={14} className="text-zinc-400" />
                    ) : d.device.toLowerCase() === 'tablet' ? (
                      <Tablet size={14} className="text-zinc-400" />
                    ) : (
                      <Monitor size={14} className="text-zinc-400" />
                    )}
                    <span>{d.device}</span>
                  </div>
                  <span className="font-mono text-zinc-400">{d.percentage}%</span>
                </div>
              ))
            ) : (
              <p className="text-zinc-500 text-xs py-2 text-center">No device data.</p>
            )}
          </div>
        </div>

        {/* Browsers */}
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Compass size={18} className="text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Browsers</h3>
          </div>
          <div className="space-y-3">
            {analytics?.browsers && analytics.browsers.length > 0 ? (
              analytics.browsers.map((b, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300">{b.browser}</span>
                  <span className="font-mono text-zinc-400">{b.percentage}%</span>
                </div>
              ))
            ) : (
              <p className="text-zinc-500 text-xs py-2 text-center">No browser data.</p>
            )}
          </div>
        </div>

        {/* Referrers */}
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpRight size={18} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Top Referrers</h3>
          </div>
          <div className="space-y-3">
            {analytics?.referrers && analytics.referrers.length > 0 ? (
              analytics.referrers.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300 truncate max-w-[160px]">{r.referrer}</span>
                  <span className="font-mono text-zinc-400">{r.percentage}%</span>
                </div>
              ))
            ) : (
              <p className="text-zinc-500 text-xs py-2 text-center">No referral channels recorded.</p>
            )}
          </div>
        </div>
      </div>

      {/* Live Recent Visits Table */}
      <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-indigo-400" />
            <h3 className="text-base font-semibold text-white">Live Visitor Stream</h3>
          </div>
          <span className="text-xs text-zinc-500">Recent Ingestion Hits</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Path</th>
                <th className="py-2.5 px-3">Location (Approx. IP)</th>
                <th className="py-2.5 px-3">Device & Browser</th>
                <th className="py-2.5 px-3">Referrer</th>
                <th className="py-2.5 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {analytics?.recentVisits && analytics.recentVisits.length > 0 ? (
                analytics.recentVisits.map((v, i) => (
                  <tr key={i} className="hover:bg-zinc-800/30 transition">
                    <td className="py-2.5 px-3 font-mono text-indigo-300">{v.path}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span>{getFlagEmoji(v.country_code)}</span>
                        <span>{v.city ? `${v.city}, ` : ''}{v.country || 'Unknown'}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 capitalize">
                      {v.device_type} • {v.browser || 'Other'} ({v.os || 'OS'})
                    </td>
                    <td className="py-2.5 px-3 text-zinc-400 truncate max-w-[180px]">
                      {v.referrer || 'Direct'}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-500 font-mono">
                      {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-zinc-500">
                    No recent visits. Embed your snippet and trigger a view on your site!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Website Registration Modal */}
      <RegisterWebsiteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onWebsiteCreated={handleWebsiteCreated}
      />
    </div>
  );
}
