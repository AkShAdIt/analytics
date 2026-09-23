import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ user: null, configured: false });
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return NextResponse.json({ user: user ?? null, configured: true });
  } catch {
    return NextResponse.json({ user: null, configured: true });
  }
}
