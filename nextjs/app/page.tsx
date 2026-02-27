import Link from "next/link";
import {
  Code2, Terminal, Activity, FolderCode,
  Database, Gauge, Smartphone, Key,
  Download, Sparkles, Check, Lock,
} from "lucide-react";

const FREE_PANELS = [
  {
    icon: <Code2 size={26} className="text-brand-400" />,
    title: "Elements",
    desc: "Inspect and live-edit the DOM. View CSS rules, computed styles, and the box model.",
    badge: null,
  },
  {
    icon: <Terminal size={26} className="text-brand-400" />,
    title: "Console",
    desc: "Full JavaScript console. Evaluate expressions, see logs, warnings, and errors.",
    badge: null,
  },
  {
    icon: <Activity size={26} className="text-brand-400" />,
    title: "Network",
    desc: "Monitor HTTP requests, inspect headers, bodies, cookies, and WebSocket frames.",
    badge: null,
  },
];

const PRO_PANELS = [
  {
    icon: <FolderCode size={26} className="text-amber-400" />,
    title: "Sources",
    desc: "Browse all page scripts and stylesheets. View and search source files inline.",
    badge: "PRO",
  },
  {
    icon: <Database size={26} className="text-amber-400" />,
    title: "Application",
    desc: "Manage localStorage, sessionStorage, and cookies with full read/write/delete support.",
    badge: "PRO",
  },
  {
    icon: <Gauge size={26} className="text-amber-400" />,
    title: "Performance",
    desc: "Load time, FCP, DOM timings, JS heap, resource waterfall, and live FPS meter.",
    badge: "PRO",
  },
  {
    icon: <Smartphone size={26} className="text-amber-400" />,
    title: "Device",
    desc: "Proper viewport emulation via Chrome's DevTools Protocol. Media queries respond correctly.",
    badge: "PRO",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">

      {/* ─── Hero ─── */}
      <section className="relative py-24 px-4 text-center overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(circle, #3b82f6 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-brand-600/5 via-transparent to-transparent" />

        <div className="relative max-w-4xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <span className="panel-pill">
              <Code2 size={13} /> Chrome Extension — DevTools Alternative
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-cyan-400 leading-tight">
            DevTools.<br />In Your Sidebar.
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-10 leading-relaxed max-w-2xl mx-auto">
            ALT-DEV TOOLS brings a full-featured DevTools panel directly into Chrome&apos;s side panel —
            Elements, Console, Network, Sources, Application, Performance & Device emulation,
            all without opening F12.
          </p>

          <div className="flex gap-4 justify-center flex-wrap mb-6">
            <a
              href="https://chromewebstore.google.com/detail/ALT-DEV TOOLS/eapladegjgjhlglmlolpgfmfpojjllef"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-brand-gradient text-white font-bold px-8 py-4 rounded-xl text-lg hover:opacity-90 transition-opacity shadow-lg shadow-brand-500/25"
            >
              <Download size={18} /> Add to Chrome — Free
            </a>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 border border-brand-300 dark:border-brand-700 text-brand-600 dark:text-brand-300 font-semibold px-8 py-4 rounded-xl text-lg hover:bg-brand-50 dark:hover:bg-brand-950/50 transition-colors"
            >
              <Sparkles size={18} /> Unlock Pro Panels
            </Link>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Free forever for core panels · Pro via one-time activation key
          </p>
        </div>
      </section>

      {/* ─── Free Panels ─── */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-3">Free Panels</h2>
            <p className="text-slate-500 dark:text-slate-400">Powerful out of the box. No account or payment needed.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FREE_PANELS.map((p) => (
              <div
                key={p.title}
                className="bg-white dark:bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 hover:border-brand-400 dark:hover:border-brand-600 transition-colors"
              >
                <div className="mb-3">{p.icon}</div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-2">{p.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pro Panels ─── */}
      <section className="py-16 px-4 bg-slate-50 dark:bg-[#0d1117]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1 text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1 rounded-full mb-4">
              <Lock size={11} /> PRO PANELS
            </span>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-3">Unlock the Full Suite</h2>
            <p className="text-slate-500 dark:text-slate-400">One activation key. All Pro panels. Forever.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRO_PANELS.map((p) => (
              <div
                key={p.title}
                className="relative bg-white dark:bg-[var(--card)] border border-amber-200 dark:border-amber-900/40 rounded-2xl p-6 hover:border-amber-400 dark:hover:border-amber-600 transition-colors"
              >
                <span className="absolute top-3 right-3 text-[10px] font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white px-2 py-0.5 rounded-full">
                  PRO
                </span>
                <div className="mb-3">{p.icon}</div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">{p.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-10">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold px-8 py-4 rounded-xl text-lg hover:opacity-90 transition-opacity shadow-lg shadow-amber-500/25"
            >
              <Key size={18} /> Get a License Key
            </Link>
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", icon: <Download size={26} className="text-brand-400" />, title: "Install", desc: "Add ALT-DEV TOOLS to Chrome. Free instantly — no account required." },
              { step: "2", icon: <Key size={26} className="text-brand-400" />, title: "Get Pro (optional)", desc: "Purchase a one-time license. An activation key is emailed to you." },
              { step: "3", icon: <Check size={26} className="text-brand-400" />, title: "Activate", desc: "Paste your key in the extension's License settings. All Pro panels unlock instantly." },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center">
                <div className="w-12 h-12 bg-brand-gradient rounded-full flex items-center justify-center text-white font-bold text-lg mb-4">
                  {s.step}
                </div>
                <div className="mb-2">{s.icon}</div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 px-4 text-center bg-slate-50 dark:bg-[#0d1117]">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">
            Ready to ditch F12?
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            Free forever for core features. Pro unlocks Sources, Application, Performance & Device emulation.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="https://chromewebstore.google.com/detail/ALT-DEV TOOLS/eapladegjgjhlglmlolpgfmfpojjllef"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-brand-gradient text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition-opacity"
            >
              <Download size={18} /> Add to Chrome
            </a>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold px-8 py-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              View Pricing →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

