import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Signout failed' }, { status: 500 });
  }
}
