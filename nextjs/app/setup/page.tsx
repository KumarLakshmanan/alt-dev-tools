import Link from "next/link";
import {
  Code2,
  Terminal,
  Network,
  Database,
  Cpu,
  Smartphone,
  FileCode2,
  Key,
  ChevronRight,
  Download,
} from "lucide-react";

export const metadata = {
  title: "Welcome to ALT-DEV TOOLS",
  description:
    "You've successfully installed ALT-DEV TOOLS — a full-featured DevTools panel in Chrome's sidebar.",
};

const STEPS = [
  {
    step: "01",
    title: "Open any website",
    desc: "Navigate to any page you want to inspect.",
  },
  {
    step: "02",
    title: "Click the extension icon",
    desc: 'Click the ALT-DEV TOOLS icon in the Chrome toolbar — or press the puzzle-piece icon → pin it → click it.',
  },
  {
    step: "03",
    title: "Start debugging",
    desc: "The sidebar opens with all panels ready. Switch tabs to inspect elements, monitor network, view console output and more.",
  },
];

const PANELS = [
  {
    icon: Code2,
    label: "Elements",
    desc: "Inspect and edit the DOM tree in real time.",
    tier: "free",
  },
  {
    icon: Terminal,
    label: "Console",
    desc: "Run JavaScript and view logs, errors & warnings.",
    tier: "free",
  },
  {
    icon: Network,
    label: "Network",
    desc: "Monitor HTTP requests, responses and timing.",
    tier: "free",
  },
  {
    icon: FileCode2,
    label: "Sources",
    desc: "Browse loaded scripts and page resources.",
    tier: "pro",
  },
  {
    icon: Database,
    label: "Application",
    desc: "Inspect cookies, localStorage & sessionStorage.",
    tier: "pro",
  },
  {
    icon: Cpu,
    label: "Performance",
    desc: "Real-time CPU, memory & rendering metrics.",
    tier: "pro",
  },
  {
    icon: Smartphone,
    label: "Device",
    desc: "Simulate mobile viewports and user agents.",
    tier: "pro",
  },
];

export default function SetupPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 px-4">
      <div className="max-w-2xl mx-auto">

        {/* ── Hero ── */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-500 to-cyan-400 mb-6 shadow-xl shadow-brand-500/30">
            <Code2 size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 mb-3">
            Welcome to ALT-DEV TOOLS!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base max-w-lg mx-auto leading-relaxed">
            You&apos;re all set. A full-featured DevTools panel now lives in Chrome&apos;s
            sidebar — no more switching between F12 and your content.
          </p>
        </div>

        {/* ── Getting Started ── */}
        <section className="mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
            Getting Started
          </h2>
          <div className="space-y-3">
            {STEPS.map((s) => (
              <div
                key={s.step}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex gap-4 items-start"
              >
                <span className="flex-shrink-0 w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-xs font-extrabold text-brand-500">
                  {s.step}
                </span>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100 mb-0.5 text-sm">
                    {s.title}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Panels ── */}
        <section className="mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
            Available Panels
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PANELS.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.label}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex gap-3 items-start"
                >
                  <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-brand-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                        {p.label}
                      </p>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                          p.tier === "pro"
                            ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
                            : "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"
                        }`}
                      >
                        {p.tier === "pro" ? "Pro" : "Free"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {p.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Pro CTA ── */}
        <section className="bg-gradient-to-br from-brand-500/10 to-cyan-400/10 border border-brand-200 dark:border-brand-800 rounded-2xl p-7 mb-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/40 mb-4">
            <Key size={22} className="text-brand-500" />
          </div>
          <h3 className="font-extrabold text-slate-800 dark:text-slate-100 mb-2 text-lg">
            Unlock Pro Features
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-5 max-w-sm mx-auto">
            Get Sources, Application, Performance & Device panels with an
            ALT-DEV TOOLS Pro license. One-time purchase, no subscription.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-400 text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity text-sm"
            >
              View Pricing <ChevronRight size={15} />
            </Link>
            <Link
              href="/license"
              className="inline-flex items-center gap-2 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold px-5 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
            >
              <Key size={14} /> I have a key
            </Link>
          </div>
        </section>

        {/* ── Footer links ── */}
        <div className="flex flex-wrap gap-4 justify-center text-xs text-slate-400">
          <a
            href="https://chromewebstore.google.com/detail/ALT-DEV TOOLS/eapladegjgjhlglmlolpgfmfpojjllef"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-brand-500 transition-colors"
          >
            <Download size={11} /> Chrome Web Store
          </a>
          <span>·</span>
          <Link href="/privacy" className="hover:text-brand-500 transition-colors">
            Privacy Policy
          </Link>
          <span>·</span>
          <a
            href="mailto:support@altdevtools.codingfrontend.in"
            className="hover:text-brand-500 transition-colors"
          >
            Support
          </a>
        </div>

      </div>
    </main>
  );
}
