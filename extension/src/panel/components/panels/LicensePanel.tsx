/**
 * LicensePanel.tsx — License key activation panel for ALT-DEV TOOLS Pro.
 */
import { IconLock } from '../widgets/Icons';

export function LicensePanel() {
  return (
    <div id="license-panel" class="panel">

      {/* ── Header ── */}
      <div class="license-header">
        <div class="license-header-icon">
          <IconLock size={20} />
        </div>
        <div class="license-header-text">
          <div class="license-header-title">ALT-DEV TOOLS Pro</div>
          <div class="license-header-sub">Unlock Sources, Application, Performance &amp; Device panels</div>
        </div>
      </div>

      {/* ── Free vs Pro comparison ── */}
      <div class="license-tiers">
        <div class="license-tier license-tier-free">
          <div class="license-tier-label">Free</div>
          <ul class="license-tier-list">
            <li class="license-tier-item available">✓ Elements inspector</li>
            <li class="license-tier-item available">✓ Console &amp; eval</li>
            <li class="license-tier-item available">✓ Network monitor</li>
          </ul>
        </div>
        <div class="license-tier license-tier-pro">
          <div class="license-tier-label">Pro</div>
          <ul class="license-tier-list">
            <li class="license-tier-item pro">⚡ Sources viewer</li>
            <li class="license-tier-item pro">⚡ Application storage</li>
            <li class="license-tier-item pro">⚡ Performance metrics</li>
            <li class="license-tier-item pro">⚡ Device emulation</li>
          </ul>
        </div>
      </div>

      {/* ── Key input form (shown when NOT activated) ── */}
      <div id="license-form" class="license-form">
        <div class="license-form-label">Enter your license key</div>
        <div class="license-input-row">
          <input
            type="text"
            id="license-key-input"
            class="license-key-input"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            spellcheck={false}
            autocomplete="off"
          />
          <button id="license-activate-btn" class="license-btn license-btn-primary" title="Activate your license key to unlock Pro features">
            Activate
          </button>
        </div>
        <div id="license-status" class="license-status" />
        <div class="license-get-key">
          Don't have a key?{' '}
          <a
            href="https://altdevtools.codingfrontend.in/license"
            target="_blank"
            rel="noopener noreferrer"
            class="license-link"
          >
            How to get your key →
          </a>
        </div>
      </div>

      {/* ── Activated state (shown when license IS active) ── */}
      <div id="license-activated" class="license-activated hidden">
        <div class="license-activated-badge">
          <span class="license-activated-dot" />
          Pro Active
        </div>
        <div class="license-activated-key-row">
          <span class="license-activated-key-label">License key:</span>
          <code id="license-key-display" class="license-key-display">—</code>
        </div>
        <button id="license-deactivate-btn" class="license-btn license-btn-danger" title="Remove this license key from the extension">
          Remove License
        </button>
      </div>

    </div>
  );
}
