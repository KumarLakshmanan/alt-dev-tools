import Link from "next/link";
import { QrCode, ExternalLink } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-[#dde2ff] dark:border-[#312e81] py-10 px-4 mt-auto bg-white dark:bg-transparent transition-colors">
      <div className="max-w-5xl mx-auto">
        {/* Top row: brand + nav */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-8 mb-8">
          {/* Brand */}
          <div className="flex flex-col items-center sm:items-start gap-2">
            <div className="flex items-center gap-2">
              <QrCode size={20} className="text-brand-500 dark:text-brand-300" />
              <span className="font-bold text-brand-600 dark:text-brand-300 text-base">HoverQR</span>
            </div>
            <p className="text-xs text-brand-400 dark:text-brand-400/70 max-w-[200px] text-center sm:text-left leading-relaxed">
              Instant QR codes on hover — generate &amp; scan without leaving the page.
            </p>
          </div>

          {/* Nav groups */}
          <div className="flex flex-wrap justify-center sm:justify-end gap-10 text-sm">
            {/* Product */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-400 dark:text-brand-400/60">
                Product
              </span>
              <Link
                href="/"
                className="text-brand-500 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/pricing"
                className="text-brand-500 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 transition-colors"
              >
                Pricing
              </Link>
              <a
                href="https://chrome.google.com/webstore"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-brand-500 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 transition-colors"
              >
                Chrome Store <ExternalLink size={11} />
              </a>
            </div>

            {/* Account */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-400 dark:text-brand-400/60">
                Account
              </span>
              <Link
                href="/activation/request"
                className="text-brand-500 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 transition-colors"
              >
                Get License Key
              </Link>
              <Link
                href="/activation/verify"
                className="text-brand-500 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 transition-colors"
              >
                Verify Key
              </Link>
            </div>

            {/* Legal & Support */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-400 dark:text-brand-400/60">
                Support
              </span>
              <Link
                href="/feedback"
                className="text-brand-500 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 transition-colors"
              >
                Feedback
              </Link>
              <Link
                href="/privacy"
                className="text-brand-500 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 transition-colors"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#dde2ff] dark:border-[#312e81] pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-brand-400/60 dark:text-brand-400/40">
          <span>© {year} HoverQR. All rights reserved.</span>
          <span>Built with ♥ for developers</span>
        </div>
      </div>
    </footer>
  );
}
