import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { DEMO_WEBSITES } from '@/lib/demo-data';

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

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      websites: DEMO_WEBSITES,
      isDemo: true,
    });
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ websites: DEMO_WEBSITES, isDemo: true });
    }

    const { data, error } = await supabase
      .from('websites')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      if (isSchemaCacheError(error)) {
        return NextResponse.json({
          websites: DEMO_WEBSITES,
          isDemo: true,
          needsMigration: true,
          warning: "Table 'public.websites' not found in your Supabase schema cache. Please run supabase/schema.sql.",
        });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ websites: data || [], isDemo: false });
  } catch (err: any) {
    if (isSchemaCacheError(err)) {
      return NextResponse.json({
        websites: DEMO_WEBSITES,
        isDemo: true,
        needsMigration: true,
      });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, domain, fallback_demo } = await req.json();

    if (!name || !domain) {
      return NextResponse.json({ error: 'Name and domain are required' }, { status: 400 });
    }

    // Clean domain
    const cleanDomain = domain
      .replace(/^https?:\/\//i, '')
      .replace(/\/.*$/, '')
      .trim();

    const mockSite = {
      id: 'site-' + Math.random().toString(36).substring(2, 9),
      user_id: 'demo-user',
      name,
      domain: cleanDomain,
      created_at: new Date().toISOString(),
    };

    if (fallback_demo || !isSupabaseConfigured()) {
      return NextResponse.json({ website: mockSite, isDemo: true });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // If user isn't logged in with Supabase auth, provide demo site
      return NextResponse.json({ website: mockSite, isDemo: true });
    }

    const { data, error } = await supabase
      .from('websites')
      .insert({
        user_id: user.id,
        name,
        domain: cleanDomain,
      })
      .select()
      .single();

    if (error) {
      console.error('[Websites API] Insert error:', error.message);
      if (isSchemaCacheError(error)) {
        return NextResponse.json(
          {
            error: "Could not find the table 'public.websites' in the Supabase schema cache.",
            code: 'PGRST205',
            needsMigration: true,
            fallbackSite: mockSite,
            message:
              "The 'websites' table has not been created in your Supabase database or PostgREST hasn't reloaded its schema cache.",
          },
          { status: 422 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ website: data, isDemo: false });
  } catch (err: any) {
    if (isSchemaCacheError(err)) {
      return NextResponse.json(
        {
          error: "Could not find the table 'public.websites' in the Supabase schema cache.",
          code: 'PGRST205',
          needsMigration: true,
        },
        { status: 422 }
      );
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
