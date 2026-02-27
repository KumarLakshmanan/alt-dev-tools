/**
 * auto-activate.ts
 *
 * Content script that runs on the ALT-DEV TOOLS payment success page.
 *
 * Two-channel activation strategy:
 * 1. Direct: Reads license_key + status from URL → validates with Dodo API →
 *    saves to chrome.storage.local directly (no user action needed).
 * 2. External messaging: Injects the extension ID into the page so the
 *    success page can also call chrome.runtime.sendMessage(extId, ...) —
 *    handled by service-worker.ts `onMessageExternal`.
 */

const STORAGE_KEY = 'altdevtools_license';
const VALIDATE_API = 'https://altdevtools.codingfrontend.in/api/activation/validate';

async function tryAutoActivate(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  const licenseKey = params.get('license_key') ?? '';
  const status = params.get('status') ?? '';

  // Inject the extension ID into the page so the Next.js page can
  // use chrome.runtime.sendMessage(extId, ...) as an alternative channel.
  window.postMessage(
    { source: 'altdevtools-ext', type: 'extension-ready', extId: chrome.runtime.id },
    window.location.origin
  );

  // Only auto-activate when Dodo confirms payment succeeded and key is present
  if (!licenseKey || (status && status !== 'succeeded')) return;

  try {
    // Validate the key with our backend (Dodo Payments API)
    const res = await fetch(`${VALIDATE_API}?key=${encodeURIComponent(licenseKey)}`);
    if (!res.ok) return;
    const data = await res.json() as { valid?: boolean };
    if (!data.valid) return;

    // Save to chrome.storage.local — this activates Pro immediately
    await chrome.storage.local.set({ [STORAGE_KEY]: licenseKey });

    // Notify any open panels about the Pro activation
    chrome.runtime.sendMessage({ type: 'altdevtools:proactivated', key: licenseKey }).catch(() => {
      // Panel may not be open — it reads from storage on next load
    });

    // Notify the page so the success UI can show an "Extension activated!" badge
    window.postMessage(
      { source: 'altdevtools-ext', type: 'activated', key: licenseKey },
      window.location.origin
    );
  } catch {
    // Silently ignore — user can always activate manually in the extension
  }
}

tryAutoActivate();
