# ALT-DEV TOOLS

> A powerful sidebar DevTools alternative for Chrome — inspect elements, debug console output, monitor network requests, browse source files, and manage application storage — all from a convenient sidebar panel.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green?logo=googlechrome)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)
![Version](https://img.shields.io/badge/version-1.0.0-orange)

## 🚀 Overview

**ALT-DEV TOOLS** brings Chrome DevTools functionality right into your browser sidebar. No need to open a separate DevTools window — everything is available at a glance while you browse. Built with Manifest V3 and the Side Panel API.

## ✨ Features

### 🔍 Elements Panel
- **Live DOM Tree** — Full interactive DOM tree with expand/collapse nodes
- **Live DOM Updates** — MutationObserver detects page changes in real-time
- **Element Inspector** — Click-to-inspect mode with page highlighting
- **Edit Text & Attributes** — Double-click to edit text content and HTML attributes inline
- **CSS Styles Viewer** — View and toggle computed styles for any element
- **Box Model Visualization** — Interactive margin/padding/border box model display
- **Force Element State** — Force `:hover`, `:active`, `:focus`, `:visited`, `:focus-within` states
- **Event Listeners Pane** — View all event listeners attached to selected elements
- **Element Actions** — Scroll into view, copy HTML, copy selector, delete, add child/before/after
- **DOM Search** — Search DOM tree by text content

### 🖥️ Console Panel
- **Full Console Output** — Captures `log`, `warn`, `error`, `info`, `debug`, `table`, `dir`, `count`, `assert`, `trace`, `clear`
- **Expression Evaluation** — Evaluate JavaScript expressions in page context
- **Expandable Objects** — Click to expand nested objects up to 3 levels deep
- **Console Groups** — `console.group()` / `console.groupCollapsed()` / `console.groupEnd()` support
- **Console Timers** — `console.time()` / `console.timeEnd()` / `console.timeLog()` support
- **Special Variables** — `$_` (last result), `$0` (selected element), `$$()` (querySelectorAll)
- **Source Links** — Click source location to jump to file in Sources panel
- **Copy & Store** — Right-click context menu: copy object, store as global variable
- **Level Filtering** — Filter by verbose/info/warn/error
- **Text Filtering** — Search across all console entries
- **Command History** — Arrow up/down through previous commands

### 🌐 Network Panel
- **XHR & Fetch Capture** — Intercepts all XMLHttpRequest and fetch calls
- **Page Load Resources** — Captures initial navigation + sub-resources via Performance API
- **WebSocket Frames** — Intercepts WebSocket connections and displays frames (sent/received)
- **Request/Response Details** — Headers, payload, response body, preview, and timing tabs
- **Timing Breakdown** — DNS, Connect, SSL, TTFB, Download timing via Performance API
- **Waterfall Visualization** — Visual timing bar for each request
- **Column Sorting** — Click column headers to sort by name, status, type, size, or time
- **Request Blocking** — Block requests by URL pattern (glob matching)
- **Search Within Requests** — Search across all request/response bodies
- **Image Preview** — Inline image preview for image responses
- **HTML Preview** — Sandboxed iframe preview for HTML responses
- **HAR Export** — Export all captured requests as HAR 1.2 format
- **Copy as cURL** — Copy any request as a cURL command
- **Copy URL** — Quick copy request URL
- **Preserve Log** — Keep entries across page navigations
- **Status & Type Filtering** — Filter by HTTP status codes and resource types

### 📄 Sources Panel
- **File Tree** — Browse all page resources organized by type (documents, stylesheets, scripts)
- **Syntax Highlighting** — Color-coded syntax for JavaScript, CSS, and HTML
- **Line Numbers** — Numbered lines with current line highlighting
- **Pretty Print** — Format minified JS, CSS, and HTML code
- **Search Across Files** — Search text across all loaded source files
- **External Resource Fetching** — Fetch remote resources with CORS fallback

### 💾 Application Panel
- **Cookies Viewer** — View all cookies for the current domain (name, value, domain, path, expires, size)
- **Cookie Management** — Delete individual cookies or clear all
- **Local Storage** — Browse all localStorage key-value pairs
- **Session Storage** — Browse all sessionStorage key-value pairs
- **Storage Filtering** — Filter storage entries by key name
- **Clear Storage** — One-click clear for any storage type

## 🎯 Usage

1. Click the extension icon in the Chrome toolbar
2. The ALT-DEV TOOLS sidebar opens on the right side
3. Navigate between tabs: **Elements**, **Console**, **Network**, **Sources**, **Application**
4. Use the inspect button (🔍) to select elements on the page

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Execute console command |
| `↑` / `↓` | Navigate command history |
| `Escape` | Cancel inline editing |
| `Ctrl+Shift+F` | Search across source files |

## 🔒 Permissions

| Permission | Purpose |
|------------|---------|
| `activeTab` | Access current tab for inspection |
| `scripting` | Inject content scripts dynamically |
| `sidePanel` | Open as sidebar panel |
| `tabs` | Track active tab changes |
| `storage` | Persist extension settings |
| `cookies` | Read/manage cookies in Application panel |
| `<all_urls>` | Inject scripts on any webpage |

## 🛠️ Technical Details

- **Manifest Version**: 3
- **Side Panel API**: Used for sidebar UI
- **Content Scripts**: Dual injection — MAIN world (page-hooks.js) + ISOLATED world (content-script.js)
- **Message Passing**: Port-based communication with auto-reconnection
- **Network Capture**: Hooks XMLHttpRequest and fetch APIs, plus Performance API for initial resources
- **Console Hooks**: Wraps all console methods to capture output
- **WebSocket Interception**: Wraps WebSocket constructor to capture frames
- **DOM Observation**: MutationObserver for live DOM change detection

## 📋 Limitations

- **No JavaScript Debugger** — Breakpoints, stepping, and call stack require Chrome DevTools Protocol (CDP)
- **No Performance Profiler** — Flame charts and CPU profiling need CDP access
- **No Memory Inspector** — Heap snapshots require CDP
- **Network Coverage** — Only captures XHR/fetch + Performance API resources (not all browser-initiated requests)
- **CSP Restrictions** — Pages with strict Content-Security-Policy may block `eval()` used for console evaluation
- **Large DOM Trees** — Pages with 10,000+ nodes may be slow to serialize

## 📄 License

ISC License
