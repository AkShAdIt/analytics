import { NextRequest, NextResponse } from 'next/server';
import { UAParser } from 'ua-parser-js';
import { resolveGeoLocation } from '@/lib/geo';
import { getAdminClient } from '@/lib/supabase/admin';

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

// CORS response helper
function corsResponse(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
  return response;
}

export async function OPTIONS() {
  return corsResponse(new NextResponse(null, { status: 204 }));
}

export async function POST(req: NextRequest) {
  try {
    let body;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      body = await req.json();
    } else {
      const text = await req.text();
      body = text ? JSON.parse(text) : {};
    }

    const {
      site_id,
      url,
      path,
      referrer,
      visitor_id,
      session_id,
      screen_size,
      language,
    } = body;

    if (!site_id) {
      return corsResponse(
        NextResponse.json({ error: 'Missing site_id' }, { status: 400 })
      );
    }

    // 1. Resolve User-Agent details
    const userAgent = req.headers.get('user-agent') || '';
    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser().name || 'Other';
    const os = parser.getOS().name || 'Other';
    const deviceType = parser.getDevice().type || 'desktop';

    // 2. Resolve Geolocation (Edge headers / IP Geolocation fallback)
    const geo = await resolveGeoLocation(req);

    // 3. Database Insertion (if Supabase configured)
    const supabase = getAdminClient();
    if (supabase) {
      const { error } = await supabase.from('pageviews').insert({
        website_id: site_id,
        url: url || path || '/',
        path: path || '/',
        referrer: referrer || null,
        visitor_id: visitor_id || 'anonymous',
        session_id: session_id || null,
        country: geo.country,
        country_code: geo.countryCode,
        region: geo.region,
        city: geo.city,
        browser,
        os,
        device_type: deviceType,
        screen_size: screen_size || null,
        language: language || null,
      });

      if (error) {
        console.error('[Collect API] Supabase error:', error.message);
        if (isSchemaCacheError(error)) {
          // Gracefully handle unmigrated schema so beacons don't fail
          return corsResponse(
            NextResponse.json({
              ok: true,
              warning: "Table 'public.pageviews' not found in schema cache. Please execute supabase/schema.sql.",
              recorded: {
                path: path || '/',
                country: geo.country,
                city: geo.city,
                device: deviceType,
              },
            })
          );
        }
        return corsResponse(
          NextResponse.json({ ok: false, error: error.message }, { status: 500 })
        );
      }
    } else {
      // In Demo/Placeholder mode, record to console so developer can verify tracking
      console.log('[Collect API - Demo Mode Received Hit]:', {
        site_id,
        path,
        geo: `${geo.city}, ${geo.country} (${geo.countryCode})`,
        device: `${deviceType} - ${browser} on ${os}`,
      });
    }

    return corsResponse(
      NextResponse.json({
        ok: true,
        recorded: {
          path: path || '/',
          country: geo.country,
          city: geo.city,
          device: deviceType,
        },
      })
    );
  } catch (err: any) {
    console.error('[Collect API] Unexpected error:', err);
    return corsResponse(
      NextResponse.json({ ok: false, error: err.message }, { status: 500 })
    );
  }
}
