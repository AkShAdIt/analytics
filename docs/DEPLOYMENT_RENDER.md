# Deploying Backend to Render & Connecting Vercel + Supabase

This guide explains how to connect all database features with Supabase, how backend execution works between Vercel and Render, and step-by-step instructions for deploying to Render.

---

## 1. Do You Need a Separate Backend on Render?

Because this project is built with **Next.js (App Router)**, the backend (`/api/collect`, `/api/websites`, `/api/analytics`) is **already included in the Next.js app**.

- **Option A (Recommended & Simplest)**: Run everything on **Vercel**.
  - Frontend + Backend API Routes run seamlessly on Vercel as serverless/edge functions.
  - Supabase PostgreSQL stores the data.
  - Zero extra servers to maintain.

- **Option B (Deploying to Render)**:
  - You can deploy the Next.js app on **Render as a Node Web Service** (Render runs `npm run start`).
  - Useful if you want a dedicated always-on server without serverless execution time limits or cold starts.

---

## 2. Step-by-Step: Deploying Backend to Render

### Method 1: Using Render Blueprint (Fastest - 1 Click)
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Blueprint**.
3. Connect your GitHub repository: `https://github.com/AkShAdIt/analytics`.
4. Render will automatically detect [`render.yaml`](../render.yaml).
5. Fill in the prompted Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL (`https://xyz.supabase.co`).
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon public key.
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service_role secret key (Project Settings -> API).
   - `NEXT_PUBLIC_APP_URL`: Your Render service URL (e.g., `https://pulse-analytics.onrender.com`).
6. Click **Apply**. Render will build and deploy your service.

---

### Method 2: Manual Web Service Setup on Render
1. In [Render Dashboard](https://dashboard.render.com), click **New +** -> **Web Service**.
2. Select your repository: `AkShAdIt/analytics`.
3. Configure the settings:
   - **Name**: `pulse-analytics-backend`
   - **Language**: `Node`
   - **Branch**: `main`
   - **Region**: Nearest to your Supabase database (e.g. Oregon or Frankfurt).
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: `Free` or `Starter`
4. Add the **Environment Variables** in Render:
   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key` |
   | `SUPABASE_SERVICE_ROLE_KEY` | `your-service-role-key` |
   | `NEXT_PUBLIC_APP_URL` | `https://your-service-name.onrender.com` |
   | `NODE_ENV` | `production` |
5. Click **Create Web Service**.

---

## 3. Connecting Vercel Frontend to Render Backend (If Split)

If you host the frontend on Vercel (`https://your-app.vercel.app`) and the backend collector on Render (`https://pulse-analytics.onrender.com`):

1. **Update Tracker Endpoint**:
   Your tracking script tag allows custom endpoint override via `data-endpoint`:
   ```html
   <script defer
     src="https://your-app.vercel.app/tracker.js"
     data-site-id="YOUR_SITE_ID"
     data-endpoint="https://pulse-analytics.onrender.com/api/collect">
   </script>
   ```
2. **CORS**:
   The `/api/collect` route already has CORS enabled (`Access-Control-Allow-Origin: *`), so cross-origin tracking beacons from Vercel to Render work out of the box!

---

## 4. Supabase Database Checklist

Make sure you run the schema migration in your [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql):
Copy the contents of [`supabase/schema.sql`](../supabase/schema.sql) and execute it once to ensure:
- `public.websites` table is created.
- `public.pageviews` table is created.
- Realtime is enabled on `public.pageviews`.
- Row Level Security (RLS) policies are active.
- Explicit permissions (`GRANT ALL ON TABLE ...`) are granted to PostgREST.
