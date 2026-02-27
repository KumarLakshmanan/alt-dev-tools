import Link from "next/link";
import { Frown } from "lucide-react";

export default function PaymentCancelPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4"><Frown size={64} className="text-brand-400 dark:text-brand-400" /></div>
        <h1 className="text-3xl font-extrabold text-brand-700 dark:text-brand-200 mb-3">
          Payment Cancelled
        </h1>
        <p className="text-brand-500 dark:text-brand-400 mb-8">
          No worries — your payment was not processed. You can try again whenever you&apos;re ready.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/pricing"
            className="bg-brand-gradient text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            Try Again →
          </Link>
          <Link
            href="/"
            className="border border-brand-400 dark:border-brand-600 text-brand-600 dark:text-brand-300 font-semibold px-6 py-3 rounded-xl hover:bg-[#f0f3ff] dark:hover:bg-brand-950 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
