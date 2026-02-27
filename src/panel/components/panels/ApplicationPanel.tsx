/**
 * ApplicationPanel.tsx — Cookies, localStorage, and sessionStorage viewer
 * with sidebar navigation and a filterable data table.
 */
import {
  IconRefresh,
  IconTrash,
  IconCookies,
  IconStorage,
  IconClipboard,
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
    </div>
  );
}
