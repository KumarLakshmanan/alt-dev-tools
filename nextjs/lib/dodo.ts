import DodoPayments from "dodopayments";

export const DODO_PRODUCT_ID = process.env.DODO_PRODUCT_ID ?? "";

export function createDodoClient() {
  return new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY ?? "",
    environment:
      (process.env.DODO_PAYMENTS_ENVIRONMENT as "test_mode" | "live_mode") ??
      "live_mode",
  });
}
