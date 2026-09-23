'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { Terminal, Send, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, Globe, Smartphone, Monitor } from 'lucide-react';

export default function TestSitePage() {
  const [siteId, setSiteId] = useState('demo-site-001');
  const [simulatedPath, setSimulatedPath] = useState('/docs/v1-introduction');
  const [simulatedReferrer, setSimulatedReferrer] = useState('https://news.ycombinator.com');
  const [responseLog, setResponseLog] = useState<any[]>([]);
  const [sending, setSending] = useState(false);

  // Trigger test collection
  const sendPing = async () => {
    setSending(true);
    try {
      const payload = {
        site_id: siteId,
        url: window.location.origin + simulatedPath,
        path: simulatedPath,
        referrer: simulatedReferrer,
        visitor_id: 'sandbox-visitor-' + Math.floor(Math.random() * 1000),
        session_id: 'sandbox-session-1',
        screen_size: `${window.innerWidth}x${window.innerHeight}`,
        language: navigator.language || 'en-US',
      };

      const res = await fetch('/api/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setResponseLog((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          status: res.status,
          payload,
          response: data,
        },
        ...prev,
      ]);
    } catch (err: any) {
      setResponseLog((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          status: 'ERROR',
          error: err.message,
        },
        ...prev,
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Auto-include the real tracker script to verify it loads cleanly */}
      <Script
        src="/tracker.js"
        data-site-id={siteId}
        strategy="afterInteractive"
      />

      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium mb-3">
          <Terminal size={14} />
          <span>Interactive Testing Sandbox</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Test Ingestion & Tracker</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Simulate tracking hits, inspect headers, and verify approximate IP geolocation parsing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Controls Card */}
        <div className="lg:col-span-1 bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-white">Hit Simulator</h2>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Site ID
            </label>
            <input
              type="text"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Target Path
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {['/', '/pricing', '/docs/v1-introduction', '/blog/launch'].map((p) => (
                <button
                  key={p}
                  onClick={() => setSimulatedPath(p)}
                  className={`text-[11px] px-2 py-1 rounded border transition ${
                    simulatedPath === p
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={simulatedPath}
              onChange={(e) => setSimulatedPath(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Referrer URL
            </label>
            <input
              type="text"
              value={simulatedReferrer}
              onChange={(e) => setSimulatedReferrer(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={sendPing}
            disabled={sending}
            className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition shadow-md shadow-indigo-600/25 disabled:opacity-50"
          >
            {sending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
            <span>Trigger Ingestion Hit</span>
          </button>

          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition"
          >
            <span>View In Dashboard</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Live Logs Card */}
        <div className="lg:col-span-2 bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Live Ingestion Inspector</h2>
            <button
              onClick={() => setResponseLog([])}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Clear Logs
            </button>
          </div>

          <div className="flex-1 bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 font-mono text-xs overflow-y-auto max-h-[380px] space-y-4">
            {responseLog.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-zinc-600 gap-2">
                <Terminal size={24} />
                <p>Click "Trigger Ingestion Hit" to send a telemetry beacon to /api/collect</p>
              </div>
            ) : (
              responseLog.map((log, idx) => (
                <div key={idx} className="p-3 bg-zinc-900/90 rounded-lg border border-zinc-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">[{log.timestamp}] HTTP {log.status}</span>
                    <span className="text-emerald-400 font-semibold">200 OK</span>
                  </div>
                  <div className="text-zinc-300">
                    <span className="text-indigo-400">Path:</span> {log.payload?.path}
                  </div>
                  {log.response?.recorded && (
                    <div className="text-zinc-300">
                      <span className="text-emerald-400">Resolved Location:</span>{' '}
                      {log.response.recorded.city ? `${log.response.recorded.city}, ` : ''}{log.response.recorded.country}
                    </div>
                  )}
                  <pre className="text-[11px] text-zinc-500 overflow-x-auto pt-1">
                    {JSON.stringify(log.response, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
