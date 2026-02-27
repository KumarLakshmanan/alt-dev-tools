import Link from "next/link";
import {
  MousePointer, Camera, Scissors, Package,
  Key, Settings2, QrCode, Sparkles,
  Download, ShoppingCart,
} from "lucide-react";

const features = [
  {
    icon: <MousePointer size={28} className="text-brand-500 dark:text-brand-300" />,
    title: "Hover Link → QR",
    desc: "Hover over any link to instantly preview its QR code as a tooltip. No clicking needed.",
    pro: true,
  },
  {
    icon: <Camera size={28} className="text-brand-500 dark:text-brand-300" />,
    title: "Click to Decode",
    desc: "Click any QR code or barcode image on a page — decoded text is inserted into your active field.",
    pro: false,
  },
  {
    icon: <Scissors size={28} className="text-brand-500 dark:text-brand-300" />,
    title: "Selection → QR",
    desc: "Select text on any page. A floating button appears to turn it into a QR code instantly.",
    pro: true,
  },
  {
    icon: <Package size={28} className="text-brand-500 dark:text-brand-300" />,
    title: "Barcode Support",
    desc: "Supports EAN-13, UPC-A, Code128, QR codes, Data Matrix and more.",
    pro: false,
  },
  {
    icon: <Key size={28} className="text-brand-500 dark:text-brand-300" />,
    title: "Activation Keys",
    desc: "Simple key-based pro activation — no account required. Buy once, activate anywhere.",
    pro: true,
  },
  {
    icon: <Settings2 size={28} className="text-brand-500 dark:text-brand-300" />,
    title: "Smart Options",
    desc: "Customize hover delay, decode behaviour and more from the options page.",
    pro: false,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="py-24 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient opacity-20 dark:opacity-40 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="flex justify-center mb-6"><QrCode size={64} className="text-brand-500 dark:text-brand-300" /></div>
          <h1 className="text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-purple-600 dark:from-brand-300 dark:to-purple-400">
            QR & Barcode Toolkit
            <br />
            for Chrome
          </h1>
          <p className="text-xl text-brand-600 dark:text-brand-300 mb-8 leading-relaxed">
            Hover links to instantly see QR codes. Click images to decode. Select text to share.
            The fastest QR workflow in your browser.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-brand-gradient text-white font-bold px-8 py-4 rounded-xl text-lg hover:opacity-90 transition-opacity shadow-lg shadow-brand-900/30 dark:shadow-brand-900/50"
            >
              Add to Chrome — Free
            </a>
            <Link
              href="/pricing"
              className="border border-brand-400 dark:border-brand-500 text-brand-600 dark:text-brand-300 font-semibold px-8 py-4 rounded-xl text-lg hover:bg-brand-50 dark:hover:bg-brand-950 transition-colors inline-flex items-center gap-2"
            >
              <Sparkles size={18} /> See Pro Features
            </Link>
          </div>
          <p className="mt-4 text-sm text-brand-500 dark:text-brand-400 opacity-70">
            Free to install • No account required • Pro via activation key
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-brand-700 dark:text-brand-200 mb-12">
            Everything you need
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white dark:bg-brand-950 border border-[#dde2ff] dark:border-[#312e81] rounded-2xl p-6 hover:border-brand-400 dark:hover:border-brand-500 transition-colors relative"
              >
                {f.pro && (
                  <span className="absolute top-4 right-4 text-xs font-bold bg-brand-gradient text-white px-2 py-0.5 rounded-full">
                    PRO
                  </span>
                )}
                <div className="mb-3">{f.icon}</div>
                <h3 className="font-bold text-brand-700 dark:text-brand-200 mb-2">{f.title}</h3>
                <p className="text-sm text-brand-500 dark:text-brand-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-brand-50 dark:bg-brand-950/40">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-brand-700 dark:text-brand-200 mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", icon: <Download size={28} className="text-brand-500 dark:text-brand-300" />, title: "Install", desc: "Add HoverQR to Chrome. Free, instant, no signup." },
              { step: "2", icon: <ShoppingCart size={28} className="text-brand-500 dark:text-brand-300" />, title: "Upgrade (optional)", desc: "Click Get Pro, pay once. Activation key is emailed to you." },
              { step: "3", icon: <Key size={28} className="text-brand-500 dark:text-brand-300" />, title: "Activate", desc: "Enter your email + key in the extension sidebar. All Pro features unlock instantly." },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center">
                <div className="w-12 h-12 bg-brand-gradient rounded-full flex items-center justify-center text-white font-bold text-lg mb-4">
                  {s.step}
                </div>
                <div className="mb-2">{s.icon}</div>
                <h3 className="font-bold text-brand-700 dark:text-brand-200 mb-2">{s.title}</h3>
                <p className="text-sm text-brand-500 dark:text-brand-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold text-brand-700 dark:text-brand-200 mb-4">Ready to get started?</h2>
          <p className="text-brand-500 dark:text-brand-400 mb-8">Free forever for basic features. Pro unlocks the magic.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-brand-gradient text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition-opacity"
            >
              Add to Chrome
            </a>
            <Link
              href="/pricing"
              className="border border-brand-400 dark:border-brand-500 text-brand-600 dark:text-brand-300 font-semibold px-8 py-4 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-950 transition-colors"
            >
              View Pricing →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
