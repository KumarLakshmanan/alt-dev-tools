import { NextRequest, NextResponse } from "next/server";
import { createDodoClient, DODO_PRODUCT_ID } from "@/lib/dodo";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://altdevtools.codingfrontend.in";

/**
 * GET /api/payments/checkout
 * Creates a DodoPayments checkout session.
 * After successful payment, Dodo Payments emails the license key directly to the buyer.
 * No key generation or database required — 100% handled by Dodo.
 */
export async function GET() {
  try {
    if (!DODO_PRODUCT_ID) {
      return NextResponse.json(
        { error: "Product not configured." },
        { status: 500 }
      );
    }

    const client = createDodoClient();

    const session = await client.checkoutSessions.create({
      product_cart: [{ product_id: DODO_PRODUCT_ID, quantity: 1 }],
      return_url: `${BASE_URL}/payment/success`,
    });

    const checkoutUrl =
      (session as unknown as Record<string, string>).url ??
      (session as unknown as Record<string, string>).checkout_url;

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "No checkout URL returned." },
        { status: 500 }
      );
    }

    return NextResponse.redirect(checkoutUrl);
  } catch (err) {
    console.error("Checkout error:", err);
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/payments/checkout
 * Returns JSON with checkout URL (for client-side redirect).
 */
export async function POST(_req: NextRequest) {
  try {
    if (!DODO_PRODUCT_ID) {
      return NextResponse.json(
        { error: "Product not configured." },
        { status: 500 }
      );
    }

    const client = createDodoClient();

    const session = await client.checkoutSessions.create({
      product_cart: [{ product_id: DODO_PRODUCT_ID, quantity: 1 }],
      return_url: `${BASE_URL}/payment/success`,
    });

    const checkoutUrl =
      (session as unknown as Record<string, string>).url ??
      (session as unknown as Record<string, string>).checkout_url;

    return NextResponse.json({ url: checkoutUrl });
  } catch (err) {
    console.error("Checkout error:", err);
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
