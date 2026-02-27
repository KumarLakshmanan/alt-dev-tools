import Link from "next/link";
import { Key, ShoppingCart, Mail, Code2, CheckCircle, ArrowRight, Zap } from "lucide-react";

export const metadata = {
  title: "How to Get Your Licence Key — ALT-DEV TOOLS",
  description:
    "Step-by-step guide to purchase and activate your ALT-DEV TOOLS Pro licence key.",
};

const STEPS = [
  {
    icon: ShoppingCart,
    label: "Purchase Pro",
    description:
      "Visit the pricing page and click \"Get Pro\". You'll be taken to a secure Dodo Payments checkout.",
    action: { label: "Go to Pricing →", href: "/pricing" },
  },
  {
    icon: Mail,
    label: "Check Your Email",
    description:
      "After a successful payment, Dodo Payments automatically sends your unique licence key to the email address you used at checkout. Check your inbox and spam folder.",
    action: null,
  },
  {
    icon: Code2,
    label: "Open the Extension",
    description:
      "In Chrome, click the ALT-DEV TOOLS icon in the toolbar (or open via the Extensions menu) to open the side panel.",
    action: null,
  },
  {
    icon: Key,
    label: "Go to the License Tab",
    description:
      'Inside the side panel, click the key icon labelled "License" in the tab bar at the top.',
    action: null,
  },
  {
    icon: CheckCircle,
    label: "Paste & Activate",
    description:
      "Paste the licence key from your email into the input field and click Activate. Your Pro panels unlock instantly — no restart required.",
    action: null,
  },
];

const PRO_FEATURES = [
  "Sources viewer — browse page scripts",
  "Application panel — cookies, local storage, session storage",
  "Performance panel — real-time metrics & timing",
  "Device emulation — simulate mobile viewports",
];

export default function LicensePage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 px-4">
      <div className="max-w-2xl mx-auto">

        {/* ── Hero ── */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-400 mb-5">
            <Key size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 mb-3">
            How to Get Your Licence Key
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base max-w-lg mx-auto">
            Unlock the full power of ALT-DEV TOOLS Pro in three simple steps.
            No account required — your licence key is delivered instantly by email.
          </p>
        </div>

        {/* ── Steps ── */}
        <div className="space-y-4 mb-12">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={i}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex gap-4"
              >
                <div className="flex-shrink-0 flex flex-col items-center gap-1">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                    <Icon size={18} className="text-brand-500" />
                  </div>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-slate-100 mb-1 text-sm">
                    {step.label}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                  {step.action && (
                    <Link
                      href={step.action.href}
                      className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors"
                    >
                      {step.action.label}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Pro features list ── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-brand-500" />
            <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
              What you unlock with Pro
            </p>
          </div>
          <ul className="space-y-2">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                <CheckCircle size={14} className="text-brand-500 mt-0.5 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* ── CTAs ── */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-400 text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity text-sm"
          >
            <ShoppingCart size={16} /> Get Pro Now
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold px-5 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
          >
            Back to Home <ArrowRight size={14} />
          </Link>
        </div>

      </div>
    </main>
  );
}
