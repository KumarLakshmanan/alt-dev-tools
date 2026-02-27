# DodoPayments — HoverQR Pro Setup Guide

This guide covers everything needed to go live with HoverQR Pro payments.

---

## 1. Create a DodoPayments Account

1. Go to [https://app.dodopayments.com](https://app.dodopayments.com)
2. Sign up and complete KYC / business verification

---

## 2. Create a Product with License Keys

### Navigation
**Dashboard → Products → Create Product**

### Settings

| Field | Value |
|-------|-------|
| **Product Name** | HoverQR Pro |
| **Type** | `One-time payment` |
| **Price** | `$9.00` USD |
| **License Keys** | ✅ Enable |
| **License Key Expiry** | `No expiry` (lifetime) |
| **Activation Limit** | `Unlimited` (or `5` for fair use) |
| **Activation Instructions** | Open the HoverQR sidebar → Subscription → "I already have a key" → Paste key → Activate |

> ⚠️ **You must enable License Keys** on the product for automatic key generation after payment.

### After Creating the Product

Copy the **Product ID** — it looks like `prd_XXXXXXXXXXXX`.

Update `.env.local`:

```env
DODO_PRODUCT_ID=prd_XXXXXXXXXXXX
```

---

## 3. Get Your API Key

### Navigation
**Dashboard → Developers → API Keys → Create Key**

| Field | Value |
|-------|-------|
| **Name** | HoverQR Production |
| **Environment** | `live_mode` |

Copy the key and update `.env.local`:

```env
DODO_PAYMENTS_API_KEY=your_api_key_here
DODO_PAYMENTS_ENVIRONMENT=live_mode
```

---

## 4. Complete `.env.local`

```env
# App
NEXT_PUBLIC_BASE_URL=https://hoverqr.codingfrontend.in

# DodoPayments
DODO_PAYMENTS_API_KEY=CbuVAZXhkqHsTZlC...   ← your key
DODO_PAYMENTS_ENVIRONMENT=live_mode
DODO_PRODUCT_ID=prd_XXXXXXXXXXXX             ← fill this in
```

---

## 5. How It Works (Full Flow)

```
User clicks "Get Pro Now" on /pricing
    ↓
GET /api/payments/checkout
    ↓
DodoPayments hosted checkout page
    ↓
User pays
    ↓
DodoPayments automatically generates license key
    ↓
Redirects to /payment/success?license_key=LK-xxx&email=user@example.com
    ↓
Success page shows key with copy button + activation steps
    ↓
User opens HoverQR extension → Subscription → "I already have a key"
    ↓
Paste key → Activate
    ↓
Extension calls POST /api/activation/validate with { license_key }
    ↓
Server calls DodoPayments validate API (public endpoint, no API key needed)
    ↓
DodoPayments returns { valid: true }
    ↓
Extension unlocks Pro features ✅
```

---

## 6. Verify Everything Works

After setting `DODO_PRODUCT_ID` and deploying:

- [ ] Visit `/pricing` — "Get Pro Now" button redirects to DodoPayments checkout
- [ ] Complete a test payment (use DodoPayments test mode: `DODO_PAYMENTS_ENVIRONMENT=test_mode`)
- [ ] Redirected to `/payment/success?license_key=...` — key displayed with copy button
- [ ] Paste key into extension → Pro features unlock
- [ ] Visit `/activation/request` — shows instructions on how to find the key

---

## 7. Troubleshooting

| Issue | Fix |
|-------|-----|
| Checkout returns 500 | `DODO_PRODUCT_ID` is empty or invalid |
| No license key in success URL | License Keys not enabled on the product in DodoPayments dashboard |
| Key validation returns `valid: false` | Wrong environment (`test_mode` vs `live_mode`) or key is disabled |
| Key not activating in extension | Extension `BASE_URL` in `api.ts` must match deployed URL |
