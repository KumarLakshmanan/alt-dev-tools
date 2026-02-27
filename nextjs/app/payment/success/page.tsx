"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { PartyPopper, Copy, CheckCircle, Chrome, ArrowRight } from "lucide-react";

function SuccessContent() {
  const params = useSearchParams();
  const licenseKey = params.get("license_key") ?? "";
  const email = params.get("email") ?? "";

  const [copied, setCopied] = useState(false);

  async function copyKey() {
    if (!licenseKey) return;
    await navigator.clipboard.writeText(licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="text-center max-w-md w-full">
      {/* Icon + heading */}
      <div className="flex justify-center mb-4">
        <PartyPopper size={64} className="text-brand-500 dark:text-brand-300" />
      </div>
      <h1 className="text-3xl font-extrabold text-brand-700 dark:text-brand-200 mb-3">
        Payment Successful!
      </h1>
      <p className="text-brand-500 dark:text-brand-400 mb-6 text-sm">
        {email ? (
          <>
            Your license key has been sent to{" "}
            <strong className="text-brand-600 dark:text-brand-300">{email}</strong>.
          </>
        ) : (
          "Your license key is ready to use."
        )}
      </p>

      {/* License key box */}
      {licenseKey ? (
        <div className="bg-white dark:bg-brand-950 border border-[#dde2ff] dark:border-[#312e81] rounded-2xl p-6 mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-400 dark:text-brand-400/60 mb-3">
            Your License Key
          </p>
          <div className="flex items-center gap-3 bg-brand-50 dark:bg-[#12104b] border border-brand-200 dark:border-brand-700 rounded-xl px-4 py-3">
            <code className="flex-1 text-brand-700 dark:text-brand-200 font-mono text-sm tracking-widest break-all">
              {licenseKey}
            </code>
            <button
              onClick={copyKey}
              className="flex-shrink-0 text-xs bg-brand-500 dark:bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-600 dark:hover:bg-brand-500 transition-colors"
            >
              {copied ? (
                <span className="flex items-center gap-1">
                  <CheckCircle size={12} /> Copied!
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Copy size={12} /> Copy
                </span>
              )}
            </button>
          </div>
          <p className="text-xs text-brand-400/60 mt-2">
            Save this key — you&apos;ll need it to activate the extension.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-brand-950 border border-[#dde2ff] dark:border-[#312e81] rounded-2xl p-5 mb-6 text-sm text-brand-500 dark:text-brand-400">
          Your license key has been emailed to you. Check your inbox and spam folder.
        </div>
      )}

      {/* Activation steps */}
      <div className="bg-white dark:bg-brand-950 border border-[#dde2ff] dark:border-[#312e81] rounded-2xl p-5 text-left mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Chrome size={16} className="text-brand-500 dark:text-brand-300" />
          <p className="text-sm font-semibold text-brand-600 dark:text-brand-300">
            Activate in Chrome:
          </p>
        </div>
        <ol className="text-sm text-brand-500 dark:text-brand-400 list-decimal list-inside space-y-1.5">
          <li>Click the HoverQR icon in your Chrome toolbar</li>
          <li>Scroll to <strong className="text-brand-600 dark:text-brand-200">Subscription</strong> section</li>
          <li>Click <strong className="text-brand-600 dark:text-brand-200">I already have a key</strong></li>
          <li>Paste your license key → click <strong className="text-brand-600 dark:text-brand-200">Activate</strong></li>
        </ol>
      </div>

      {/* CTAs */}
      <div className="flex flex-wrap gap-3 justify-center">
        <a
          href="https://chrome.google.com/webstore"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-brand-gradient text-white font-bold px-5 py-3 rounded-xl hover:opacity-90 transition-opacity text-sm"
        >
          <Chrome size={16} /> Open Chrome Extension
        </a>
        <Link
          href="/"
          className="inline-flex items-center gap-1 border border-brand-300 dark:border-brand-600 text-brand-600 dark:text-brand-300 font-semibold px-5 py-3 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-950 transition-colors text-sm"
        >
          Back to Home <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <Suspense fallback={
        <div className="text-brand-500 dark:text-brand-400 text-sm">Loading…</div>
      }>
        <SuccessContent />
      </Suspense>
    </main>
  );
}
