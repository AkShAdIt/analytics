import { createBrowserClient } from '@supabase/ssr';

function isValidHttpUrl(string?: string | null): boolean {
  if (!string) return false;
  try {
    const url = new URL(string.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isSupabaseConfigured(): boolean {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.trim();
  const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim();
  return Boolean(
    url &&
    anonKey &&
    isValidHttpUrl(url) &&
    !url.includes('placeholder') &&
    !url.includes('your-project-id') &&
    anonKey !== 'placeholder' &&
    anonKey !== 'placeholder-anon-key'
  );
}

export function createClient(customUrl?: string, customKey?: string) {
  const rawUrl = (customUrl || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.trim() || '';
  const rawAnonKey = (customKey || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim() || '';

  const validUrl = isValidHttpUrl(rawUrl) ? rawUrl : 'https://placeholder.supabase.co';
  const validKey = rawAnonKey || 'placeholder';

  return createBrowserClient(validUrl, validKey);
}
