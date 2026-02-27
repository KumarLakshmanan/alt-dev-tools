import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";

/**
 * POST /api/analytics/pageview
 * Tracks a page visit. Called client-side from the layout.
 *
 * Body: { page: string, referrer?: string }
 * Derives device type and country from request headers.
 */
export async function POST(req: NextRequest) {
  let page = "";
  let referrer = "";

  try {
    const body = await req.json();
    page = (body?.page ?? "").toString().trim();
    referrer = (body?.referrer ?? "").toString().trim().slice(0, 500);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!page) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Extract user agent
  const userAgent = req.headers.get("user-agent") ?? "";

  // Derive device type from user agent
  let device = "desktop";
  if (/mobile|android|iphone|ipad|tablet/i.test(userAgent)) {
    device = /tablet|ipad/i.test(userAgent) ? "tablet" : "mobile";
  }

  // Country from Vercel's geo header (set automatically in production)
  const country = req.headers.get("x-vercel-ip-country") ?? "";

  // Skip tracking if Supabase is not configured
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: true, persisted: false });
  }

  try {
    const supabase = createSupabaseClient();
    const { error } = await supabase.from("page_views").insert({
      page,
      referrer,
      user_agent: userAgent.slice(0, 500),
      country,
      device,
    });

    if (error) throw error;

    return NextResponse.json({ ok: true, persisted: true });
  } catch (err) {
    console.error("[Analytics] Supabase error:", err);
    return NextResponse.json({ ok: true, persisted: false });
  }
}
