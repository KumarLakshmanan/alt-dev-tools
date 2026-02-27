"use client";

import { useState } from "react";
import { MessageSquare, Send, CheckCircle } from "lucide-react";

export default function FeedbackPage() {
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) { setError("Please enter your feedback."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim(), source: "web" }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="max-w-xl mx-auto px-4 py-24 text-center">
        <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-brand-600 dark:text-brand-300 mb-2">
          Thank you!
        </h1>
        <p className="text-brand-400 dark:text-brand-400/70">
          Your feedback has been received. We appreciate you taking the time to help us improve HoverQR.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-16">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare size={28} className="text-brand-500 dark:text-brand-300" />
        <h1 className="text-2xl font-bold text-brand-600 dark:text-brand-300">
          Send Feedback
        </h1>
      </div>
      <p className="text-sm text-brand-400 dark:text-brand-400/70 mb-8">
        Found a bug? Have an idea? We&apos;d love to hear from you. Your feedback
        helps us build a better HoverQR.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="What's on your mind? Share bugs, ideas, or anything else…"
          rows={6}
          className="w-full px-4 py-3 rounded-xl border border-brand-200 dark:border-brand-600 bg-white dark:bg-brand-900/50 text-brand-700 dark:text-brand-200 placeholder:text-brand-300 dark:placeholder:text-brand-500 focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none resize-none text-sm transition-colors"
        />
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-medium text-sm hover:from-brand-600 hover:to-brand-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={14} />
          {loading ? "Sending…" : "Send Feedback"}
        </button>
      </form>
    </main>
  );
}
