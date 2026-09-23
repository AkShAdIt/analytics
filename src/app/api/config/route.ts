import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function isValidHttpUrl(string?: string | null): boolean {
  if (!string) return false;
  try {
    const url = new URL(string.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function GET() {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.trim() || '';
  const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim() || '';

  const configured = Boolean(
    url &&
    anonKey &&
    isValidHttpUrl(url) &&
    !url.includes('placeholder') &&
    !url.includes('your-project-id') &&
    anonKey !== 'placeholder' &&
    anonKey !== 'placeholder-anon-key'
  );

  return NextResponse.json({
    configured,
    supabaseUrl: configured ? url : '',
    supabaseAnonKey: configured ? anonKey : '',
  });
}
