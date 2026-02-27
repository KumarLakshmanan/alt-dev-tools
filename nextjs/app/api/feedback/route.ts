import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";

/**
 * POST /api/feedback
 * Saves uninstall/general feedback to the Supabase `feedbacks` table.
 *
 * Required env variables:
 *   SUPABASE_URL              — Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — Supabase service role key (server-side only)
 *
 * Table setup (run in Supabase SQL Editor or via the migration file):
 *   CREATE TABLE IF NOT EXISTS feedbacks (
 *     id         SERIAL      PRIMARY KEY,
 *     source     TEXT        NOT NULL DEFAULT 'uninstall',
 *     reason     TEXT        NOT NULL DEFAULT '',
 *     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 *   );
 */
export async function POST(req: NextRequest) {
  let reason = "";
  let source = "unknown";

  try {
    const body = await req.json();
    reason = (body?.reason ?? "").toString().trim();
    source = (body?.source ?? "unknown").toString().trim();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid body." }, { status: 400 });
  }

  if (!reason) {
    return NextResponse.json({ success: false, error: "Reason is required." }, { status: 400 });
  }

  // If Supabase is not configured, fall back to console-only logging
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log(`[Feedback] source=${source} reason="${reason}" (Supabase not configured — not persisted)`);
    return NextResponse.json({ success: true, persisted: false });
  }

  try {
    const supabase = createSupabaseClient();
    const { error } = await supabase
      .from("feedbacks")
      .insert({ source, reason });

    if (error) throw error;

    return NextResponse.json({ success: true, persisted: true });
  } catch (err) {
    console.error("[Feedback] Supabase error:", err);
    // Don't surface DB errors to the client
    return NextResponse.json({ success: true, persisted: false });
  }
}

