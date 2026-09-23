export interface Website {
  id: string;
  user_id: string;
  name: string;
  domain: string;
  created_at: string;
}

export interface Pageview {
  id: number;
  website_id: string;
  url: string;
  path: string;
  referrer: string | null;
  visitor_id: string;
  session_id: string | null;
  country: string | null;
  country_code: string | null;
  region: string | null;
  city: string | null;
  browser: string | null;
  os: string | null;
  device_type: 'desktop' | 'mobile' | 'tablet' | string;
  screen_size: string | null;
  language: string | null;
  created_at: string;
}

export interface AnalyticsSummary {
  totalPageviews: number;
  uniqueVisitors: number;
  topCountry: { country: string; countryCode: string; count: number };
  chartData: { date: string; pageviews: number; visitors: number }[];
  topPages: { path: string; views: number; percentage: number }[];
  countries: { country: string; countryCode: string; visitors: number; percentage: number }[];
  devices: { device: string; count: number; percentage: number }[];
  browsers: { browser: string; count: number; percentage: number }[];
  referrers: { referrer: string; count: number; percentage: number }[];
  recentVisits: Pageview[];
}
