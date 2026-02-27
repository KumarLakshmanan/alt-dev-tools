import Link from "next/link";
import { Code2, ExternalLink } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-[var(--border)] py-10 px-4 mt-auto bg-white dark:bg-transparent transition-colors">
      <div className="max-w-5xl mx-auto">
        {/* Top row: brand + nav */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-8 mb-8">
          {/* Brand */}
          <div className="flex flex-col items-center sm:items-start gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-brand-gradient flex items-center justify-center">
                <Code2 size={13} className="text-white" />
              </div>
              <span className="font-bold text-slate-700 dark:text-slate-200 text-base">
                ALT-DEV <span className="text-brand-500">TOOLS</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px] text-center sm:text-left leading-relaxed">
              Full-featured DevTools in your Chrome sidebar. No more F12.
            </p>
          </div>

          {/* Nav groups */}
          <div className="flex flex-wrap justify-center sm:justify-end gap-10 text-sm">
            {/* Product */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Product
              </span>
              <Link href="/" className="text-slate-500 dark:text-slate-400 hover:text-brand-500 dark:hover:text-brand-300 transition-colors">
                Home
              </Link>
              <Link href="/pricing" className="text-slate-500 dark:text-slate-400 hover:text-brand-500 dark:hover:text-brand-300 transition-colors">
                Pricing
              </Link>
              <a
                href="https://chromewebstore.google.com/detail/ALT-DEV TOOLS/eapladegjgjhlglmlolpgfmfpojjllef"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-brand-500 dark:hover:text-brand-300 transition-colors"
              >
                Chrome Store <ExternalLink size={11} />
              </a>
            </div>

            {/* License */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                License
              </span>
              <Link href="/pricing" className="text-slate-500 dark:text-slate-400 hover:text-brand-500 dark:hover:text-brand-300 transition-colors">
                Get Pro
              </Link>
              <Link href="/activation/verify" className="text-slate-500 dark:text-slate-400 hover:text-brand-500 dark:hover:text-brand-300 transition-colors">
                Verify Key
              </Link>
            </div>

            {/* Support */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Support
              </span>
              <Link href="/feedback" className="text-slate-500 dark:text-slate-400 hover:text-brand-500 dark:hover:text-brand-300 transition-colors">
                Feedback
              </Link>
              <Link href="/privacy" className="text-slate-500 dark:text-slate-400 hover:text-brand-500 dark:hover:text-brand-300 transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[var(--border)] pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 dark:text-slate-500">
          <span>© {year} ALT-DEV TOOLS. All rights reserved.</span>
          <span>Built with ♥ for developers</span>
        </div>
      </div>
    </footer>
  );
}

