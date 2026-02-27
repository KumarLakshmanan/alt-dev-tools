import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";

/**
 * GET /api/analytics/data?days=30
 * Returns aggregated analytics: total views, unique pages, by country, by device,
 * by page, top referrers, and a daily time series for the last N days.
 *
 * Requires header: x-admin-token (base64 token from /api/analytics/auth)
 */
export async function GET(req: NextRequest) {
  // Validate admin token
  const token = req.headers.get("x-admin-token") ?? "";
  if (!isValidToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const days = Math.min(parseInt(req.nextUrl.searchParams.get("days") ?? "30"), 90);

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });
  }

  try {
    const supabase = createSupabaseClient();
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Fetch all page views in the time range
    const { data: views, error } = await supabase
      .from("page_views")
      .select("page, referrer, country, device, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const total = views?.length ?? 0;

    // Aggregate by page
    const byPage = aggregate(views ?? [], "page");

    // Aggregate by country
    const byCountry = aggregate(views ?? [], "country");

    // Aggregate by device
    const byDevice = aggregate(views ?? [], "device");

    // Aggregate by referrer (top 10, skip empty)
    const byReferrer = aggregate(
      (views ?? []).filter((v) => v.referrer),
      "referrer"
    ).slice(0, 10);

    // Daily time series
    const byDay = buildDailySeries(views ?? [], days);

    // Feedback summary
    const { data: feedbacks, error: fbError } = await supabase
      .from("feedbacks")
      .select("reason, source, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    if (fbError) throw fbError;

    return NextResponse.json({
      total,
      days,
      byPage,
      byCountry,
      byDevice,
      byReferrer,
      byDay,
      feedbacks: feedbacks ?? [],
    });
  } catch (err) {
    console.error("[Analytics data] error:", err);
    return NextResponse.json({ error: "Failed to fetch analytics." }, { status: 500 });
  }
}

function aggregate(
  rows: { [key: string]: string }[],
  field: string
): { label: string; count: number }[] {
  const map: Record<string, number> = {};
  for (const row of rows) {
    const key = (row[field] ?? "unknown") || "unknown";
    map[key] = (map[key] ?? 0) + 1;
  }
  return Object.entries(map)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function buildDailySeries(
  rows: { created_at: string }[],
  days: number
): { date: string; count: number }[] {
  const map: Record<string, number> = {};
  // Pre-fill all days with 0
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    map[d.toISOString().slice(0, 10)] = 0;
  }
  for (const row of rows) {
    const day = row.created_at.slice(0, 10);
    if (map[day] !== undefined) map[day]++;
  }
  return Object.entries(map).map(([date, count]) => ({ date, count }));
}

function isValidToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf8");
    return decoded.startsWith("altdev:") && decoded.endsWith(":authenticated");
  } catch {
    return false;
  }
}
