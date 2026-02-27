import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "HoverQR privacy policy — learn how we handle your data (spoiler: we don't collect any).",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-2 text-brand-600 dark:text-brand-300">
        Privacy Policy
      </h1>
      <p className="text-sm text-brand-400 dark:text-brand-400/60 mb-10">
        Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <div className="prose prose-brand dark:prose-invert max-w-none space-y-8 text-[15px] leading-relaxed">
        {/* ─── Intro ─── */}
        <section>
          <p>
            HoverQR (&quot;we&quot;, &quot;our&quot;, or &quot;the extension&quot;) is a Chrome browser
            extension that decodes QR codes and barcodes from web page images and
            generates QR codes from text. This Privacy Policy explains what data
            we collect, how we use it, and your rights.
          </p>
        </section>

        {/* ─── Data We Collect ─── */}
        <section>
          <h2 className="text-xl font-semibold text-brand-600 dark:text-brand-300">
            1. Data We Collect
          </h2>
          <p>
            <strong>We do not collect personal data.</strong> Specifically:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>No names, email addresses, or phone numbers are collected.</li>
            <li>No browsing history is recorded or transmitted.</li>
            <li>No images are uploaded to any server.</li>
            <li>No analytics, tracking pixels, or third-party SDKs are included.</li>
          </ul>
        </section>

        {/* ─── Local Storage ─── */}
        <section>
          <h2 className="text-xl font-semibold text-brand-600 dark:text-brand-300">
            2. Local Data Storage
          </h2>
          <p>
            HoverQR stores the following data <strong>locally on your device</strong> using
            Chrome&apos;s <code>chrome.storage.local</code> API:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>User preferences</strong> — feature toggles, theme preference,
              hover tooltip delay.
            </li>
            <li>
              <strong>QR history</strong> — text content of decoded and generated QR
              codes, stored so you can revisit them later.
            </li>
            <li>
              <strong>License status</strong> — whether you have activated a Pro
              license key (the key itself, not personal information).
            </li>
          </ul>
          <p>
            This data never leaves your device except as described in Section 3 below.
          </p>
        </section>

        {/* ─── License Validation ─── */}
        <section>
          <h2 className="text-xl font-semibold text-brand-600 dark:text-brand-300">
            3. License Validation
          </h2>
          <p>
            When you activate a Pro license, the extension sends your{" "}
            <strong>license key only</strong> to our backend server at{" "}
            <code>hoverqr.codingfrontend.in</code> to verify its validity. This
            request does not include any personal information, browsing data, or
            device identifiers.
          </p>
          <p>
            A periodic re-validation check occurs approximately every 12 hours to
            ensure the license remains valid.
          </p>
        </section>

        {/* ─── Permissions ─── */}
        <section>
          <h2 className="text-xl font-semibold text-brand-600 dark:text-brand-300">
            4. Browser Permissions
          </h2>
          <p>
            HoverQR requests the following Chrome permissions, each for a specific
            purpose:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-brand-200 dark:border-brand-600">
                  <th className="text-left py-2 pr-4 font-semibold">Permission</th>
                  <th className="text-left py-2 font-semibold">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100 dark:divide-brand-700">
                <tr><td className="py-2 pr-4 font-mono text-xs">activeTab</td><td className="py-2">Access the current tab for decode/encode actions</td></tr>
                <tr><td className="py-2 pr-4 font-mono text-xs">storage</td><td className="py-2">Save settings, history, and license locally</td></tr>
                <tr><td className="py-2 pr-4 font-mono text-xs">clipboardWrite</td><td className="py-2">Copy QR images and decoded text</td></tr>
                <tr><td className="py-2 pr-4 font-mono text-xs">clipboardRead</td><td className="py-2">Paste images from clipboard to decode</td></tr>
                <tr><td className="py-2 pr-4 font-mono text-xs">scripting</td><td className="py-2">Run context menu actions on the page</td></tr>
                <tr><td className="py-2 pr-4 font-mono text-xs">contextMenus</td><td className="py-2">Right-click &quot;Encode/Decode QR&quot; options</td></tr>
                <tr><td className="py-2 pr-4 font-mono text-xs">sidePanel</td><td className="py-2">Sidebar UI for generator, decoder, history</td></tr>
                <tr><td className="py-2 pr-4 font-mono text-xs">tabs</td><td className="py-2">Route messages between background and content scripts</td></tr>
                <tr><td className="py-2 pr-4 font-mono text-xs">alarms</td><td className="py-2">Periodic license re-validation (every 12h)</td></tr>
                <tr><td className="py-2 pr-4 font-mono text-xs">&lt;all_urls&gt;</td><td className="py-2">Content script runs on all pages to detect QR codes</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── Third-Party Services ─── */}
        <section>
          <h2 className="text-xl font-semibold text-brand-600 dark:text-brand-300">
            5. Third-Party Services
          </h2>
          <p>
            HoverQR does not integrate with any third-party analytics, advertising,
            or data collection services. The only external communication is the
            license validation request described in Section 3 and payment processing
            via <strong>DodoPayments</strong> when purchasing a Pro license.
          </p>
          <p>
            DodoPayments processes payment data according to their own{" "}
            <a
              href="https://dodopayments.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-500 hover:text-brand-600 underline"
            >
              privacy policy
            </a>
            . HoverQR does not receive or store credit card details.
          </p>
        </section>

        {/* ─── Data Sharing ─── */}
        <section>
          <h2 className="text-xl font-semibold text-brand-600 dark:text-brand-300">
            6. Data Sharing
          </h2>
          <p>
            We do <strong>not</strong> sell, trade, rent, or otherwise transfer your
            personal data or browsing information to any third party, ever.
          </p>
        </section>

        {/* ─── Data Retention ─── */}
        <section>
          <h2 className="text-xl font-semibold text-brand-600 dark:text-brand-300">
            7. Data Retention &amp; Deletion
          </h2>
          <p>
            All data stored by HoverQR is local to your browser. You can delete it
            at any time by:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Clicking &quot;Clear History&quot; in the extension sidebar.</li>
            <li>Uninstalling the extension (all local data is automatically removed).</li>
            <li>Manually clearing extension storage from Chrome settings.</li>
          </ul>
        </section>

        {/* ─── Children ─── */}
        <section>
          <h2 className="text-xl font-semibold text-brand-600 dark:text-brand-300">
            8. Children&apos;s Privacy
          </h2>
          <p>
            HoverQR is not directed at children under the age of 13 and does not
            knowingly collect any information from children.
          </p>
        </section>

        {/* ─── Changes ─── */}
        <section>
          <h2 className="text-xl font-semibold text-brand-600 dark:text-brand-300">
            9. Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. When we do, we will
            update the &quot;Last updated&quot; date at the top. We encourage you to
            review this page periodically.
          </p>
        </section>

        {/* ─── Contact ─── */}
        <section>
          <h2 className="text-xl font-semibold text-brand-600 dark:text-brand-300">
            10. Contact
          </h2>
          <p>
            If you have questions or concerns about this Privacy Policy, please
            reach out at{" "}
            <a
              href="mailto:support@codingfrontend.in"
              className="text-brand-500 hover:text-brand-600 underline"
            >
              support@codingfrontend.in
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
