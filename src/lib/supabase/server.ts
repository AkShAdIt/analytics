import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function isValidHttpUrl(string?: string | null): boolean {
  if (!string) return false;
  try {
    const url = new URL(string.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function createClient() {
  const cookieStore = cookies();
  const rawUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.trim() || '';
  const rawAnonKey = (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim() || '';

  const validUrl = isValidHttpUrl(rawUrl) ? rawUrl : 'https://placeholder.supabase.co';
  const validKey = rawAnonKey || 'placeholder';

  return createServerClient(validUrl, validKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}
