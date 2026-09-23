-- ==============================================================================
-- Developer Analytics Platform - Supabase PostgreSQL Schema (v2)
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. Create Websites Table
CREATE TABLE IF NOT EXISTS public.websites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    domain TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Pageviews Table
CREATE TABLE IF NOT EXISTS public.pageviews (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    website_id UUID REFERENCES public.websites(id) ON DELETE CASCADE NOT NULL,
    url TEXT NOT NULL,
    path TEXT NOT NULL,
    referrer TEXT,
    visitor_id TEXT NOT NULL,
    session_id TEXT,
    country TEXT,
    country_code VARCHAR(10),
    region TEXT,
    city TEXT,
    browser VARCHAR(50),
    os VARCHAR(50),
    device_type VARCHAR(20) DEFAULT 'desktop',
    screen_size VARCHAR(20),
    language VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. High Performance Indexes
CREATE INDEX IF NOT EXISTS idx_websites_user_id ON public.websites(user_id);
CREATE INDEX IF NOT EXISTS idx_pageviews_website_created ON public.pageviews(website_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pageviews_website_path ON public.pageviews(website_id, path);
CREATE INDEX IF NOT EXISTS idx_pageviews_website_country ON public.pageviews(website_id, country_code);
CREATE INDEX IF NOT EXISTS idx_pageviews_website_visitor ON public.pageviews(website_id, visitor_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pageviews ENABLE ROW LEVEL SECURITY;

-- 5. Websites RLS Policies (Users can only access their own registered websites)
DROP POLICY IF EXISTS "Users can view their own websites" ON public.websites;
CREATE POLICY "Users can view their own websites"
    ON public.websites FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own websites" ON public.websites;
CREATE POLICY "Users can create their own websites"
    ON public.websites FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own websites" ON public.websites;
CREATE POLICY "Users can update their own websites"
    ON public.websites FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own websites" ON public.websites;
CREATE POLICY "Users can delete their own websites"
    ON public.websites FOR DELETE
    USING (auth.uid() = user_id);

-- 6. Pageviews RLS Policies
DROP POLICY IF EXISTS "Users can view pageviews for their own websites" ON public.pageviews;
CREATE POLICY "Users can view pageviews for their own websites"
    ON public.pageviews FOR SELECT
    USING (
        website_id IN (
            SELECT id FROM public.websites WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Service role and anon can record pageviews" ON public.pageviews;
CREATE POLICY "Service role and anon can record pageviews"
    ON public.pageviews FOR INSERT
    WITH CHECK (true);

-- 7. Permissions & Grants for PostgREST Schema Cache (Fixes PGRST205: 'Could not find the table in schema cache')
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.websites TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.pageviews TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 8. Force PostgREST to reload its schema cache immediately
NOTIFY pgrst, 'reload schema';

-- Helpful comments
COMMENT ON TABLE public.websites IS 'Registered websites by developers';
COMMENT ON TABLE public.pageviews IS 'Recorded analytics visits, approximate geo locations and client telemetry';
