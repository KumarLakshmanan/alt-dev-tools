import { Rocket, Check, X } from "lucide-react";

const FREE_FEATURES = [
  "Decode QR codes from any image",
  "Decode barcodes (EAN, UPC, Code128, PDF417…)",
  "Generate QR codes",
  "Hover link → instant QR tooltip",
  "Text selection → QR button",
  "Snap any area to decode QR",
  "Right-click context menu actions",
];

const PRO_EXTRA_FEATURES = [
  "QR & barcode scan history (up to 200 items)",
  "Save generated QR codes to history",
  "Quick-access history panel in sidebar",
  "Priority support",
];

export default function PricingPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="py-16 px-4 text-center">
        <h1 className="text-4xl font-extrabold text-brand-700 dark:text-brand-200 mb-3">
          Simple Pricing
        </h1>
        <p className="text-brand-500 dark:text-brand-400 text-lg">
          One payment. Lifetime access. No subscriptions.
        </p>
      </section>

      {/* Plans */}
      <section className="pb-16 px-4">
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <div className="rounded-2xl p-8 border flex flex-col border-[#dde2ff] dark:border-[#312e81] bg-white dark:bg-brand-950/40">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-brand-700 dark:text-brand-200 mb-1">Free</h2>
              <p className="text-sm text-brand-500 dark:text-brand-400 mb-4">Great for everyday use</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-brand-800 dark:text-brand-100">$0</span>
                <span className="text-brand-500 dark:text-brand-400 text-sm">forever</span>
              </div>
            </div>

            <ul className="flex flex-col gap-3 mb-8 flex-1">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 dark:text-green-400 mt-0.5">
                    <Check size={14} />
                  </span>
                  <span className="text-brand-700 dark:text-brand-200">{f}</span>
                </li>
              ))}
              {PRO_EXTRA_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <span className="text-[#9ca3af] dark:text-[#374151] mt-0.5">
                    <X size={14} />
                  </span>
                  <span className="text-[#9ca3af] dark:text-[#6b7280] line-through">{f}</span>
                </li>
              ))}
            </ul>

            <a
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center border border-brand-400 dark:border-brand-600 text-brand-600 dark:text-brand-300 font-semibold py-3 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-950 transition-colors"
            >
              Add to Chrome
            </a>
          </div>

          {/* Pro Plan */}
          <div className="rounded-2xl p-8 border flex flex-col border-brand-500 bg-brand-50 dark:bg-brand-950 shadow-xl shadow-brand-300/30 dark:shadow-brand-900/50 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-brand-gradient" />
            <span className="absolute top-4 right-4 text-xs font-bold bg-brand-gradient text-white px-3 py-1 rounded-full">
              POPULAR
            </span>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-brand-700 dark:text-brand-200 mb-1">Pro</h2>
              <p className="text-sm text-brand-500 dark:text-brand-400 mb-4">
                One payment, lifetime access
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-brand-800 dark:text-brand-100">$9</span>
                <span className="text-brand-500 dark:text-brand-400 text-sm">one-time</span>
              </div>
            </div>

            <ul className="flex flex-col gap-3 mb-8 flex-1">
              {/* All free features */}
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 dark:text-green-400 mt-0.5">
                    <Check size={14} />
                  </span>
                  <span className="text-brand-700 dark:text-brand-200">{f}</span>
                </li>
              ))}
              {/* Divider */}
              <li className="border-t border-brand-200 dark:border-brand-700 my-1" />
              {/* Pro extras */}
              {PRO_EXTRA_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 dark:text-green-400 mt-0.5">
                    <Check size={14} />
                  </span>
                  <span className="font-medium text-brand-700 dark:text-brand-200">{f}</span>
                </li>
              ))}
            </ul>

            <div>
              <a
                href="/api/payments/checkout"
                className="flex items-center justify-center gap-2 w-full bg-brand-gradient text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity"
              >
                <Rocket size={16} />
                Get Pro Now — $9
              </a>
              <p className="text-xs text-brand-400/60 text-center mt-2">
                Secure payment via DodoPayments · License key emailed instantly
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mt-16">
          <h3 className="text-xl font-bold text-brand-700 dark:text-brand-200 mb-6 text-center">
            FAQ
          </h3>
          {[
            {
              q: "How do I activate after payment?",
              a: "After payment, your license key is shown on this page and emailed to you. Open the HoverQR sidebar in Chrome, scroll to Subscription, click 'I already have a key', paste your key and click Activate.",
            },
            {
              q: "Is it really a one-time payment?",
              a: "Yes! Pay $9 once and use HoverQR Pro forever. No subscriptions, no renewals.",
            },
            {
              q: "Can I use one key on multiple devices?",
              a: "Yes, your license key works across all your Chrome browsers and devices.",
            },
            {
              q: "I lost my key — how do I find it?",
              a: "Check your purchase confirmation email from DodoPayments, or visit your DodoPayments customer portal to retrieve it.",
            },
            {
              q: "What payment methods are accepted?",
              a: "DodoPayments accepts all major credit and debit cards. Payment is processed securely.",
            },
          ].map((faq) => (
            <div
              key={faq.q}
              className="border-b border-[#dde2ff] dark:border-[#312e81] py-5"
            >
              <p className="font-semibold text-brand-700 dark:text-brand-200 mb-2">{faq.q}</p>
              <p className="text-sm text-brand-500 dark:text-brand-400">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
