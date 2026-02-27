/**
 * DevicePanel.tsx — Device viewport emulation panel.
 * Mimics Chrome DevTools' Toggle Device View toolbar.
 * Uses CDP (chrome.debugger) for accurate viewport emulation.
 */

export function DevicePanel() {
  return (
    <div id="device-panel" class="panel">
      {/* ── Chrome-style device mode toolbar ── */}
      <div class="device-toolbar">
        {/* Dimensions preset dropdown — like "Dimensions: iPhone 14" in Chrome */}
        <select id="device-preset-select" class="device-preset-select" title="Select a device preset">
          <option value="">Responsive</option>
          <optgroup label="Mobile">
            <option value="iPhone SE">iPhone SE</option>
            <option value="iPhone 14">iPhone 14</option>
            <option value="iPhone 14 Pro Max">iPhone 14 Pro Max</option>
            <option value="Samsung Galaxy S20">Samsung Galaxy S20</option>
          </optgroup>
          <optgroup label="Tablet">
            <option value="iPad">iPad</option>
            <option value="iPad Pro">iPad Pro</option>
          </optgroup>
          <optgroup label="Desktop">
            <option value="Laptop">Laptop</option>
            <option value="Desktop 1080p">Desktop 1080p</option>
          </optgroup>
        </select>

        {/* Inline width × height — editable, just like Chrome */}
        <div class="device-dim-row">
          <input type="number" id="device-width" class="device-dim-input" value="375"
            min="240" max="3840" title="Width (px)" />
          <span class="device-dim-sep">×</span>
          <input type="number" id="device-height" class="device-dim-input" value="667"
            min="240" max="2160" title="Height (px)" />
        </div>

        {/* Apply / Reset buttons */}
        <button id="device-apply" class="device-btn device-btn-apply" title="Apply device emulation">
          Emulate
        </button>
        <button id="device-reset" class="device-btn device-btn-reset" title="Reset viewport">
          Reset
        </button>
      </div>

      {/* ── Status bar ── */}
      <div id="device-status" class="device-status-bar">Not emulating</div>

      {/* ── Info note ── */}
      <div class="device-note">
        <strong>Note:</strong> Emulation uses Chrome's DevTools Protocol — CSS media queries,
        <code>window.innerWidth</code>, and responsive layouts all respond correctly.
        A <em>"DevTools connected"</em> indicator will appear in the tab while emulation is active.
        Click <strong>Reset</strong> to restore the original viewport.
      </div>

      {/* ── Pro lock overlay ── */}
      <div id="pro-lock-device" class="pro-lock-overlay">
        <div class="pro-lock-content">
          <div class="pro-lock-icon">🔒</div>
          <div class="pro-lock-title">Pro Feature</div>
          <div class="pro-lock-desc">The Device emulation panel requires an ALT-DEV TOOLS Pro license.</div>
          <button class="pro-lock-btn" data-go-tab="license">Unlock with License Key →</button>
        </div>
      </div>

    </div>
  );
}
