export interface GeoLocation {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
}

export async function resolveGeoLocation(req: Request): Promise<GeoLocation> {
  const headers = req.headers;

  // 1. Extract IP
  const forwardedFor = headers.get('x-forwarded-for');
  let ip = forwardedFor ? forwardedFor.split(',')[0].trim() : headers.get('x-real-ip') || headers.get('cf-connecting-ip') || '';

  // 2. Check Platform Edge Headers (Vercel, Cloudflare, etc.)
  const vercelCountry = headers.get('x-vercel-ip-country');
  const vercelCity = headers.get('x-vercel-ip-city');
  const vercelRegion = headers.get('x-vercel-ip-country-region');

  if (vercelCountry) {
    return {
      ip: ip || '127.0.0.1',
      country: decodeURIComponent(vercelCountry),
      countryCode: vercelCountry.toUpperCase(),
      region: vercelRegion ? decodeURIComponent(vercelRegion) : 'Unknown',
      city: vercelCity ? decodeURIComponent(vercelCity) : 'Unknown',
    };
  }

  const cfCountry = headers.get('cf-ipcountry');
  const cfCity = headers.get('cf-ipcity');
  if (cfCountry && cfCountry !== 'XX') {
    return {
      ip: ip || '127.0.0.1',
      country: cfCountry,
      countryCode: cfCountry.toUpperCase(),
      region: 'Unknown',
      city: cfCity || 'Unknown',
    };
  }

  // 3. Handle localhost / loopback IPs during development
  const isLocal = !ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.');
  if (isLocal) {
    return {
      ip: '127.0.0.1 (Local Dev)',
      country: 'United States',
      countryCode: 'US',
      region: 'California',
      city: 'San Francisco',
    };
  }

  // 4. IP-API lookup with timeout for external public IPs
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        return {
          ip,
          country: data.country || 'Unknown',
          countryCode: (data.countryCode || 'UN').toUpperCase(),
          region: data.regionName || 'Unknown',
          city: data.city || 'Unknown',
        };
      }
    }
  } catch (err) {
    // Silently continue to fallback
  }

  return {
    ip: ip || 'Unknown',
    country: 'Unknown',
    countryCode: 'UN',
    region: 'Unknown',
    city: 'Unknown',
  };
}
