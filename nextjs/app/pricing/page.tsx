import { Rocket, Check, Lock } from "lucide-react";

const FREE_FEATURES = [
  "Elements panel — DOM inspector & live CSS editor",
  "Console panel — full JS eval, log levels, history",
  "Network panel — HTTP requests, headers, WebSockets",
  "Tab switching, dark theme, responsive panel layout",
  "Free forever, no account required",
];

const PRO_EXTRA_FEATURES = [
  "Sources panel — browse all page scripts & stylesheets",
  "Application panel — localStorage, sessionStorage, cookies",
  "Performance panel — load time, FCP, JS heap, FPS meter",
  "Device panel — CDP viewport emulation (media queries work)",
  "Priority support",
];

export default function PricingPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="py-16 px-4 text-center">
        <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 mb-3">
          Simple Pricing
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          One payment. Lifetime access. No subscriptions.
        </p>
      </section>

      {/* Plans */}
      <section className="pb-16 px-4">
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <div className="rounded-2xl p-8 border flex flex-col border-[var(--border)] bg-white dark:bg-[var(--card)]">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">Free</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Great for everyday debugging</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-slate-800 dark:text-slate-100">$0</span>
                <span className="text-slate-500 dark:text-slate-400 text-sm">forever</span>
              </div>
            </div>

            <ul className="flex flex-col gap-3 mb-8 flex-1">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0"><Check size={14} /></span>
                  <span className="text-slate-700 dark:text-slate-300">{f}</span>
                </li>
              ))}
              {PRO_EXTRA_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm opacity-40">
                  <span className="mt-0.5 flex-shrink-0"><Lock size={13} /></span>
                  <span className="text-slate-500 dark:text-slate-400 line-through">{f}</span>
                </li>
              ))}
            </ul>

            <a
              href="https://chromewebstore.google.com/detail/ALT-DEV TOOLS/eapladegjgjhlglmlolpgfmfpojjllef"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center border border-brand-400 dark:border-brand-600 text-brand-600 dark:text-brand-300 font-semibold py-3 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors"
            >
              Add to Chrome
            </a>
          </div>

          {/* Pro Plan */}
          <div className="rounded-2xl p-8 border flex flex-col border-brand-400 dark:border-brand-600 bg-brand-50 dark:bg-brand-950/20 shadow-xl shadow-brand-300/20 dark:shadow-brand-900/40 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-brand-gradient" />
            <span className="absolute top-4 right-4 text-xs font-bold bg-brand-gradient text-white px-3 py-1 rounded-full">
              POPULAR
            </span>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">Pro</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">One payment, lifetime access</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-slate-800 dark:text-slate-100">$9</span>
                <span className="text-slate-500 dark:text-slate-400 text-sm">one-time</span>
              </div>
            </div>

            <ul className="flex flex-col gap-3 mb-8 flex-1">
              {/* All free features */}
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0"><Check size={14} /></span>
                  <span className="text-slate-700 dark:text-slate-300">{f}</span>
                </li>
              ))}
              {/* Divider */}
              <li className="border-t border-brand-200 dark:border-brand-800 my-1" />
              {/* Pro extras */}
              {PRO_EXTRA_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0"><Check size={14} /></span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">{f}</span>
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
              <p className="text-xs text-slate-400 text-center mt-2">
                Secure payment · License key emailed instantly
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mt-16">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 text-center">FAQ</h3>
          {[
            {
              q: "How do I activate after payment?",
              a: "After payment, your license key is emailed to you. Open ALT-DEV TOOLS in Chrome, go to the License tab, enter your email + key, and click Activate. All Pro panels unlock instantly.",
            },
            {
              q: "Is it really a one-time payment?",
              a: "Yes! Pay $9 once and use ALT-DEV TOOLS Pro forever. No subscriptions, no renewals.",
            },
            {
              q: "Can I use one key on multiple devices?",
              a: "Yes, your license key works across all your Chrome browsers and devices.",
            },
            {
              q: "I lost my key — how do I find it?",
              a: "Check your purchase confirmation email, or visit the payment portal to retrieve your license key.",
            },
            {
              q: "Which panels are locked behind Pro?",
              a: "Sources, Application (localStorage/cookies), Performance, and Device emulation panels require a Pro license. Elements, Console, and Network are always free.",
            },
          ].map((faq) => (
            <div key={faq.q} className="border-b border-[var(--border)] py-5">
              <p className="font-semibold text-slate-700 dark:text-slate-200 mb-2">{faq.q}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

