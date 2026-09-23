import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { getDemoAnalytics } from '@/lib/demo-data';
import { Pageview } from '@/lib/types';

function isSchemaCacheError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  const code = err.code || '';
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    msg.includes('schema cache') ||
    msg.includes('does not exist') ||
    msg.includes('could not find the table')
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const websiteId = searchParams.get('site_id');
  const range = searchParams.get('range') || '7d';

  if (!websiteId) {
    return NextResponse.json({ error: 'Missing site_id parameter' }, { status: 400 });
  }

  // Fallback to demo analytics if Supabase is unconfigured or demo ID
  if (!isSupabaseConfigured() || websiteId.startsWith('demo-') || websiteId.startsWith('site-')) {
    return NextResponse.json(getDemoAnalytics());
  }

  try {
    const supabase = createClient();

    // Determine timestamp cutoff
    let cutoffDays = 7;
    if (range === '24h') cutoffDays = 1;
    else if (range === '30d') cutoffDays = 30;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - cutoffDays);

    // Fetch pageviews for this website within time range
    const { data: pageviews, error } = await supabase
      .from('pageviews')
      .select('*')
      .eq('website_id', websiteId)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Analytics API] Query error:', error.message);
      if (isSchemaCacheError(error)) {
        return NextResponse.json({
          ...getDemoAnalytics(),
          needsMigration: true,
          warning: "Table 'public.pageviews' not found in schema cache. Showing simulation data.",
        });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!pageviews || pageviews.length === 0) {
      return NextResponse.json({
        totalPageviews: 0,
        uniqueVisitors: 0,
        topCountry: { country: 'None', countryCode: 'UN', count: 0 },
        chartData: [],
        topPages: [],
        countries: [],
        devices: [],
        browsers: [],
        referrers: [],
        recentVisits: [],
      });
    }

    // 1. Metric: Total Pageviews & Unique Visitors
    const totalPageviews = pageviews.length;
    const uniqueVisitorIds = new Set(pageviews.map((p) => p.visitor_id));
    const uniqueVisitors = uniqueVisitorIds.size;

    // 2. Aggregate Top Pages
    const pathCounts: Record<string, number> = {};
    pageviews.forEach((p) => {
      pathCounts[p.path] = (pathCounts[p.path] || 0) + 1;
    });
    const topPages = Object.entries(pathCounts)
      .map(([path, views]) => ({
        path,
        views,
        percentage: Math.round((views / totalPageviews) * 100),
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // 3. Aggregate Countries
    const countryCounts: Record<string, { country: string; countryCode: string; count: number }> = {};
    pageviews.forEach((p) => {
      const code = p.country_code || 'UN';
      const name = p.country || 'Unknown';
      if (!countryCounts[code]) {
        countryCounts[code] = { country: name, countryCode: code, count: 0 };
      }
      countryCounts[code].count += 1;
    });

    const countries = Object.values(countryCounts)
      .map((c) => ({
        country: c.country,
        countryCode: c.countryCode,
        visitors: c.count,
        percentage: Math.round((c.count / totalPageviews) * 100),
      }))
      .sort((a, b) => b.visitors - a.visitors);

    const topCountry = countries.length > 0
      ? { country: countries[0].country, countryCode: countries[0].countryCode, count: countries[0].visitors }
      : { country: 'None', countryCode: 'UN', count: 0 };

    // 4. Aggregate Devices
    const deviceCounts: Record<string, number> = {};
    pageviews.forEach((p) => {
      const dev = (p.device_type || 'desktop').charAt(0).toUpperCase() + (p.device_type || 'desktop').slice(1);
      deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;
    });
    const devices = Object.entries(deviceCounts).map(([device, count]) => ({
      device,
      count,
      percentage: Math.round((count / totalPageviews) * 100),
    }));

    // 5. Aggregate Browsers
    const browserCounts: Record<string, number> = {};
    pageviews.forEach((p) => {
      const b = p.browser || 'Other';
      browserCounts[b] = (browserCounts[b] || 0) + 1;
    });
    const browsers = Object.entries(browserCounts)
      .map(([browser, count]) => ({
        browser,
        count,
        percentage: Math.round((count / totalPageviews) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // 6. Aggregate Referrers
    const referrerCounts: Record<string, number> = {};
    pageviews.forEach((p) => {
      let ref = p.referrer || 'Direct / None';
      try {
        if (ref.startsWith('http')) {
          ref = new URL(ref).hostname;
        }
      } catch (e) {}
      referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
    });
    const referrers = Object.entries(referrerCounts)
      .map(([referrer, count]) => ({
        referrer,
        count,
        percentage: Math.round((count / totalPageviews) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // 7. Time series grouping
    const timeBuckets: Record<string, { pageviews: number; visitors: Set<string> }> = {};
    pageviews.forEach((p) => {
      const date = new Date(p.created_at);
      const key = range === '24h'
        ? `${date.getHours().toString().padStart(2, '0')}:00`
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      if (!timeBuckets[key]) {
        timeBuckets[key] = { pageviews: 0, visitors: new Set() };
      }
      timeBuckets[key].pageviews += 1;
      timeBuckets[key].visitors.add(p.visitor_id);
    });

    const chartData = Object.entries(timeBuckets).map(([date, data]) => ({
      date,
      pageviews: data.pageviews,
      visitors: data.visitors.size,
    }));

    // 8. Recent visits stream
    const recentVisits = pageviews.slice(0, 15) as Pageview[];

    return NextResponse.json({
      totalPageviews,
      uniqueVisitors,
      topCountry,
      chartData,
      topPages,
      countries,
      devices,
      browsers,
      referrers,
      recentVisits,
    });
  } catch (err: any) {
    if (isSchemaCacheError(err)) {
      return NextResponse.json({
        ...getDemoAnalytics(),
        needsMigration: true,
      });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
