# HoverQR — Next.js Backend & Landing Page

Full-stack backend for the HoverQR Chrome extension. Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase**, and **Stripe**.

---

## Features

- 🌐 Landing page & pricing
- 💳 Stripe Checkout (one-time payment) → generates activation key → emails it
- 🔑 Activation key retrieval via email OTP
- 🔒 Server-side key validation endpoint for the Chrome extension
- 📧 SendGrid email delivery

---

## Quick Start

### 1. Install dependencies

```bash
cd nextjs
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Fill in all values in .env.local
```

| Variable | Where to get it |
|---|---|
| `SUPABASE_URL` | Supabase Dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks (after adding endpoint) |
| `STRIPE_PRICE_ID` | Stripe Dashboard → Products → create a one-time price |
| `SENDGRID_API_KEY` | SendGrid Dashboard → API Keys |

### 3. Run Supabase migration

```bash
# Option A: paste supabase/migrations/001_init.sql into Supabase SQL Editor
# Option B: using Supabase CLI
npx supabase db push
```

### 4. Configure Stripe Webhook

In the Stripe Dashboard, add a webhook endpoint pointing to:

```
https://your-domain.com/api/payments/webhook
```

Events to listen for:
- `checkout.session.completed`

Copy the **Signing Secret** into `STRIPE_WEBHOOK_SECRET`.

For local testing with Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

### 5. Run locally

```bash
npm run dev
# → http://localhost:3000
```

### 6. Deploy

Deploy to **Vercel** (recommended):

```bash
npx vercel --prod
```

Set all `.env.local` variables in the Vercel project settings.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/payments/checkout` | Creates Stripe Checkout session |
| `POST` | `/api/payments/webhook` | Stripe webhook receiver |
| `POST` | `/api/activation/request` | Sends OTP to email |
| `POST` | `/api/activation/verify` | Verifies OTP, returns keys |
| `POST` | `/api/activation/validate` | Validates key+email (used by extension) |

---

## Database Schema

### `activation_keys`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `email` | TEXT | purchaser email |
| `key` | TEXT | unique activation key (XXXX-XXXX-XXXX-XXXX) |
| `tier` | TEXT | `"pro"` |
| `stripe_payment_intent_id` | TEXT | for idempotency |
| `is_active` | BOOLEAN | |
| `created_at` | TIMESTAMPTZ | |
| `expires_at` | TIMESTAMPTZ | NULL = lifetime |

### `email_otps`
| Column | Type | Notes |
|---|---|---|
| `email` | TEXT | PK (one OTP per email) |
| `otp` | TEXT | 6-digit code |
| `expires_at` | TIMESTAMPTZ | 10 minutes from creation |

---

## Project Structure

```
nextjs/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Landing page
│   ├── pricing/page.tsx     # Pricing page (with Stripe checkout)
│   ├── activation/
│   │   ├── request/page.tsx # Enter email to get OTP
│   │   └── verify/page.tsx  # Enter OTP to see activation key
│   ├── payment/
│   │   ├── success/page.tsx # Post-payment success
│   │   └── cancel/page.tsx  # Post-payment cancel
│   └── api/
│       ├── payments/
│       │   ├── checkout/route.ts  # Create Stripe session
│       │   └── webhook/route.ts   # Stripe webhook
│       └── activation/
│           ├── request/route.ts   # Send OTP
│           ├── verify/route.ts    # Verify OTP
│           └── validate/route.ts  # Validate key (called by extension)
├── lib/
│   ├── supabaseClient.ts    # Supabase client + DB helpers
│   ├── stripe.ts            # Stripe client
│   ├── mail.ts              # SendGrid email helpers
│   └── keys.ts              # Key & OTP generation
├── supabase/
│   └── migrations/001_init.sql
└── .env.example
```
