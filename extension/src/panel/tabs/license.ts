/**
 * license.ts — License key management for ALT-DEV TOOLS Pro.
 *
 * Persists the license key in chrome.storage.local.
 * Exposes `isProUnlocked()` for panel.ts to gate Pro panels.
 * Handles activation UI: input, submit, clear.
 */

import type { PanelState } from '../state';

// ── Storage key ────────────────────────────────────────────────────────────
const STORAGE_KEY = 'altdevtools_license';

// ── In-memory cache ────────────────────────────────────────────────────────
let _proUnlocked = false;

// ── Public API ─────────────────────────────────────────────────────────────

/** Returns true if a valid license is currently stored. */
export function isProUnlocked(): boolean {
  return _proUnlocked;
}

/** Basic sanity check: key must be non-empty and at least 8 characters. */
function isValidKeyFormat(key: string): boolean {
  return key.trim().length >= 8;
}

const VALIDATE_API = 'https://altdevtools.codingfrontend.in/api/activation/validate';

/** Calls the backend to validate a key with Dodo Payments. Returns true if valid. */
async function validateKeyWithServer(key: string): Promise<boolean> {
  try {
    const res = await fetch(`${VALIDATE_API}?key=${encodeURIComponent(key)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return false;
    const data = await res.json() as { valid?: boolean };
    return data.valid === true;
  } catch {
    return false;
  }
}

/** Load saved license from storage and update in-memory flag. */
function loadStoredLicense(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const key: string | undefined = result[STORAGE_KEY];
      _proUnlocked = typeof key === 'string' && key.length > 0;
      resolve(_proUnlocked ? key! : null);
    });
  });
}

/** Persist a license key and mark Pro as unlocked. */
function saveKey(key: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: key.trim() }, () => {
      _proUnlocked = true;
      resolve();
    });
  });
}

/** Remove the stored license key. */
function clearKey(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(STORAGE_KEY, () => {
      _proUnlocked = false;
      resolve();
    });
  });
}

// ── UI helpers ─────────────────────────────────────────────────────────────

function setStatus(
  el: HTMLElement | null,
  text: string,
  type: 'success' | 'error' | 'info' | '',
): void {
  if (!el) return;
  el.textContent = text;
  el.className = 'license-status' + (type ? ` license-status-${type}` : '');
}

function renderActivatedState(key: string): void {
  const form = document.getElementById('license-form');
  const activated = document.getElementById('license-activated');
  const keyDisplay = document.getElementById('license-key-display');
  if (form) form.classList.add('hidden');
  if (activated) activated.classList.remove('hidden');
  if (keyDisplay) keyDisplay.textContent = key;
}

function renderDeactivatedState(): void {
  const form = document.getElementById('license-form');
  const activated = document.getElementById('license-activated');
  const input = document.getElementById('license-key-input') as HTMLInputElement | null;
  const status = document.getElementById('license-status');
  if (form) form.classList.remove('hidden');
  if (activated) activated.classList.add('hidden');
  if (input) input.value = '';
  setStatus(status, '', '');
}

// ── Init ───────────────────────────────────────────────────────────────────

/**
 * Called by panel.ts after buildLayout().
 * Wires up the license panel UI and loads any persisted key.
 * Returns a Promise that resolves once the stored state is known.
 */
export async function initLicenseTab(_state: PanelState): Promise<void> {
  // Load persisted license first
  const savedKey = await loadStoredLicense();
  if (savedKey) {
    renderActivatedState(savedKey);
  }

  // ── Activate button ──
  const activateBtn = document.getElementById('license-activate-btn');
  const input = document.getElementById('license-key-input') as HTMLInputElement | null;
  const status = document.getElementById('license-status');

  activateBtn?.addEventListener('click', async () => {
    const raw = input?.value?.trim() ?? '';
    if (!raw) {
      setStatus(status, 'Please enter your license key.', 'error');
      return;
    }
    if (!isValidKeyFormat(raw)) {
      setStatus(status, 'Please enter a valid license key.', 'error');
      return;
    }
    setStatus(status, 'Verifying with Dodo Payments…', 'info');
    activateBtn.setAttribute('disabled', 'true');
    try {
      const isValid = await validateKeyWithServer(raw);
      if (!isValid) {
        setStatus(status, 'License key not recognised. Check your email and try again.', 'error');
        return;
      }
      await saveKey(raw);
      renderActivatedState(raw.trim());
      // Notify panel.ts that Pro state changed
      window.dispatchEvent(new CustomEvent('altdevtools:prochange', { detail: { unlocked: true } }));
    } catch {
      setStatus(status, 'Failed to activate. Please try again.', 'error');
    } finally {
      activateBtn.removeAttribute('disabled');
    }
  });

  // Allow Enter key in input
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') activateBtn?.click();
  });

  // ── Deactivate button ──
  const deactivateBtn = document.getElementById('license-deactivate-btn');
  deactivateBtn?.addEventListener('click', async () => {
    await clearKey();
    renderDeactivatedState();
    // Notify panel.ts
    window.dispatchEvent(new CustomEvent('altdevtools:prochange', { detail: { unlocked: false } }));
  });
}
