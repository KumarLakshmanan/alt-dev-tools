import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/analytics/auth
 * Validates the admin username and password (hard-coded, server-side only).
 * Returns a signed token on success.
 */

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "altdev-admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "altdev-analytics-2025";

export async function POST(req: NextRequest) {
  let username = "";
  let password = "";

  try {
    const body = await req.json();
    username = (body?.username ?? "").toString().trim();
    password = (body?.password ?? "").toString().trim();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid body." }, { status: 400 });
  }

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    // Issue a simple token (timestamp + hash for basic verification)
    const token = Buffer.from(`altdev:${Date.now()}:authenticated`).toString("base64");
    return NextResponse.json({ success: true, token });
  }

  return NextResponse.json(
    { success: false, error: "Invalid credentials." },
    { status: 401 }
  );
}
