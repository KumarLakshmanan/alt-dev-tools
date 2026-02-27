-- ALT-DEV TOOLS Database Schema
-- Only the feedbacks and page_views tables are used.
-- License validation is handled 100% by Dodo Payments.
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run

-- ─── feedbacks ────────────────────────────────────────────────────────────────
-- Stores uninstall feedback and general user feedback.
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id         SERIAL      PRIMARY KEY,
  reason     TEXT        NOT NULL DEFAULT '',
  source     TEXT        NOT NULL DEFAULT 'uninstall',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at
  ON public.feedbacks (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedbacks_source
  ON public.feedbacks (source);

-- ─── page_views ───────────────────────────────────────────────────────────────
-- Tracks page visits for the analytics dashboard.
CREATE TABLE IF NOT EXISTS public.page_views (
  id         SERIAL      PRIMARY KEY,
  page       TEXT        NOT NULL,
  referrer   TEXT        NOT NULL DEFAULT '',
  user_agent TEXT        NOT NULL DEFAULT '',
  country    TEXT        NOT NULL DEFAULT '',
  device     TEXT        NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_views_created_at
  ON public.page_views (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_page_views_page
  ON public.page_views (page);

CREATE INDEX IF NOT EXISTS idx_page_views_country
  ON public.page_views (country);

-- ─── Row Level Security ────────────────────────────────────────────────────────
-- These tables are accessed server-side via the service role key only.
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Block all direct public access (service role bypasses RLS)
CREATE POLICY "No public access to feedbacks"
  ON public.feedbacks
  FOR ALL USING (FALSE);

CREATE POLICY "No public access to page_views"
  ON public.page_views
  FOR ALL USING (FALSE);
