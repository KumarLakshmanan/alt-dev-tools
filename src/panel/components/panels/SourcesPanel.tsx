/**
 * SourcesPanel.tsx — File tree sidebar, code viewer, and cross-source search.
 */
import { IconSearch } from '../widgets/Icons';

export function SourcesPanel() {
  return (
    <div id="sources-panel" class="panel">
      <div class="sources-layout">

        {/* ── File tree sidebar ── */}
        <div class="sources-sidebar">
          <div class="sources-sidebar-header">Page</div>
          <div id="sources-tree" class="sources-tree" />
        </div>

        {/* ── Code editor area ── */}
        <div class="sources-editor">
          <div class="sources-editor-header">
            <span id="sources-filename" class="sources-filename">No file selected</span>
            <div class="sources-toolbar-right">
              <button id="sources-pretty-print" class="toolbar-btn" title="Pretty print">
                {'{ }'}
              </button>
              <button
                id="sources-search-toggle"
                class="toolbar-btn"
                title="Search across files (Ctrl+Shift+F)"
              >
                <IconSearch />
              </button>
            </div>
          </div>

          <div id="sources-search-bar" class="sources-search-bar hidden">
            <input
              type="text"
              id="sources-search-input"
              class="filter-input"
              placeholder="Search across all sources..."
            />
            <span id="sources-search-count" class="search-count" />
          </div>

          <div id="sources-code" class="sources-code">
            <div class="sources-placeholder">
              Select a file from the left panel to view its source
            </div>
          </div>

          <div id="sources-search-results" class="sources-search-results hidden" />
        </div>

      </div>

      {/* ── Pro lock overlay ── */}
      <div id="pro-lock-sources" class="pro-lock-overlay">
        <div class="pro-lock-content">
          <div class="pro-lock-icon">🔒</div>
          <div class="pro-lock-title">Pro Feature</div>
          <div class="pro-lock-desc">The Sources panel requires an ALT-DEV TOOLS Pro license.</div>
          <button class="pro-lock-btn" data-go-tab="license">Unlock with License Key →</button>
        </div>
      </div>

    </div>
  );
}
