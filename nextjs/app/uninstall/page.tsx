"use client";
import { useState } from "react";
import Link from "next/link";
import { QrCode, Star, MessageCircle, RotateCcw, Heart } from "lucide-react";

const reasons = [
  "I don't use QR codes often",
  "Too many permissions",
  "It didn't work as expected",
  "Missing a feature I need",
  "Found a better alternative",
  "Just trying it out",
  "Other",
];

export default function UninstallPage() {
  const [selected, setSelected] = useState("");
  const [other, setOther] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const reason = selected === "Other" ? other : selected;
    // Fire and forget — just log for now
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, source: "uninstall" }),
      });
    } catch {
      // Ignore errors
    }
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <QrCode size={52} className="text-brand-500 dark:text-brand-300" />
          </div>
          <h1 className="text-3xl font-extrabold text-brand-700 dark:text-brand-200 mb-2">
            Sorry to see you go 👋
          </h1>
          <p className="text-brand-500 dark:text-brand-400">
            HoverQR has been uninstalled. Your feedback helps us improve.
          </p>
        </div>

        {!submitted ? (
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-[#1e1b4b] border border-[#dde2ff] dark:border-[#312e81] rounded-2xl p-8 shadow-lg"
          >
            <h2 className="text-lg font-bold text-brand-700 dark:text-brand-200 mb-5">
              Why did you uninstall HoverQR?
            </h2>

            <div className="flex flex-col gap-3 mb-6">
              {reasons.map((r) => (
                <label
                  key={r}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={selected === r}
                    onChange={() => setSelected(r)}
                    className="accent-brand-500"
                  />
                  <span className="text-sm text-brand-600 dark:text-brand-300 group-hover:text-brand-700 dark:group-hover:text-brand-200">
                    {r}
                  </span>
                </label>
              ))}
            </div>

            {selected === "Other" && (
              <textarea
                value={other}
                onChange={(e) => setOther(e.target.value)}
                placeholder="Tell us more…"
                className="w-full bg-[#f0f3ff] dark:bg-[#12104b] border border-brand-300 dark:border-brand-700 rounded-xl px-4 py-3 text-brand-800 dark:text-brand-100 placeholder-brand-400 dark:placeholder-brand-600 outline-none focus:border-brand-500 dark:focus:border-brand-400 resize-none mb-5 text-sm"
                rows={3}
              />
            )}

            <button
              type="submit"
              disabled={!selected}
              className="w-full bg-brand-gradient text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              <MessageCircle size={15} className="inline mr-2" />
              Submit Feedback
            </button>
          </form>
        ) : (
          <div className="bg-white dark:bg-[#1e1b4b] border border-[#dde2ff] dark:border-[#312e81] rounded-2xl p-8 shadow-lg text-center">
            <div className="flex justify-center mb-4">
              <Heart size={48} className="text-red-500 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-brand-700 dark:text-brand-200 mb-2">
              Thanks for your feedback!
            </h2>
            <p className="text-brand-500 dark:text-brand-400 text-sm mb-6">
              We&apos;ll use your input to make HoverQR better.
            </p>
          </div>
        )}

        {/* Re-install & Review CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://chrome.google.com/webstore"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 border border-brand-400 dark:border-brand-600 text-brand-600 dark:text-brand-300 font-semibold px-6 py-3 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-950 transition-colors text-sm"
          >
            <RotateCcw size={15} /> Re-install HoverQR
          </a>
          <a
            href="https://chrome.google.com/webstore"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-brand-gradient text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity text-sm"
          >
            <Star size={15} /> Leave a Review
          </a>
        </div>

        <p className="text-center text-xs text-brand-400/60 dark:text-brand-400/50 mt-8">
          <Link href="/" className="hover:text-brand-500 dark:hover:text-brand-300 transition-colors">
            hoverqr.codingfrontend.in
          </Link>
          {" · "}
          <a href="mailto:support@hoverqr.codingfrontend.in" className="hover:text-brand-500 dark:hover:text-brand-300 transition-colors">
            Contact Support
          </a>
        </p>
      </div>
    </main>
  );
}
