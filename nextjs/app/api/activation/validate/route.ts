import { NextRequest, NextResponse } from "next/server";
import { createDodoClient } from "@/lib/dodo";

const CORS_HEADERS = {
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
};

/**
 * Hard-coded review key for Chrome Web Store review process.
 * Always returns valid so reviewers can test Pro features.
 */
const REVIEW_LICENSE_KEY = "ALTDEV-REVIEW-2025-CHROME-STORE";

/**
 * GET /api/activation/validate?key=<license_key>
 * POST /api/activation/validate  { "key": "<license_key>" }
 *
 * Validates a license key against the Dodo Payments backend.
 * 100% relies on Dodo — no database or secrets needed on our side.
 */
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") ?? "";
  return validateKey(key);
}

export async function POST(req: NextRequest) {
  let key = "";
  try {
    const body = await req.json();
    key = (body?.key ?? body?.license_key ?? "").toString().trim();
  } catch {
    return NextResponse.json(
      { valid: false, message: "Invalid request body." },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  if (!key) {
    return NextResponse.json(
      { valid: false, message: "License key is required." },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  return validateKey(key);
}

async function validateKey(key: string) {
  if (!key) {
    return NextResponse.json(
      { valid: false, message: "License key is required." },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // Hard-coded review key — always valid (for Chrome Web Store reviewers)
  if (key.trim() === REVIEW_LICENSE_KEY) {
    return NextResponse.json(
      { valid: true, tier: "pro", message: "License key is valid." },
      { status: 200, headers: CORS_HEADERS }
    );
  }

  try {
    const client = createDodoClient();
    const result = await client.licenses.validate({ license_key: key });
    const valid = result.valid === true;
    return NextResponse.json(
      {
        valid,
        tier: valid ? "pro" : null,
        message: valid ? "License key is valid." : "Invalid or unrecognised license key.",
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error("Dodo license validation error:", err);
    return NextResponse.json(
      { valid: false, message: "Could not verify license key. Please try again." },
      { status: 502, headers: CORS_HEADERS }
    );
  }
}
