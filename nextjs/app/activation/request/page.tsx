import Link from "next/link";
import { Key, Mail, Chrome, ExternalLink } from "lucide-react";

export default function FindKeyPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Key size={52} className="text-brand-500 dark:text-brand-300" />
          </div>
          <h1 className="text-3xl font-extrabold text-brand-700 dark:text-brand-200 mb-2">
            Find Your License Key
          </h1>
          <p className="text-brand-500 dark:text-brand-400 text-sm">
            Your HoverQR Pro license key was delivered automatically after purchase.
          </p>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-4 mb-8">
          {/* Step 1 */}
          <div className="bg-white dark:bg-brand-950 border border-[#dde2ff] dark:border-[#312e81] rounded-2xl p-6 flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-brand-gradient rounded-full flex items-center justify-center text-white font-bold text-sm">
              1
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Mail size={16} className="text-brand-500 dark:text-brand-300" />
                <p className="font-semibold text-brand-700 dark:text-brand-200 text-sm">
                  Check your purchase email
                </p>
              </div>
              <p className="text-xs text-brand-500 dark:text-brand-400">
                DodoPayments sends your license key immediately after payment.
                Search your inbox for <strong className="text-brand-600 dark:text-brand-300">HoverQR</strong> or{" "}
                <strong className="text-brand-600 dark:text-brand-300">DodoPayments</strong>.
                Also check your spam / junk folder.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white dark:bg-brand-950 border border-[#dde2ff] dark:border-[#312e81] rounded-2xl p-6 flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-brand-gradient rounded-full flex items-center justify-center text-white font-bold text-sm">
              2
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Chrome size={16} className="text-brand-500 dark:text-brand-300" />
                <p className="font-semibold text-brand-700 dark:text-brand-200 text-sm">
                  Enter the key in the extension
                </p>
              </div>
              <p className="text-xs text-brand-500 dark:text-brand-400">
                Click the HoverQR icon in Chrome toolbar → open the sidebar →
                scroll to <strong className="text-brand-600 dark:text-brand-300">Subscription</strong> →
                click <strong className="text-brand-600 dark:text-brand-300">I already have a key</strong> →
                paste your key and click <strong className="text-brand-600 dark:text-brand-300">Activate</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Still can't find it */}
        <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl p-5 text-center mb-8">
          <p className="text-sm font-semibold text-brand-600 dark:text-brand-300 mb-1">
            Still can&apos;t find your key?
          </p>
          <p className="text-xs text-brand-500 dark:text-brand-400 mb-3">
            Log into your DodoPayments customer portal to view your purchase and retrieve your license key.
          </p>
          <a
            href="https://app.dodopayments.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-300 hover:underline"
          >
            Open DodoPayments Portal <ExternalLink size={11} />
          </a>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-6">
          <Link
            href="/pricing"
            className="bg-brand-gradient text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity text-sm"
          >
            Buy HoverQR Pro →
          </Link>
          <Link
            href="/"
            className="text-xs text-brand-400/60 hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
          >
            ← Home
          </Link>
        </div>
      </div>
    </main>
  );
}
