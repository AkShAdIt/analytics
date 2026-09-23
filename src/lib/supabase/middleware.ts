import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

    if (
      !rawUrl ||
      !rawAnonKey ||
      rawUrl.includes('placeholder') ||
      rawUrl.includes('your-project-id') ||
      rawAnonKey === 'placeholder' ||
      rawAnonKey === 'placeholder-anon-key'
    ) {
      return response;
    }

    // Ensure URL is a valid http/https URL before creating client
    try {
      const parsedUrl = new URL(rawUrl);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return response;
      }
    } catch {
      return response;
    }

    const supabase = createServerClient(rawUrl, rawAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    // Refresh auth token if expired - silently handle any auth/network errors
    await supabase.auth.getUser();

    return response;
  } catch (error) {
    // Prevent unhandled errors from crashing Vercel middleware
    console.error('Middleware session update error:', error);
    return response;
  }
}
