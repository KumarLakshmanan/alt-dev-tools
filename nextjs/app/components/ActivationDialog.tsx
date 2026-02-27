"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Key, X, Mail } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ActivationDialog({ open, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setEmail("");
        setSent(false);
        setError("");
        setLoading(false);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  async function handleRequest() {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/activation/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setSent(true);
      } else {
        setError(data.message ?? "Failed to send OTP. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        className="relative w-full max-w-md bg-white dark:bg-[#0f0e1a] border border-[#dde2ff] dark:border-[#312e81] rounded-2xl shadow-2xl p-8 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-brand-400 hover:text-brand-300 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <Key size={40} className="text-brand-500 dark:text-brand-300" />
          </div>
          <h2 className="text-2xl font-extrabold text-brand-700 dark:text-brand-200 mb-2">
            Get My Activation Key
          </h2>
          <p className="text-brand-500 dark:text-brand-400 text-sm">
            Enter the email you used to purchase HoverQR Pro.
            <br />
            We&apos;ll send a one-time code to verify your key.
          </p>
        </div>

        {!sent ? (
          <>
            <label className="block text-sm font-semibold text-brand-600 dark:text-brand-300 mb-2">
              Purchase Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRequest()}
              placeholder="your@email.com"
              autoFocus
              className="w-full bg-[#f0f3ff] dark:bg-[#12104b] border border-brand-300 dark:border-brand-700 rounded-xl px-4 py-3 text-brand-800 dark:text-brand-100 placeholder-brand-400 dark:placeholder-brand-700 outline-none focus:border-brand-500 dark:focus:border-brand-400 mb-4"
            />
            {error && <p className="text-red-500 dark:text-red-400 text-xs mb-3">{error}</p>}
            <button
              onClick={handleRequest}
              disabled={loading}
              className="w-full bg-brand-gradient text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send Verification Code →"}
            </button>
            <p className="text-center text-xs text-brand-500 dark:text-brand-400 mt-4">
              Don&apos;t have Pro yet?{" "}
              <Link
                href="/pricing"
                onClick={onClose}
                className="text-brand-600 dark:text-brand-300 hover:underline"
              >
                Get it for $9 →
              </Link>
            </p>
          </>
        ) : (
          <div className="text-center">
            <div className="flex justify-center mb-3">
              <Mail size={40} className="text-brand-500 dark:text-brand-300" />
            </div>
            <p className="text-brand-700 dark:text-brand-200 font-semibold mb-2">Check your inbox!</p>
            <p className="text-sm text-brand-500 dark:text-brand-400 mb-6">
              We sent a 6-digit OTP to{" "}
              <strong className="text-brand-600 dark:text-brand-300">{email}</strong>.
              <br />
              Enter it on the next page to see your activation key.
            </p>
            <Link
              href={`/activation/verify?email=${encodeURIComponent(email)}`}
              onClick={onClose}
              className="block w-full bg-brand-gradient text-white font-bold py-3 rounded-xl text-center hover:opacity-90 transition-opacity"
            >
              Enter OTP →
            </Link>
            <button
              onClick={() => setSent(false)}
              className="mt-3 text-sm text-brand-500 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 transition-colors"
            >
              ← Use different email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
