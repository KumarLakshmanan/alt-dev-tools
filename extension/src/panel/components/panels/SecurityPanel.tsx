/**
 * SecurityPanel.tsx — Page security overview:
 * protocol, HTTPS status, mixed content detection, and CSP header display.
 */
export function SecurityPanel() {
  return (
    <div id="security-panel" class="panel">
      <div class="toolbar">
        <div class="toolbar-left">
          <button id="security-refresh" class="toolbar-btn" title="Refresh security info">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 4v6h6M23 20v-6h-6" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
          </button>
        </div>
      </div>
      <div id="security-content" class="security-content">
        <div class="sources-placeholder">Loading security info…</div>
      </div>
    </div>
  );
}
