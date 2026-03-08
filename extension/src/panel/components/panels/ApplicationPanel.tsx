/**
 * ApplicationPanel.tsx — Cookies, Storage, IndexedDB, Cache, Service Workers & Manifest viewer.
 */
import {
  IconRefresh,
  IconTrash,
  IconCookies,
  IconStorage,
  IconClipboard,
  IconDatabase,
  IconCache,
  IconServiceWorker,
  IconManifest,
} from '../widgets/Icons';

export function ApplicationPanel() {
  return (
    <div id="application-panel" class="panel">
      <div class="app-layout">

        {/* ── Storage type sidebar ── */}
        <div class="app-sidebar">
          <div class="app-sidebar-header">Storage</div>
          <div class="app-nav">
            <div class="app-nav-item active" data-app-section="cookies">
              <IconCookies /> Cookies
            </div>
            <div class="app-nav-item" data-app-section="localStorage">
              <IconStorage /> Local Storage
            </div>
            <div class="app-nav-item" data-app-section="sessionStorage">
              <IconClipboard /> Session Storage
            </div>
            <div class="app-nav-item" data-app-section="indexedDB">
              <IconDatabase /> IndexedDB
            </div>
          </div>
          <div class="app-sidebar-header">Cache</div>
          <div class="app-nav">
            <div class="app-nav-item" data-app-section="cacheStorage">
              <IconCache /> Cache Storage
            </div>
          </div>
          <div class="app-sidebar-header">Background</div>
          <div class="app-nav">
            <div class="app-nav-item" data-app-section="serviceWorkers">
              <IconServiceWorker /> Service Workers
            </div>
            <div class="app-nav-item" data-app-section="manifest">
              <IconManifest /> Manifest
            </div>
          </div>
        </div>

        {/* ── Data content area ── */}
        <div class="app-content">
          <div class="toolbar">
            <div class="toolbar-left">
              <button id="app-refresh" class="toolbar-btn" title="Refresh storage data">
                <IconRefresh />
              </button>
              <button id="app-clear-storage" class="toolbar-btn" title="Clear storage">
                <IconTrash />
              </button>
            </div>
            <div class="toolbar-center">
              <input
                type="text"
                id="app-filter"
                class="filter-input"
                placeholder="Filter by key..."
              />
            </div>
          </div>

          <div id="app-data-container" class="app-data-container">
            <div class="sources-placeholder">Select a storage type from the left</div>
          </div>
        </div>

      </div>

      {/* ── Pro lock overlay ── */}
      <div id="pro-lock-application" class="pro-lock-overlay">
        <div class="pro-lock-content">
          <div class="pro-lock-icon">🔒</div>
          <div class="pro-lock-title">Pro Feature</div>
          <div class="pro-lock-desc">The Application panel requires an ALT-DEV TOOLS Pro license.</div>
          <button class="pro-lock-btn" data-go-tab="license">Unlock with License Key →</button>
        </div>
      </div>

    </div>
  );
}
