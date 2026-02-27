"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { PartyPopper, Mail, Code2, ArrowRight, Copy, CheckCircle, Zap } from "lucide-react";

function SuccessContent() {
  const params = useSearchParams();
  const licenseKey = params.get("license_key") ?? "";
  const status = params.get("status") ?? "";
  const paymentSuccess = status === "succeeded" || !status;

  const [copied, setCopied] = useState(false);
  const [extActivated, setExtActivated] = useState(false);

  // Listen for the content script to inject the extension ID, then
  // send the license key via chrome.runtime.sendMessage (onMessageExternal).
  useEffect(() => {
    if (!licenseKey || !paymentSuccess) return;

    const handler = (event: MessageEvent) => {
      if (
        event.source !== window ||
        event.data?.source !== "altdevtools-ext"
      ) return;

      if (event.data.type === "activated") {
        setExtActivated(true);
        return;
      }

      // Extension is installed — send the key via the external messaging channel
      if (event.data.type === "extension-ready" && event.data.extId) {
        const extId = event.data.extId as string;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const chromeApi = (window as any).chrome;
          if (!chromeApi?.runtime?.sendMessage) return;
          chromeApi.runtime.sendMessage(
            extId,
            { type: "altdevtools:activate", key: licenseKey },
            (resp: { success?: boolean } | undefined) => {
              if (resp?.success) setExtActivated(true);
            }
          );
        } catch {
          // Extension not installed or not available — user activates manually
        }
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [licenseKey, paymentSuccess]);

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
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-400 flex items-center justify-center">
          <PartyPopper size={32} className="text-white" />
        </div>
      </div>
      <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-3">
        {paymentSuccess ? "Payment Successful!" : "Processing…"}
      </h1>
      <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">
        You now have access to{" "}
        <strong className="text-brand-500">ALT-DEV TOOLS Pro</strong>.
      </p>

      {/* Auto-activated badge */}
      {extActivated && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <Zap size={18} className="text-green-500 flex-shrink-0" />
          <p className="text-sm font-semibold text-green-700 dark:text-green-300">
            Extension activated automatically! Pro panels are now unlocked.
          </p>
        </div>
      )}

      {/* License key box — shown when Dodo includes it in the return URL */}
      {licenseKey ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
            Your Pro License Key
          </p>
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 mb-3">
            <code className="flex-1 text-slate-800 dark:text-slate-100 font-mono text-xs tracking-wide break-all">
              {licenseKey}
            </code>
            <button
              onClick={copyKey}
              className="flex-shrink-0 text-xs bg-brand-500 text-white px-3 py-1.5 rounded-lg hover:bg-brand-600 transition-colors"
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
          <p className="text-xs text-slate-400">
            A copy has also been sent to your email by Dodo Payments.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 mb-6">
          <div className="flex justify-center mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
              <Mail size={20} className="text-brand-500" />
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Check your email
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Your license key has been sent to your email address by Dodo Payments.
            Check your inbox and spam folder.
          </p>
        </div>
      )}

      {/* Activation steps */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-left mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Code2 size={16} className="text-brand-500" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            How to activate in Chrome:
          </p>
        </div>
        <ol className="text-sm text-slate-500 dark:text-slate-400 list-decimal list-inside space-y-1.5">
          <li>Open the <strong className="text-slate-700 dark:text-slate-200">ALT-DEV TOOLS</strong> side panel</li>
          <li>Click the <strong className="text-slate-700 dark:text-slate-200">License</strong> tab (key icon)</li>
          <li>Paste the license key → click <strong className="text-slate-700 dark:text-slate-200">Activate</strong></li>
          <li>Pro panels unlock immediately — no restart needed</li>
        </ol>
      </div>

      {/* CTAs */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/license"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-400 text-white font-bold px-5 py-3 rounded-xl hover:opacity-90 transition-opacity text-sm"
        >
          <Code2 size={16} /> Activation Guide
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold px-5 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
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
      <Suspense fallback={<div className="text-brand-500 text-sm">Loading…</div>}>
        <SuccessContent />
      </Suspense>
    </main>
  );
}
