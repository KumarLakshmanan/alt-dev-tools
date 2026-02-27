import { NextRequest, NextResponse } from "next/server";
import DodoPayments from "dodopayments";

const PRO_FEATURES = [
  "hover_qr",
  "selection_qr",
  "context_menu_qr",
  "custom_qr_options",
  "qr_history",
];

/**
 * POST /api/activation/validate
 * Validates a DodoPayments license key.
 * The validate endpoint is public — no API key required.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const license_key: string = (body.license_key ?? body.key ?? "").trim();

    if (!license_key) {
      return NextResponse.json(
        { valid: false, message: "License key is required." },
        { status: 400 }
      );
    }

    // Use the DodoPayments public validate endpoint (no bearer token needed)
    const client = new DodoPayments({
      bearerToken: process.env.DODO_PAYMENTS_API_KEY ?? "",
      environment:
        (process.env.DODO_PAYMENTS_ENVIRONMENT as "test_mode" | "live_mode") ??
        "live_mode",
    });

    const result = await client.licenses.validate({ license_key });

    if (!result.valid) {
      return NextResponse.json({
        valid: false,
        message: "Invalid or inactive license key.",
      });
    }

    return NextResponse.json({
      valid: true,
      tier: "pro",
      features: PRO_FEATURES,
      expiresAt: null, // DodoPayments lifetime keys have no expiry
    });
  } catch (err) {
    console.error("License validate error:", err);
    return NextResponse.json(
      { valid: false, message: "Validation failed. Please try again." },
      { status: 400 }
    );
  }
}
