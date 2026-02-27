# Changelog

All notable changes to **ALT-DEV TOOLS** will be documented in this file.

## [1.0.0] - 2025-01-25

### 🎉 Initial Release

#### Elements Panel
- DOM tree viewer with expand/collapse nodes
- Live DOM updates via MutationObserver
- Click-to-inspect mode with page element highlighting
- Inline editing of text content and HTML attributes (double-click)
- Computed CSS styles viewer with toggle on/off
- Interactive box model visualization (margin, padding, border)
- Force element pseudo-states (`:hover`, `:active`, `:focus`, `:visited`, `:focus-within`)
- Event listeners pane showing all attached handlers
- Element actions: scroll into view, copy HTML, copy selector, delete, add child/before/after
- DOM text search with highlight

#### Console Panel
- Full console method capture: `log`, `warn`, `error`, `info`, `debug`, `table`, `dir`, `count`, `assert`, `trace`, `clear`
- JavaScript expression evaluation in page context
- Expandable nested object inspector (up to 3 levels)
- `console.group()` / `console.groupCollapsed()` / `console.groupEnd()` with indentation
- `console.time()` / `console.timeEnd()` / `console.timeLog()` with timing display
- Special variables: `$_` (last eval result), `$0` (selected element), `$$()` (querySelectorAll), `copy()` (clipboard)
- Clickable source links that jump to Sources panel
- Right-click context menu: copy object, store as global variable, copy text
- Level filtering (verbose/info/warn/error) and text search
- Command history navigation with ↑/↓ keys

#### Network Panel
- XHR and fetch request interception
- Initial page navigation and sub-resource capture via Performance API
- WebSocket frame inspector (open, message, close, error events)
- Request detail tabs: Headers, Payload, Response, Preview, Timing
- Timing breakdown: DNS, Connect, SSL, TTFB, Download
- Waterfall visualization bars
- Column sorting (click headers to sort by name, status, type, size, time)
- Request blocking by URL pattern with glob matching
- Search across all request/response bodies
- Image preview for image responses
- HTML preview in sandboxed iframe
- HAR 1.2 export
- Copy as cURL command
- Copy request URL
- Preserve log across navigations
- Status code and resource type filtering

#### Sources Panel
- File tree browser organized by type (documents, stylesheets, scripts)
- Syntax highlighting for JavaScript, CSS, and HTML
- Line numbers with current line indication
- Pretty-print for minified JS, CSS, and HTML code
- Search across all loaded source files
- External resource fetching with CORS fallback

#### Application Panel
- Cookies viewer with name, value, domain, path, expiration, size columns
- Individual cookie deletion and bulk clear
- localStorage key-value browser
- sessionStorage key-value browser
- Storage entry filtering by key name
- One-click clear for any storage type

#### Infrastructure
- Chrome Manifest V3 with Side Panel API
- Dual content script injection (MAIN + ISOLATED worlds)
- Port-based message passing with auto-reconnection on service worker idle
- Dynamic script injection fallback for uninjected tabs
- Build system with terser minification and ZIP packaging
