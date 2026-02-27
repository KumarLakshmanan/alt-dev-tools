"use client";
import { useState } from "react";
import Link from "next/link";
import { Key, CheckCircle, XCircle, Loader2, ExternalLink, ArrowRight } from "lucide-react";

type VerifyState = "idle" | "loading" | "valid" | "invalid" | "error";

export default function VerifyKeyPage() {
  const [key, setKey] = useState("");
  const [state, setState] = useState<VerifyState>("idle");
  const [message, setMessage] = useState("");

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const trimmedKey = key.trim();
    if (!trimmedKey) return;

    setState("loading");
    setMessage("");

    try {
      const res = await fetch(`/api/activation/validate?key=${encodeURIComponent(trimmedKey)}`);
      const data = await res.json() as { valid: boolean; message?: string };

      if (data.valid) {
        setState("valid");
        setMessage("Your license key is valid and active.");
      } else {
        setState("invalid");
        setMessage(data.message ?? "This license key is not recognised. Check for typos or contact support.");
      }
    } catch {
      setState("error");
      setMessage("Could not connect to the validation server. Please try again.");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-400 flex items-center justify-center">
              <Key size={28} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-2">
            Verify License Key
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Enter your ALT-DEV TOOLS Pro license key to confirm it&apos;s valid.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleVerify}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 mb-6"
        >
          <label
            htmlFor="license-key"
            className="block text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2"
          >
            License Key
          </label>
          <input
            id="license-key"
            type="text"
            value={key}
            onChange={(e) => { setKey(e.target.value); setState("idle"); }}
            placeholder="Paste your license key here"
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-brand-500 font-mono text-sm mb-4"
            spellCheck={false}
            autoComplete="off"
          />

          <button
            type="submit"
            disabled={state === "loading" || !key.trim()}
            className="w-full bg-gradient-to-r from-brand-500 to-brand-400 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2 text-sm"
          >
            {state === "loading" ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Verifying…
              </>
            ) : (
              <>
                <Key size={16} /> Verify Key
              </>
            )}
          </button>
        </form>

        {/* Result */}
        {state === "valid" && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-2xl p-5 flex items-start gap-3 mb-6">
            <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-700 dark:text-green-300 text-sm mb-1">Valid License</p>
              <p className="text-sm text-green-600 dark:text-green-400">{message}</p>
            </div>
          </div>
        )}

        {(state === "invalid" || state === "error") && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-2xl p-5 flex items-start gap-3 mb-6">
            <XCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700 dark:text-red-300 text-sm mb-1">
                {state === "invalid" ? "Invalid Key" : "Verification Error"}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
            </div>
          </div>
        )}

        {/* Help links */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/license"
            className="inline-flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 dark:hover:text-brand-300 transition-colors font-medium"
          >
            How to get a key <ArrowRight size={12} />
          </Link>
          <span className="text-slate-300 dark:text-slate-600 text-xs">·</span>
          <a
            href="https://app.dodopayments.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 dark:hover:text-brand-300 transition-colors font-medium"
          >
            Dodo Payments Portal <ExternalLink size={11} />
          </a>
          <span className="text-slate-300 dark:text-slate-600 text-xs">·</span>
          <a
            href="mailto:support@altdevtools.codingfrontend.in"
            className="inline-flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 dark:hover:text-brand-300 transition-colors font-medium"
          >
            Contact Support
          </a>
        </div>

      </div>
    </main>
  );
}
