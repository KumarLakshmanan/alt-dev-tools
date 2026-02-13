// Service worker for DevTools Sidebar extension
// Manages connections between side panel and content scripts

// Open side panel when extension icon is clicked
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Store panel port and its associated tab IDs
let panelPort = null;
let activeTabIds = new Set();

function safeSendToTab(tabId, message, callback) {
  chrome.tabs.sendMessage(tabId, message, function (response) {
    if (chrome.runtime.lastError) {
      // Content script not available - try injecting it
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content/content-script.js']
      }).then(function () {
        // Also inject page hooks
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content/page-hooks.js'],
          world: 'MAIN'
        }).then(function () {
          // Retry the message
          setTimeout(function () {
            chrome.tabs.sendMessage(tabId, message, function (retryResponse) {
              if (chrome.runtime.lastError) {
                if (callback) callback(null);
              } else {
                if (callback) callback(retryResponse);
              }
            });
          }, 200);
        }).catch(function () {
          if (callback) callback(null);
        });
      }).catch(function () {
        if (callback) callback(null);
      });
    } else {
      if (callback) callback(response);
    }
  });
}

chrome.runtime.onConnect.addListener(function (port) {
  if (port.name !== 'devtools-sidebar') return;

  panelPort = port;

  port.onDisconnect.addListener(function () {
    panelPort = null;
    activeTabIds.clear();
  });

  port.onMessage.addListener(function (message) {
    if (message.type === 'init') {
      activeTabIds.add(message.tabId);
      return;
    }

    var tabId = message.tabId;
    if (!tabId) return;

    // Eval in page
    if (message.type === 'eval-in-page') {
      safeSendToTab(tabId, {
        type: 'eval-in-page',
        expression: message.expression
      }, function (response) {
        if (panelPort) {
          panelPort.postMessage({ type: 'eval-result', result: response });
        }
      });
    }

    // Get page sources
    if (message.type === 'get-page-sources') {
      safeSendToTab(tabId, { type: 'get-page-sources' }, function (response) {
        if (panelPort) {
          panelPort.postMessage({ type: 'page-sources', data: response || [] });
        }
      });
    }

    // Get DOM tree
    if (message.type === 'get-dom-tree') {
      safeSendToTab(tabId, { type: 'get-dom-tree' }, function (response) {
        if (panelPort) {
          panelPort.postMessage({ type: 'dom-tree', data: response });
        }
      });
    }

    // Highlight element
    if (message.type === 'highlight-element') {
      safeSendToTab(tabId, { type: 'highlight-element', selector: message.selector });
    }

    // Unhighlight element
    if (message.type === 'unhighlight-element') {
      safeSendToTab(tabId, { type: 'unhighlight-element' });
    }

    // Get element styles
    if (message.type === 'get-element-styles') {
      safeSendToTab(tabId, { type: 'get-element-styles', selector: message.selector }, function (response) {
        if (panelPort) {
          panelPort.postMessage({ type: 'element-styles', data: response });
        }
      });
    }

    // Start inspect mode
    if (message.type === 'start-inspect-mode') {
      safeSendToTab(tabId, { type: 'start-inspect-mode' });
    }

    // Stop inspect mode
    if (message.type === 'stop-inspect-mode') {
      safeSendToTab(tabId, { type: 'stop-inspect-mode' });
    }

    // Get event listeners
    if (message.type === 'get-event-listeners') {
      safeSendToTab(tabId, { type: 'get-event-listeners', selector: message.selector }, function (response) {
        if (panelPort) {
          panelPort.postMessage({ type: 'event-listeners', data: response || [] });
        }
      });
    }

    // Force element state
    if (message.type === 'force-element-state') {
      safeSendToTab(tabId, { type: 'force-element-state', selector: message.selector, pseudoClass: message.pseudoClass, enable: message.enable }, function (response) {
        if (panelPort) {
          panelPort.postMessage({ type: 'force-state-result', data: response });
        }
      });
    }

    // Copy element HTML
    if (message.type === 'copy-element-html') {
      safeSendToTab(tabId, { type: 'copy-element-html', selector: message.selector }, function (response) {
        if (panelPort) {
          panelPort.postMessage({ type: 'copy-html-result', data: response });
        }
      });
    }

    // Copy element selector
    if (message.type === 'copy-element-selector') {
      safeSendToTab(tabId, { type: 'copy-element-selector', selector: message.selector }, function (response) {
        if (panelPort) {
          panelPort.postMessage({ type: 'copy-selector-result', data: response });
        }
      });
    }

    // Scroll into view
    if (message.type === 'scroll-into-view') {
      safeSendToTab(tabId, { type: 'scroll-into-view', selector: message.selector });
    }

    // Delete element
    if (message.type === 'delete-element') {
      safeSendToTab(tabId, { type: 'delete-element', selector: message.selector }, function (response) {
        if (panelPort) {
          panelPort.postMessage({ type: 'delete-element-result', data: response });
        }
      });
    }

    // Add HTML adjacent
    if (message.type === 'add-html-adjacent') {
      safeSendToTab(tabId, { type: 'add-html-adjacent', selector: message.selector, position: message.position, html: message.html }, function (response) {
        if (panelPort) {
          panelPort.postMessage({ type: 'add-html-result', data: response });
        }
      });
    }

    // Edit outer HTML
    if (message.type === 'edit-outer-html') {
      safeSendToTab(tabId, { type: 'edit-outer-html', selector: message.selector, html: message.html }, function (response) {
        if (panelPort) {
          panelPort.postMessage({ type: 'edit-html-result', data: response });
        }
      });
    }

    // Start/stop DOM observer
    if (message.type === 'start-dom-observer') {
      safeSendToTab(tabId, { type: 'start-dom-observer' });
    }
    if (message.type === 'stop-dom-observer') {
      safeSendToTab(tabId, { type: 'stop-dom-observer' });
    }

    // Get cookies (using chrome.cookies API)
    if (message.type === 'get-cookies') {
      chrome.tabs.get(tabId, function (tab) {
        if (chrome.runtime.lastError || !tab || !tab.url) {
          if (panelPort) panelPort.postMessage({ type: 'cookies-data', data: [] });
          return;
        }
        try {
          var url = tab.url;
          // Skip chrome:// and about: URLs
          if (url.startsWith('chrome://') || url.startsWith('about:') || url.startsWith('chrome-extension://')) {
            if (panelPort) panelPort.postMessage({ type: 'cookies-data', data: [] });
            return;
          }
          chrome.cookies.getAll({ url: url }, function (cookies) {
            if (chrome.runtime.lastError) {
              if (panelPort) panelPort.postMessage({ type: 'cookies-data', data: [] });
              return;
            }
            if (panelPort) {
              panelPort.postMessage({ type: 'cookies-data', data: cookies || [] });
            }
          });
        } catch (e) {
          if (panelPort) panelPort.postMessage({ type: 'cookies-data', data: [] });
        }
      });
    }

    // Delete cookie
    if (message.type === 'delete-cookie') {
      chrome.cookies.remove({ url: message.url, name: message.name }, function () {
        if (panelPort) panelPort.postMessage({ type: 'cookie-deleted', name: message.name });
      });
    }

    // Get storage (localStorage / sessionStorage)
    if (message.type === 'get-storage') {
      safeSendToTab(tabId, { type: 'eval-in-page', expression: '(function(){ try { var s = ' + message.storageType + '; var items = []; for (var i = 0; i < s.length; i++) { var k = s.key(i); var v = s.getItem(k); items.push({key: k, value: v ? v.substring(0, 1000) : ""}); } return JSON.stringify(items); } catch(e) { return "[]"; } })()' }, function (response) {
        if (panelPort) {
          var data = [];
          try {
            if (response && response.result && response.result.value) {
              var val = response.result.value;
              // Handle case where value might be double-quoted string from eval
              if (typeof val === 'string') {
                data = JSON.parse(val);
              }
            }
          } catch (e) {
            // Try stripping outer quotes if double-encoded
            try {
              if (response && response.result && response.result.value) {
                var v = response.result.value;
                if (v.charAt(0) === '"' && v.charAt(v.length - 1) === '"') {
                  v = JSON.parse(v);
                }
                data = JSON.parse(v);
              }
            } catch (e2) { }
          }
          panelPort.postMessage({ type: 'storage-data', storageType: message.storageType, data: data });
        }
      });
    }

    // Set blocked URLs for request blocking
    if (message.type === 'set-blocked-urls') {
      safeSendToTab(tabId, { type: 'eval-in-page', expression: 'window.postMessage({__devtools_set_blocked_urls__: true, urls: ' + JSON.stringify(message.urls || []) + '}, "*"); "ok"' });
    }

    // Set selected element ($0)
    if (message.type === 'set-selected-element') {
      safeSendToTab(tabId, { type: 'eval-in-page', expression: 'window.postMessage({__devtools_set_selected_element__: true, selector: ' + JSON.stringify(message.selector || '') + '}, "*"); "ok"' });
    }
  });
});

// Forward messages from content script to side panel
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (sender.tab && panelPort) {
    panelPort.postMessage(message);
  }
  return false;
});
