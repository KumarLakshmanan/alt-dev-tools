-- HoverQR Supabase Database Schema
-- Run in: Supabase Dashboard → SQL Editor, or via supabase CLI:
--   supabase db push

-- ─── Enable extensions ──────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── activation_keys ────────────────────────────────────────────────────────
-- Stores one row per purchased activation key.
CREATE TABLE IF NOT EXISTS public.activation_keys (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email                    TEXT        NOT NULL,
  key                      TEXT        NOT NULL UNIQUE,
  tier                     TEXT        NOT NULL DEFAULT 'pro',
  stripe_payment_intent_id TEXT        UNIQUE,
  is_active                BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at               TIMESTAMPTZ          -- NULL = lifetime
);

CREATE INDEX IF NOT EXISTS idx_activation_keys_email
  ON public.activation_keys (email);

CREATE INDEX IF NOT EXISTS idx_activation_keys_key
  ON public.activation_keys (key);

CREATE INDEX IF NOT EXISTS idx_activation_keys_stripe
  ON public.activation_keys (stripe_payment_intent_id);

-- ─── email_otps ─────────────────────────────────────────────────────────────
-- Stores short-lived OTPs for email verification (key retrieval).
CREATE TABLE IF NOT EXISTS public.email_otps (
  email      TEXT        PRIMARY KEY,
  otp        TEXT        NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-cleanup expired OTPs (run this as a cron job or pg_cron)
-- DELETE FROM public.email_otps WHERE expires_at < NOW();

-- ─── Row Level Security ──────────────────────────────────────────────────────
-- These tables are only accessed server-side via the service role key.
-- Disable public access entirely.

ALTER TABLE public.activation_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;

-- Block all direct client access (service role bypasses RLS)
CREATE POLICY "No public access to activation_keys"
  ON public.activation_keys
  FOR ALL USING (FALSE);

CREATE POLICY "No public access to email_otps"
  ON public.email_otps
  FOR ALL USING (FALSE);

-- ─── Optional: pg_cron cleanup job (if pg_cron extension available) ──────────
-- SELECT cron.schedule('cleanup-expired-otps', '*/15 * * * *',
--   'DELETE FROM public.email_otps WHERE expires_at < NOW()');
