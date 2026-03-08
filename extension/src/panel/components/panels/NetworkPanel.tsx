/**
 * NetworkPanel.tsx — HTTP request table, detail pane, request-blocking overlay,
 * and WebSocket frames viewer.
 */
import { IconClear, IconDownload, IconBlock } from '../widgets/Icons';

export function NetworkPanel() {
  return (
    <div id="network-panel" class="panel">
      {/* ── Toolbar ── */}
      <div class="toolbar">
        <div class="toolbar-left">
          <button id="network-clear" class="toolbar-btn" title="Clear network log">
            <IconClear />
          </button>
          <label class="toolbar-checkbox">
            <input type="checkbox" id="network-preserve" />
            Preserve log
          </label>
          <button id="network-export" class="toolbar-btn" title="Export as HAR">
            <IconDownload />
          </button>
          <button id="network-block-toggle" class="toolbar-btn" title="Request blocking">
            <IconBlock />
          </button>
        </div>
        <div class="toolbar-center">
          <input type="text" id="network-filter" class="filter-input" placeholder="Filter" />
          <input
            type="text"
            id="network-search"
            class="filter-input"
            placeholder="Search body..."
            style="margin-left:4px;"
          />
        </div>
        <div class="toolbar-right">
          <div class="type-filters">
            <button class="type-filter-btn active" data-type="all" title="Show all request types">All</button>
            <button class="type-filter-btn" data-type="fetch" title="Show Fetch and XHR requests">Fetch/XHR</button>
            <button class="type-filter-btn" data-type="document" title="Show document requests">Doc</button>
            <button class="type-filter-btn" data-type="stylesheet" title="Show CSS stylesheet requests">CSS</button>
            <button class="type-filter-btn" data-type="script" title="Show JavaScript requests">JS</button>
            <button class="type-filter-btn" data-type="image" title="Show image requests">Img</button>
            <button class="type-filter-btn" data-type="font" title="Show font requests">Font</button>
            <button class="type-filter-btn" data-type="websocket" title="Show WebSocket connections">WS</button>
            <button class="type-filter-btn" data-type="other" title="Show other request types">Other</button>
          </div>
        </div>
      </div>

      {/* ── Summary bar ── */}
      <div class="network-summary" id="network-summary">
        <span id="network-request-count">0 requests</span>
        <span class="summary-sep">|</span>
        <span id="network-transferred">0 B transferred</span>
        <span class="summary-sep">|</span>
        <span id="network-finish-time">Finish: 0 ms</span>
      </div>

      {/* ── Requests table ── */}
      <div class="network-table-wrap">
        <table class="network-table" id="network-table">
          <thead>
            <tr>
              <th class="col-name sortable" data-sort="name">Name</th>
              <th class="col-status sortable" data-sort="status">Status</th>
              <th class="col-type sortable" data-sort="type">Type</th>
              <th class="col-initiator sortable" data-sort="initiator">Initiator</th>
              <th class="col-size sortable" data-sort="size">Size</th>
              <th class="col-time sortable" data-sort="time">Time</th>
              <th class="col-waterfall">Waterfall</th>
            </tr>
          </thead>
          <tbody id="network-table-body" />
        </table>
      </div>

      {/* ── Request detail pane ── */}
      <div id="network-detail" class="network-detail hidden">
        <div class="detail-header">
          <button id="network-detail-close" class="toolbar-btn" title="Close details">&times;</button>
          <div class="detail-tabs">
            <button class="detail-tab active" data-detail="headers" title="View request/response headers">Headers</button>
            <button class="detail-tab" data-detail="payload" title="View request payload">Payload</button>
            <button class="detail-tab" data-detail="preview" title="Preview response body">Preview</button>
            <button class="detail-tab" data-detail="response" title="View raw response">Response</button>
            <button class="detail-tab" data-detail="timing" title="View request timing">Timing</button>
          </div>
          <button
            id="network-copy-curl"
            class="toolbar-btn"
            title="Copy as cURL"
            style="margin-left:auto;font-size:10px;padding:2px 6px;"
          >
            cURL
          </button>
          <button
            id="network-copy-url"
            class="toolbar-btn"
            title="Copy URL"
            style="font-size:10px;padding:2px 6px;"
          >
            URL
          </button>
        </div>
        <div class="detail-content" id="network-detail-content" />
      </div>

      {/* ── Request blocking overlay ── */}
      <div id="network-blocking-panel" class="network-blocking-panel hidden">
        <div class="blocking-header">
          <span>Request Blocking</span>
          <button id="network-blocking-close" class="toolbar-btn" title="Close request blocking">&times;</button>
        </div>
        <div class="blocking-content">
          <div class="blocking-input-row">
            <input
              type="text"
              id="blocking-pattern-input"
              class="filter-input"
              placeholder="URL pattern (e.g. *.js, api.example.com/*)"
            />
            <button id="blocking-add-btn" class="action-btn" title="Add URL pattern to block list">Add</button>
          </div>
          <div id="blocking-patterns-list" class="blocking-patterns-list" />
        </div>
      </div>

      {/* ── WebSocket frames overlay ── */}
      <div id="network-ws-panel" class="network-ws-panel hidden">
        <div class="ws-header">
          <span>WebSocket Frames</span>
          <button id="network-ws-close" class="toolbar-btn" title="Close WebSocket frames">&times;</button>
        </div>
        <div id="ws-frames-list" class="ws-frames-list" />
      </div>
    </div>
  );
}
