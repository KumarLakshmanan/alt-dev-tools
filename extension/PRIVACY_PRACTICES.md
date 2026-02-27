# Chrome Web Store - Privacy Practices & Permission Justifications

Use these justifications when filling out the **Privacy practices** tab in the Chrome Web Store developer console.

---

## Single Purpose Description

> ALT-DEV TOOLS provides a sidebar-based developer tools panel for web developers to inspect DOM elements, debug console output, monitor network requests, browse source files, and manage application storage — all within the browser sidebar without opening a separate DevTools window.

---

## Permission Justifications

### `activeTab`
> ALT-DEV TOOLS requires activeTab permission to access the currently active tab for DOM inspection, element highlighting, and page content analysis. When the user opens the sidebar panel, the extension reads the current tab's DOM structure, computed styles, and console output. This permission is only used when the user actively interacts with the extension's developer tools panels. No data from the active tab is collected, stored, or transmitted externally.

### `cookies`
> The cookies permission is required for the Application panel's Cookies Viewer feature. When the user navigates to the Application tab and selects "Cookies", the extension reads cookies associated with the current page's URL using chrome.cookies.getAll(). Users can also delete individual cookies through the UI. Cookie data is only displayed locally in the sidebar panel and is never stored, logged, or transmitted to any external server. This is equivalent to the Cookies viewer in Chrome's built-in DevTools.

### `host_permissions` (`<all_urls>`)
> ALT-DEV TOOLS requires host permissions to inject content scripts into web pages the user is inspecting. The content scripts (page-hooks.js and content-script.js) intercept console output, network requests (XHR/fetch), and provide DOM access for the Elements panel. Without host permissions, the extension cannot function as a developer tools replacement because it needs to run code in the page context to capture debugging information. The extension only activates on pages the user is actively inspecting and does not run in the background on unvisited pages. No user data is collected or transmitted.

### `scripting`
> The scripting permission is used as a fallback mechanism when content scripts fail to inject automatically (e.g., after extension updates or on dynamically loaded pages). When the sidebar panel cannot communicate with the content script, it uses chrome.scripting.executeScript() to dynamically inject the required content scripts. This ensures reliable functionality across all pages. The injected scripts only capture developer debugging information (DOM tree, console output, network requests) and do not collect, store, or transmit any personal or browsing data.

### `sidePanel`
> The sidePanel permission is the core of ALT-DEV TOOLS. The entire extension UI is rendered as a Chrome Side Panel, providing developer tools (Elements, Console, Network, Sources, Application panels) in a convenient sidebar format. This is the primary UI mechanism for the extension and is essential for its functionality. The side panel only displays developer debugging information and does not collect or transmit any data.

### `storage`
> The storage permission is used to persist user preferences and extension settings across browser sessions. This includes: panel layout preferences, filter settings, preserve-log toggle state, and other UI configuration. All data is stored locally using chrome.storage.local and is never transmitted to any external server. No personal or browsing data is stored.

### `tabs`
> The tabs permission is required to track the currently active tab and respond to tab switches. When the user switches tabs, the extension needs to re-initialize its content scripts and update the sidebar panels to reflect the new page's DOM, console output, and network requests. The extension uses chrome.tabs.query() to get the active tab ID and chrome.tabs.onActivated to detect tab changes. Only the tab ID and URL are used; no browsing history, tab content, or personal data is collected or transmitted.

---

## Remote Code Justification

> ALT-DEV TOOLS uses chrome.scripting.executeScript() to dynamically inject pre-packaged content scripts (content-script.js and page-hooks.js) that are bundled with the extension. This is NOT remote code execution — the scripts are included in the extension package and reviewed as part of the Chrome Web Store review process. Dynamic injection is used as a reliability fallback when automatic content script injection fails (e.g., after extension updates, on tabs opened before installation, or when the service worker restarts). The extension does NOT fetch, download, or execute any code from external servers.

---

## Data Usage Certification

### Does your extension collect or transmit user data?
**No.** ALT-DEV TOOLS does not collect, store, or transmit any user data. All information displayed in the developer tools panels (DOM tree, console output, network requests, cookies, storage) is processed locally within the browser and is never sent to any external server.

### Does your extension use remote code?
**No.** All scripts are bundled with the extension package. The extension uses chrome.scripting.executeScript() to inject bundled scripts as a fallback mechanism, but no code is fetched from external sources.

### Data collected:
- **Personally identifiable information**: Not collected
- **Health information**: Not collected
- **Financial and payment information**: Not collected
- **Authentication information**: Not collected
- **Personal communications**: Not collected
- **Location**: Not collected
- **Web history**: Not collected
- **User activity**: Not collected
- **Website content**: Processed locally only, never transmitted

---

## Privacy Policy

See [PRIVACY_POLICY.md](PRIVACY_POLICY.md) for the full privacy policy text that can be hosted as a URL for the Chrome Web Store listing.
