import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch (error) {
    console.error('Middleware failure caught:', error);
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - tracker.js (public tracking script)
     * - api/collect (public beacon collector)
     */
    '/((?!_next/static|_next/image|favicon.ico|tracker.js|api/collect|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
