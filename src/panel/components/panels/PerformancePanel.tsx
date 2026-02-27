/**
 * PerformancePanel.tsx — Page performance metrics viewer.
 * Shows navigation timing, resource timing, memory usage, and FPS.
 */
import { IconRefresh, IconClear } from '../widgets/Icons';

export function PerformancePanel() {
  return (
    <div id="performance-panel" class="panel">
      {/* ── Toolbar ── */}
      <div class="toolbar">
        <div class="toolbar-left">
          <button id="perf-record" class="toolbar-btn perf-record-btn" title="Start / Stop recording">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <circle cx="12" cy="12" r="8" />
            </svg>
            Record
          </button>
          <button id="perf-refresh" class="toolbar-btn" title="Refresh metrics">
            <IconRefresh />
          </button>
          <button id="perf-clear" class="toolbar-btn" title="Clear results">
            <IconClear />
          </button>
        </div>
      </div>

      {/* ── Overview cards ── */}
      <div id="perf-overview" class="perf-overview">
        <div class="perf-card">
          <div class="perf-card-label">Load Time</div>
          <div class="perf-card-value" id="perf-load-time">—</div>
        </div>
        <div class="perf-card">
          <div class="perf-card-label">DOM Content Loaded</div>
          <div class="perf-card-value" id="perf-dcl-time">—</div>
        </div>
        <div class="perf-card">
          <div class="perf-card-label">First Paint</div>
          <div class="perf-card-value" id="perf-fp-time">—</div>
        </div>
        <div class="perf-card">
          <div class="perf-card-label">First Contentful Paint</div>
          <div class="perf-card-value" id="perf-fcp-time">—</div>
        </div>
        <div class="perf-card">
          <div class="perf-card-label">JS Heap Used</div>
          <div class="perf-card-value" id="perf-heap-used">—</div>
        </div>
        <div class="perf-card">
          <div class="perf-card-label">JS Heap Total</div>
          <div class="perf-card-value" id="perf-heap-total">—</div>
        </div>
        <div class="perf-card">
          <div class="perf-card-label">Resources</div>
          <div class="perf-card-value" id="perf-resource-count">—</div>
        </div>
        <div class="perf-card">
          <div class="perf-card-label">Transferred</div>
          <div class="perf-card-value" id="perf-transferred">—</div>
        </div>
      </div>

      {/* ── Resource timing table ── */}
      <div class="perf-section-title">Resource Timing</div>
      <div id="perf-resources" class="perf-resources">
        <div class="sources-placeholder">Click "Refresh" to load performance data</div>
      </div>

      {/* ── FPS meter ── */}
      <div class="perf-section-title">Live FPS</div>
      <div id="perf-fps-bar" class="perf-fps-bar">
        <span id="perf-fps-value" class="perf-fps-value">—</span>
        <div class="perf-fps-meter">
          <div id="perf-fps-fill" class="perf-fps-fill" style="width:0%"></div>
        </div>
      </div>
    </div>
  );
}
