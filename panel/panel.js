/**
 * DevTools Sidebar Panel - Main Controller
 * Handles Elements, Console, Sources, and Network tabs
 */
(function () {
  'use strict';

  // =============================================
  // STATE
  // =============================================
  const state = {
    activeTab: 'elements',
    tabId: null,
    elements: {
      domTree: null,
      selectedSelector: null,
      eventListeners: [],
      forcedStates: {}
    },
    console: {
      entries: [],
      filter: '',
      levels: { verbose: true, info: true, warn: true, error: true },
      commandHistory: [],
      historyIndex: -1,
      groupDepth: 0
    },
    network: {
      entries: [],
      filter: '',
      typeFilter: 'all',
      preserveLog: false,
      selectedEntry: null,
      detailTab: 'headers',
      sortColumn: null,
      sortDirection: 'asc',
      searchQuery: '',
      blockedUrls: [],
      websockets: {},
      wsFrames: []
    },
    sources: {
      files: [],
      selectedFile: null,
      searchQuery: '',
      prettyPrinted: false
    },
    application: {
      activeSection: 'cookies',
      cookies: [],
      localStorage: [],
      sessionStorage: [],
      filter: ''
    }
  };

  // =============================================
  // CONNECTION TO BACKGROUND (with reconnection)
  // =============================================
  var port = null;
  var portReconnectTimer = null;

  function connectPort() {
    try {
      port = chrome.runtime.connect({ name: 'devtools-sidebar' });
      port.onDisconnect.addListener(function () {
        port = null;
        // Try to reconnect after a delay
        if (portReconnectTimer) clearTimeout(portReconnectTimer);
        portReconnectTimer = setTimeout(function () {
          connectPort();
          // Re-init after reconnect
          if (state.tabId) {
            port.postMessage({ type: 'init', tabId: state.tabId });
            if (state.activeTab === 'elements') loadDomTree();
          }
        }, 1000);
      });
      port.onMessage.addListener(handlePortMessage);
    } catch (e) {
      // Extension context invalidated
      if (portReconnectTimer) clearTimeout(portReconnectTimer);
      portReconnectTimer = setTimeout(connectPort, 2000);
    }
  }

  function handlePortMessage(message) {
    if (message.type === 'console') {
      handleConsoleMessage(message);
    } else if (message.type === 'network') {
      handleNetworkMessage(message.data);
    } else if (message.type === 'dom-tree') {
      handleDomTree(message.data);
    } else if (message.type === 'page-sources') {
      handlePageSources(message.data);
    } else if (message.type === 'element-styles') {
      handleElementStyles(message.data);
    } else if (message.type === 'eval-result') {
      handleEvalResult(message.result);
    } else if (message.type === 'event-listeners') {
      handleEventListeners(message.data);
    } else if (message.type === 'dom-mutation') {
      handleDomMutation(message.mutations);
    } else if (message.type === 'copy-html-result') {
      if (message.data) {
        navigator.clipboard.writeText(message.data).catch(function () { });
        showToast('HTML copied to clipboard');
      }
    } else if (message.type === 'copy-selector-result') {
      if (message.data) {
        navigator.clipboard.writeText(message.data).catch(function () { });
        showToast('Selector copied to clipboard');
      }
    } else if (message.type === 'delete-element-result') {
      if (message.data) loadDomTree();
    } else if (message.type === 'add-html-result' || message.type === 'edit-html-result') {
      if (message.data) loadDomTree();
    } else if (message.type === 'cookies-data') {
      handleCookiesData(message.data);
    } else if (message.type === 'cookie-deleted') {
      loadCookies();
    } else if (message.type === 'storage-data') {
      handleStorageData(message.storageType, message.data);
    } else if (message.type === 'websocket') {
      handleWebSocketMessage(message);
    }
  }

  connectPort();

  // Get current tab ID
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
    if (tabs[0]) {
      state.tabId = tabs[0].id;
      port.postMessage({ type: 'init', tabId: state.tabId });
      loadDomTree();
    }
  });

  // Track tab changes so we always have the right tabId
  chrome.tabs.onActivated.addListener(function (activeInfo) {
    state.tabId = activeInfo.tabId;
    port.postMessage({ type: 'init', tabId: state.tabId });
    // Reset state for new tab
    state.elements.domTree = null;
    state.sources.files = [];
    if (!state.network.preserveLog) {
      state.network.entries = [];
    }
    if (state.activeTab === 'elements') loadDomTree();
    if (state.activeTab === 'sources') loadPageSources();
  });

  // Listen for messages from content script via background (direct)
  chrome.runtime.onMessage.addListener(function (message) {
    if (message.type === 'console') {
      handleConsoleMessage(message);
    } else if (message.type === 'network') {
      handleNetworkMessage(message.data);
    } else if (message.type === 'inspect-element-selected') {
      handleInspectElementSelected(message);
    } else if (message.type === 'inspect-mode-cancelled') {
      var inspBtn = document.getElementById('elements-inspect');
      if (inspBtn) inspBtn.classList.remove('active');
    } else if (message.type === 'dom-mutation') {
      handleDomMutation(message.mutations);
    } else if (message.type === 'websocket') {
      handleWebSocketMessage(message);
    }
  });

  // =============================================
  // TAB SWITCHING
  // =============================================
  document.querySelectorAll('.tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      switchTab(this.dataset.tab);
    });
  });

  function switchTab(tabName) {
    state.activeTab = tabName;
    document.querySelectorAll('.tab').forEach(function (t) {
      t.classList.toggle('active', t.dataset.tab === tabName);
    });
    document.querySelectorAll('.panel').forEach(function (p) {
      p.classList.toggle('active', p.id === tabName + '-panel');
    });
    if (tabName === 'sources' && state.sources.files.length === 0) {
      loadPageSources();
    }
    if (tabName === 'elements' && !state.elements.domTree) {
      loadDomTree();
    }
    if (tabName === 'application') {
      loadApplicationData();
    }
  }

  // =============================================
  // ELEMENTS TAB
  // =============================================
  const elementsTree = document.getElementById('elements-tree');
  const elementsStyles = document.getElementById('elements-styles');
  const elementsBoxModel = document.getElementById('elements-box-model');

  document.getElementById('elements-refresh').addEventListener('click', function () {
    loadDomTree();
  });

  // Inspect mode toggle
  var inspectBtn = document.getElementById('elements-inspect');
  var inspectModeOn = false;
  inspectBtn.addEventListener('click', function () {
    inspectModeOn = !inspectModeOn;
    inspectBtn.classList.toggle('active', inspectModeOn);
    if (state.tabId) {
      port.postMessage({ type: inspectModeOn ? 'start-inspect-mode' : 'stop-inspect-mode', tabId: state.tabId });
    }
  });

  function handleInspectElementSelected(message) {
    inspectModeOn = false;
    inspectBtn.classList.remove('active');
    // Switch to elements tab
    switchTab('elements');
    // Load DOM tree and highlight selected element
    if (message.selector) {
      state.elements.selectedSelector = message.selector;
      if (state.tabId) {
        port.postMessage({ type: 'get-element-styles', tabId: state.tabId, selector: message.selector });
        port.postMessage({ type: 'highlight-element', tabId: state.tabId, selector: message.selector });
      }
      // Try to find and select in tree
      loadDomTree();
    }
  }

  document.getElementById('elements-search').addEventListener('input', function () {
    // Simple search: highlight matching nodes
    const query = this.value.toLowerCase();
    elementsTree.querySelectorAll('.dom-node-line').forEach(function (line) {
      if (!query) {
        line.style.display = '';
        return;
      }
      const text = line.textContent.toLowerCase();
      line.style.opacity = text.includes(query) ? '1' : '0.3';
    });
  });

  var domLoadRetries = 0;
  var domLoadTimeout = null;
  var isEditingDom = false;

  function loadDomTree() {
    if (!state.tabId) {
      elementsTree.innerHTML = '<div class="sources-placeholder">No active tab detected. Please navigate to a page.</div>';
      return;
    }
    elementsTree.innerHTML = '<div class="sources-placeholder">Loading DOM...</div>';
    // Set a timeout - if no response in 4s, retry once
    if (domLoadTimeout) clearTimeout(domLoadTimeout);
    domLoadTimeout = setTimeout(function () {
      if (!state.elements.domTree && domLoadRetries < 2) {
        domLoadRetries++;
        port.postMessage({ type: 'get-dom-tree', tabId: state.tabId });
        domLoadTimeout = setTimeout(function () {
          if (!state.elements.domTree) {
            elementsTree.innerHTML = '<div class="sources-placeholder">Unable to load DOM — content script may not be injected. Try refreshing the page or clicking Refresh above.</div>';
          }
        }, 4000);
      }
    }, 4000);
    port.postMessage({ type: 'get-dom-tree', tabId: state.tabId });
  }

  function handleDomTree(tree) {
    if (domLoadTimeout) { clearTimeout(domLoadTimeout); domLoadTimeout = null; }
    domLoadRetries = 0;
    state.elements.domTree = tree;
    elementsTree.innerHTML = '';
    if (!tree) {
      elementsTree.innerHTML = '<div class="sources-placeholder">Unable to load DOM — the page may have restricted content or CORS policy.</div>';
      return;
    }
    try {
      const fragment = document.createDocumentFragment();
      renderDomNode(tree, fragment, 0);
      elementsTree.appendChild(fragment);
      // After rendering, scroll to selected element
      if (state.elements.selectedSelector) {
        scrollToSelectedDomNode(state.elements.selectedSelector);
      }
    } catch (err) {
      elementsTree.innerHTML = '<div class="sources-placeholder">Error rendering DOM: ' + escapeHtml(err.message) + '</div>';
    }
  }

  function scrollToSelectedDomNode(selector) {
    if (!selector) return;
    var targetLine = elementsTree.querySelector('.dom-node-line[data-selector="' + CSS.escape(selector) + '"]');
    if (!targetLine) {
      // Try partial match (selector might be slightly different)
      elementsTree.querySelectorAll('.dom-node-line[data-selector]').forEach(function (el) {
        if (el.dataset.selector === selector) targetLine = el;
      });
    }
    if (!targetLine) return;
    // Expand all parent .dom-children that are collapsed
    var parent = targetLine.parentElement;
    while (parent && parent !== elementsTree) {
      if (parent.classList && parent.classList.contains('dom-children') && parent.classList.contains('collapsed')) {
        parent.classList.remove('collapsed');
        // Update toggle arrow
        var prevLine = parent.previousElementSibling;
        if (prevLine) {
          var toggle = prevLine.querySelector('.dom-toggle');
          if (toggle) toggle.textContent = '▼';
        }
      }
      parent = parent.parentElement;
    }
    // Select it
    elementsTree.querySelectorAll('.dom-node-line.selected').forEach(function (el) { el.classList.remove('selected'); });
    targetLine.classList.add('selected');
    // Scroll into view
    setTimeout(function () {
      targetLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }

  function renderDomNode(node, parent, depth) {
    if (!node) return;

    const container = document.createElement('div');
    container.className = 'dom-node';

    // Text node
    if (node.nodeType === 3 && node.textContent) {
      const line = document.createElement('div');
      line.className = 'dom-node-line';
      line.style.paddingLeft = (depth * 16 + 18) + 'px';
      var textSpan = document.createElement('span');
      textSpan.className = 'dom-text';
      textSpan.textContent = '"' + node.textContent + '"';
      textSpan.title = 'Double-click to edit';
      textSpan.addEventListener('dblclick', function (e) {
        e.stopPropagation();
        makeEditable(textSpan, node.textContent, function (newVal) {
          textSpan.textContent = '"' + newVal + '"';
          if (node.selector || (node.parentSelector)) {
            editDomText(node.selector || node.parentSelector, newVal);
          }
        });
      });
      line.appendChild(textSpan);
      container.appendChild(line);
      parent.appendChild(container);
      return;
    }

    // Comment node
    if (node.nodeType === 8 && node.textContent) {
      const line = document.createElement('div');
      line.className = 'dom-node-line';
      line.style.paddingLeft = (depth * 16 + 18) + 'px';
      line.innerHTML = '<span class="dom-comment">' + escapeHtml(node.textContent) + '</span>';
      container.appendChild(line);
      parent.appendChild(container);
      return;
    }

    // Truncated indicator
    if (node.nodeType === -1) {
      const line = document.createElement('div');
      line.className = 'dom-node-line';
      line.style.paddingLeft = (depth * 16 + 18) + 'px';
      line.innerHTML = '<span class="dom-text" style="color:var(--text-muted)">' + escapeHtml(node.textContent) + '</span>';
      container.appendChild(line);
      parent.appendChild(container);
      return;
    }

    if (!node.tagName) return;

    const hasChildren = node.children && node.children.length > 0;

    // Opening tag line
    const line = document.createElement('div');
    line.className = 'dom-node-line';
    line.style.paddingLeft = (depth * 16) + 'px';
    if (node.selector) line.dataset.selector = node.selector;

    // Toggle
    const toggle = document.createElement('span');
    toggle.className = 'dom-toggle';
    toggle.textContent = hasChildren ? '▼' : ' ';
    line.appendChild(toggle);

    // Tag content
    const tagContent = document.createElement('span');
    let html = '<span class="dom-punctuation">&lt;</span><span class="dom-tag">' + escapeHtml(node.tagName) + '</span>';

    // Key attributes (id, class first, then others)
    if (node.attributes) {
      const attrOrder = ['id', 'class'];
      const orderedAttrs = [];
      attrOrder.forEach(function (a) {
        if (node.attributes[a]) orderedAttrs.push([a, node.attributes[a]]);
      });
      Object.keys(node.attributes).forEach(function (a) {
        if (!attrOrder.includes(a)) orderedAttrs.push([a, node.attributes[a]]);
      });
      // Show max 4 attributes inline
      orderedAttrs.slice(0, 4).forEach(function (pair) {
        html += ' <span class="dom-attr-name">' + escapeHtml(pair[0]) + '</span>';
        const val = pair[1].length > 60 ? pair[1].substring(0, 57) + '...' : pair[1];
        html += '<span class="dom-punctuation">=</span><span class="dom-attr-value" data-attr="' + escapeHtml(pair[0]) + '" data-selector="' + escapeHtml(node.selector || '') + '">"' + escapeHtml(val) + '"</span>';
      });
      if (orderedAttrs.length > 4) {
        html += ' <span class="dom-punctuation">...</span>';
      }
    }

    html += '<span class="dom-punctuation">&gt;</span>';

    // If no children, show inline closing tag
    if (!hasChildren) {
      html += '<span class="dom-punctuation">&lt;/</span><span class="dom-tag">' + escapeHtml(node.tagName) + '</span><span class="dom-punctuation">&gt;</span>';
    }

    tagContent.innerHTML = html;
    line.appendChild(tagContent);

    // Enable double-click editing on attribute values
    tagContent.querySelectorAll('.dom-attr-value').forEach(function (attrEl) {
      attrEl.style.cursor = 'text';
      attrEl.title = 'Double-click to edit';
      attrEl.addEventListener('dblclick', function (e) {
        e.stopPropagation();
        var attrName = attrEl.dataset.attr;
        var selector = attrEl.dataset.selector;
        var currentVal = attrEl.textContent.replace(/^"|"$/g, '');
        makeEditable(attrEl, currentVal, function (newVal) {
          attrEl.textContent = '"' + newVal + '"';
          editDomAttribute(selector, attrName, newVal);
        });
      });
    });

    // Click to select and show styles
    line.addEventListener('click', function (e) {
      if (e.target === toggle) return;
      elementsTree.querySelectorAll('.dom-node-line.selected').forEach(function (el) {
        el.classList.remove('selected');
      });
      line.classList.add('selected');
      if (node.selector) {
        state.elements.selectedSelector = node.selector;
        port.postMessage({ type: 'highlight-element', tabId: state.tabId, selector: node.selector });
        port.postMessage({ type: 'get-element-styles', tabId: state.tabId, selector: node.selector });
        // Set $0 in page context
        port.postMessage({ type: 'set-selected-element', tabId: state.tabId, selector: node.selector });
        // Reset force state checkboxes
        document.querySelectorAll('#elements-force-state input[type="checkbox"]').forEach(function (cb) { cb.checked = false; });
      }
    });

    // Hover to highlight
    line.addEventListener('mouseenter', function () {
      if (node.selector) {
        port.postMessage({ type: 'highlight-element', tabId: state.tabId, selector: node.selector });
      }
    });
    line.addEventListener('mouseleave', function () {
      port.postMessage({ type: 'unhighlight-element', tabId: state.tabId });
    });

    container.appendChild(line);

    // Children
    if (hasChildren) {
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'dom-children';

      // Auto-collapse deep nodes
      const collapsed = depth > 3;
      if (collapsed) childrenContainer.classList.add('collapsed');

      toggle.textContent = collapsed ? '▶' : '▼';
      toggle.addEventListener('click', function () {
        childrenContainer.classList.toggle('collapsed');
        toggle.textContent = childrenContainer.classList.contains('collapsed') ? '▶' : '▼';
      });

      node.children.forEach(function (child) {
        renderDomNode(child, childrenContainer, depth + 1);
      });

      // Closing tag
      const closingLine = document.createElement('div');
      closingLine.className = 'dom-node-line';
      closingLine.style.paddingLeft = (depth * 16 + 18) + 'px';
      closingLine.innerHTML = '<span class="dom-punctuation">&lt;/</span><span class="dom-tag">' + escapeHtml(node.tagName) + '</span><span class="dom-punctuation">&gt;</span>';
      childrenContainer.appendChild(closingLine);

      container.appendChild(childrenContainer);
    }

    parent.appendChild(container);
  }

  function handleElementStyles(data) {
    if (!data) {
      elementsStyles.innerHTML = '<div class="sources-placeholder">No styles available</div>';
      elementsBoxModel.innerHTML = '<div class="sources-placeholder">No box model</div>';
      return;
    }

    // Render styles
    let stylesHtml = '';
    if (data.tagName) {
      stylesHtml += '<div style="color:var(--text-muted);margin-bottom:6px;font-size:10px;">';
      stylesHtml += escapeHtml(data.tagName);
      if (data.id) stylesHtml += '#' + escapeHtml(data.id);
      if (data.className) stylesHtml += '.' + escapeHtml(String(data.className).trim().split(/\s+/).join('.'));
      stylesHtml += '</div>';
    }

    if (data.styles && Object.keys(data.styles).length > 0) {
      Object.keys(data.styles).sort().forEach(function (prop) {
        stylesHtml += '<div class="style-property">';
        stylesHtml += '<input type="checkbox" class="style-toggle" data-prop="' + escapeHtml(prop) + '" data-value="' + escapeHtml(data.styles[prop]) + '" checked>';
        stylesHtml += '<span class="style-prop-name">' + escapeHtml(prop) + ': </span>';
        stylesHtml += '<span class="style-prop-value" data-prop="' + escapeHtml(prop) + '" title="Double-click to edit">' + escapeHtml(data.styles[prop]) + '</span>';
        stylesHtml += '<span class="style-semicolon">;</span>';
        stylesHtml += '</div>';
      });
    } else {
      stylesHtml += '<div class="sources-placeholder">No computed styles</div>';
    }
    elementsStyles.innerHTML = stylesHtml;

    // Attach event handlers for style toggles and editing
    elementsStyles.querySelectorAll('.style-toggle').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var prop = this.dataset.prop;
        var value = this.dataset.value;
        if (state.elements.selectedSelector) {
          editDomStyle(state.elements.selectedSelector, prop, value, this.checked);
        }
      });
    });
    elementsStyles.querySelectorAll('.style-prop-value').forEach(function (valEl) {
      valEl.addEventListener('dblclick', function () {
        var prop = this.dataset.prop;
        var currentVal = this.textContent;
        makeEditable(this, currentVal, function (newVal) {
          valEl.textContent = newVal;
          if (state.elements.selectedSelector) {
            editDomStyle(state.elements.selectedSelector, prop, newVal, true);
            // Update the toggle's data-value
            var toggle = valEl.parentElement.querySelector('.style-toggle');
            if (toggle) toggle.dataset.value = newVal;
          }
        });
      });
    });

    // Render box model
    if (data.boxModel) {
      const bm = data.boxModel;
      const m = bm.margin;
      const p = bm.padding;
      const b = bm.border;
      const w = bm.width;
      const h = bm.height;
      const contentW = w - p.left - p.right - b.left - b.right;
      const contentH = h - p.top - p.bottom - b.top - b.bottom;

      elementsBoxModel.innerHTML = '<div class="box-model">'
        + '<div class="box-margin" style="position:relative">'
        + '<span class="box-label">margin</span>'
        + '<span class="box-val-top">' + m.top + '</span>'
        + '<span class="box-val-bottom">' + m.bottom + '</span>'
        + '<span class="box-val-left">' + m.left + '</span>'
        + '<span class="box-val-right">' + m.right + '</span>'
        + '<div class="box-border" style="position:relative">'
        + '<span class="box-label">border</span>'
        + '<span class="box-val-top">' + b.top + '</span>'
        + '<span class="box-val-bottom">' + b.bottom + '</span>'
        + '<span class="box-val-left">' + b.left + '</span>'
        + '<span class="box-val-right">' + b.right + '</span>'
        + '<div class="box-padding" style="position:relative">'
        + '<span class="box-label">padding</span>'
        + '<span class="box-val-top">' + p.top + '</span>'
        + '<span class="box-val-bottom">' + p.bottom + '</span>'
        + '<span class="box-val-left">' + p.left + '</span>'
        + '<span class="box-val-right">' + p.right + '</span>'
        + '<div class="box-content">' + Math.round(contentW) + ' × ' + Math.round(contentH) + '</div>'
        + '</div></div></div></div>';
    }
  }

  // Inline editing helpers for Elements panel
  function makeEditable(element, currentValue, onSave) {
    isEditingDom = true;
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'inline-edit-input';
    input.value = currentValue;
    var originalText = element.textContent;
    element.textContent = '';
    element.appendChild(input);
    input.focus();
    input.select();

    function save() {
      var newVal = input.value;
      if (element.contains(input)) element.removeChild(input);
      isEditingDom = false;
      if (newVal !== currentValue) {
        onSave(newVal);
      } else {
        element.textContent = originalText;
      }
    }

    input.addEventListener('blur', save);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); save(); }
      if (e.key === 'Escape') { e.preventDefault(); isEditingDom = false; element.textContent = originalText; }
    });
  }

  function editDomText(selector, newText) {
    if (!state.tabId || !selector) return;
    // Use a safer approach: find the element and set its first text node
    port.postMessage({
      type: 'eval-in-page', tabId: state.tabId,
      expression: '(function(){ var el = document.querySelector(' + JSON.stringify(selector) + '); if(!el) return false; var tn = null; for(var i=0;i<el.childNodes.length;i++){ if(el.childNodes[i].nodeType===3){ tn=el.childNodes[i]; break; }} if(tn) tn.textContent=' + JSON.stringify(newText) + '; else el.textContent=' + JSON.stringify(newText) + '; return true; })()'
    });
  }

  function editDomAttribute(selector, attrName, attrValue) {
    if (!state.tabId || !selector) return;
    port.postMessage({
      type: 'eval-in-page', tabId: state.tabId,
      expression: '(function(){ var el = document.querySelector(' + JSON.stringify(selector) + '); if(el) el.setAttribute(' + JSON.stringify(attrName) + ', ' + JSON.stringify(attrValue) + '); return !!el; })()'
    });
  }

  function editDomStyle(selector, prop, value, enabled) {
    if (!state.tabId || !selector) return;
    if (enabled) {
      port.postMessage({
        type: 'eval-in-page', tabId: state.tabId,
        expression: '(function(){ var el = document.querySelector(' + JSON.stringify(selector) + '); if(el) el.style.setProperty(' + JSON.stringify(prop) + ', ' + JSON.stringify(value) + '); return !!el; })()'
      });
    } else {
      port.postMessage({
        type: 'eval-in-page', tabId: state.tabId,
        expression: '(function(){ var el = document.querySelector(' + JSON.stringify(selector) + '); if(el) el.style.removeProperty(' + JSON.stringify(prop) + '); return !!el; })()'
      });
    }
  }

  // =============================================
  // ELEMENTS - EVENT LISTENERS PANE
  // =============================================
  function handleEventListeners(listeners) {
    state.elements.eventListeners = listeners || [];
    var container = document.getElementById('elements-event-listeners');
    if (!container) return;
    if (!listeners || listeners.length === 0) {
      container.innerHTML = '<div class="sources-placeholder">No event listeners found</div>';
      return;
    }
    var html = '';
    listeners.forEach(function (l) {
      html += '<div class="event-listener-item">';
      html += '<span class="event-type">' + escapeHtml(l.type) + '</span>';
      html += '<span class="event-source">' + escapeHtml(l.source) + '</span>';
      html += '<div class="event-handler">' + escapeHtml(l.handler) + '</div>';
      html += '</div>';
    });
    container.innerHTML = html;
  }

  // Styles tabs switching
  document.querySelectorAll('.styles-tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.styles-tab-btn').forEach(function (b) { b.classList.remove('active'); });
      document.querySelectorAll('.styles-tab-content').forEach(function (c) { c.classList.remove('active'); });
      this.classList.add('active');
      var tabId = 'styles-tab-' + this.dataset.stylesTab;
      var tabEl = document.getElementById(tabId);
      if (tabEl) tabEl.classList.add('active');
      // Load event listeners when switching to that tab
      if (this.dataset.stylesTab === 'event-listeners' && state.elements.selectedSelector && state.tabId) {
        port.postMessage({ type: 'get-event-listeners', tabId: state.tabId, selector: state.elements.selectedSelector });
      }
    });
  });

  // =============================================
  // ELEMENTS - FORCE STATE
  // =============================================
  document.querySelectorAll('#elements-force-state input[type="checkbox"]').forEach(function (cb) {
    cb.addEventListener('change', function () {
      if (!state.elements.selectedSelector || !state.tabId) return;
      var pseudo = this.dataset.pseudo;
      var enabled = this.checked;
      port.postMessage({
        type: 'force-element-state', tabId: state.tabId,
        selector: state.elements.selectedSelector, pseudoClass: pseudo, enable: enabled
      });
    });
  });

  // =============================================
  // ELEMENTS - ACTIONS (scroll, copy, delete, add)
  // =============================================
  document.getElementById('elem-scroll-into-view').addEventListener('click', function () {
    if (!state.elements.selectedSelector || !state.tabId) return;
    port.postMessage({ type: 'scroll-into-view', tabId: state.tabId, selector: state.elements.selectedSelector });
  });

  document.getElementById('elem-copy-html').addEventListener('click', function () {
    if (!state.elements.selectedSelector || !state.tabId) return;
    port.postMessage({ type: 'copy-element-html', tabId: state.tabId, selector: state.elements.selectedSelector });
  });

  document.getElementById('elem-copy-selector').addEventListener('click', function () {
    if (!state.elements.selectedSelector || !state.tabId) return;
    port.postMessage({ type: 'copy-element-selector', tabId: state.tabId, selector: state.elements.selectedSelector });
  });

  document.getElementById('elem-delete').addEventListener('click', function () {
    if (!state.elements.selectedSelector || !state.tabId) return;
    port.postMessage({ type: 'delete-element', tabId: state.tabId, selector: state.elements.selectedSelector });
  });

  document.getElementById('elem-add-child').addEventListener('click', function () {
    if (!state.elements.selectedSelector || !state.tabId) return;
    var html = prompt('Enter HTML to add as child:', '<div>New element</div>');
    if (html) {
      port.postMessage({ type: 'add-html-adjacent', tabId: state.tabId, selector: state.elements.selectedSelector, position: 'beforeend', html: html });
    }
  });

  document.getElementById('elem-add-before').addEventListener('click', function () {
    if (!state.elements.selectedSelector || !state.tabId) return;
    var html = prompt('Enter HTML to add before:', '<div>New element</div>');
    if (html) {
      port.postMessage({ type: 'add-html-adjacent', tabId: state.tabId, selector: state.elements.selectedSelector, position: 'beforebegin', html: html });
    }
  });

  document.getElementById('elem-add-after').addEventListener('click', function () {
    if (!state.elements.selectedSelector || !state.tabId) return;
    var html = prompt('Enter HTML to add after:', '<div>New element</div>');
    if (html) {
      port.postMessage({ type: 'add-html-adjacent', tabId: state.tabId, selector: state.elements.selectedSelector, position: 'afterend', html: html });
    }
  });

  // =============================================
  // ELEMENTS - LIVE DOM MUTATION HANDLER
  // =============================================
  function handleDomMutation(mutations) {
    if (!mutations || mutations.length === 0) return;
    // Don't auto-refresh while user is editing DOM
    if (isEditingDom) return;
    // Show a notification that DOM changed
    var badge = document.querySelector('.tab[data-tab="elements"] .mutation-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'mutation-badge';
      document.querySelector('.tab[data-tab="elements"]').appendChild(badge);
    }
    badge.textContent = '•';
    badge.title = mutations.length + ' DOM mutation(s) detected';
    // Auto-refresh if on elements tab
    if (state.activeTab === 'elements') {
      loadDomTree();
      badge.textContent = '';
    }
  }

  // =============================================
  // TOAST NOTIFICATION
  // =============================================
  function showToast(msg) {
    var toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function () { toast.classList.add('show'); }, 10);
    setTimeout(function () { toast.classList.remove('show'); setTimeout(function () { toast.remove(); }, 300); }, 2000);
  }

  // =============================================
  // CONSOLE TAB
  // =============================================
  const consoleOutput = document.getElementById('console-output');
  const consoleInput = document.getElementById('console-input');
  const consoleFilter = document.getElementById('console-filter');

  document.getElementById('console-clear').addEventListener('click', function () {
    state.console.entries = [];
    consoleOutput.innerHTML = '';
  });

  consoleFilter.addEventListener('input', function () {
    state.console.filter = this.value.toLowerCase();
    renderConsole();
  });

  document.querySelectorAll('.level-filter input').forEach(function (cb) {
    cb.addEventListener('change', function () {
      state.console.levels[this.dataset.level] = this.checked;
      renderConsole();
    });
  });

  // Console input
  let pendingEvalCallback = null;

  consoleInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && this.value.trim()) {
      const expr = this.value;
      state.console.commandHistory.push(expr);
      state.console.historyIndex = state.console.commandHistory.length;

      addConsoleEntry('command', [{ type: 'string', value: expr }], '');

      // Send eval to content script via background
      if (state.tabId) {
        port.postMessage({ type: 'eval-in-page', tabId: state.tabId, expression: expr });
      }
      this.value = '';
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (state.console.historyIndex > 0) {
        state.console.historyIndex--;
        this.value = state.console.commandHistory[state.console.historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (state.console.historyIndex < state.console.commandHistory.length - 1) {
        state.console.historyIndex++;
        this.value = state.console.commandHistory[state.console.historyIndex];
      } else {
        state.console.historyIndex = state.console.commandHistory.length;
        this.value = '';
      }
    }
  });

  function handleEvalResult(response) {
    if (!response) return;
    if (response.isError) {
      addConsoleEntry('error', [response.result || { type: 'error', value: 'Error' }], '');
    } else {
      addConsoleEntry('result', [response.result || { type: 'undefined', value: 'undefined' }], '');
    }
  }

  function handleConsoleMessage(message) {
    if (message.method === 'clear') {
      state.console.entries = [];
      state.console.groupDepth = 0;
      consoleOutput.innerHTML = '';
      return;
    }
    if (message.method === 'group' || message.method === 'groupCollapsed') {
      state.console.groupDepth = (message.groupDepth || state.console.groupDepth + 1);
    }
    if (message.method === 'groupEnd') {
      state.console.groupDepth = Math.max(0, (message.groupDepth || state.console.groupDepth) - 1);
    }
    addConsoleEntry(message.method, message.args || [], message.source || '', message.timestamp, message.groupDepth);
  }

  function addConsoleEntry(method, args, source, timestamp, groupDepth) {
    const entry = { method, args, source, timestamp: timestamp || Date.now(), groupDepth: groupDepth || 0 };
    state.console.entries.push(entry);
    appendConsoleEntry(entry);
  }

  function getEntryLevel(method) {
    if (method === 'warn') return 'warn';
    if (method === 'error' || method === 'assert') return 'error';
    if (method === 'info') return 'info';
    if (method === 'debug' || method === 'trace') return 'verbose';
    return 'info';
  }

  function getEntryIcon(method) {
    switch (method) {
      case 'warn': return '⚠';
      case 'error': return '✕';
      case 'info': return 'ℹ';
      case 'debug': return '🐛';
      case 'command': return '›';
      case 'result': return '‹';
      case 'trace': return '📋';
      case 'group': return '▼';
      case 'groupCollapsed': return '▶';
      case 'groupEnd': return '';
      case 'timeEnd': return '⏱';
      default: return '';
    }
  }

  function shouldShowEntry(entry) {
    const level = getEntryLevel(entry.method);
    if (!state.console.levels[level]) return false;
    if (state.console.filter) {
      const text = entry.args.map(function (a) { return a.value; }).join(' ').toLowerCase();
      if (!text.includes(state.console.filter)) return false;
    }
    return true;
  }

  function formatArg(arg) {
    if (arg.expandable && (arg.children || arg.items)) {
      return createExpandableElement(arg);
    }
    const span = document.createElement('span');
    span.className = 'val-' + arg.type;
    span.textContent = arg.value;
    return span;
  }

  function createExpandableElement(arg) {
    const wrapper = document.createElement('span');
    wrapper.className = 'expandable-value';

    const toggle = document.createElement('span');
    toggle.className = 'expand-toggle collapsed';
    toggle.textContent = '▶';
    wrapper.appendChild(toggle);

    const preview = document.createElement('span');
    preview.className = 'val-' + arg.type + ' expand-preview';
    preview.textContent = arg.preview || arg.value;
    wrapper.appendChild(preview);

    const details = document.createElement('div');
    details.className = 'expand-details hidden';
    wrapper.appendChild(details);

    var expanded = false;
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      expanded = !expanded;
      toggle.textContent = expanded ? '▼' : '▶';
      toggle.className = expanded ? 'expand-toggle expanded' : 'expand-toggle collapsed';
      if (expanded) {
        details.classList.remove('hidden');
        if (details.children.length === 0) {
          renderExpandedContent(details, arg);
        }
      } else {
        details.classList.add('hidden');
      }
    });

    preview.addEventListener('click', function (e) {
      e.stopPropagation();
      toggle.click();
    });

    return wrapper;
  }

  function renderExpandedContent(container, arg) {
    if (arg.type === 'array' && arg.items) {
      arg.items.forEach(function (item, idx) {
        var row = document.createElement('div');
        row.className = 'expand-row';
        var key = document.createElement('span');
        key.className = 'expand-key';
        key.textContent = idx + ': ';
        row.appendChild(key);
        row.appendChild(formatArg(item));
        container.appendChild(row);
      });
      if (arg.length > arg.items.length) {
        var more = document.createElement('div');
        more.className = 'expand-row';
        more.innerHTML = '<span class="val-undefined">... ' + (arg.length - arg.items.length) + ' more items</span>';
        container.appendChild(more);
      }
      var lenRow = document.createElement('div');
      lenRow.className = 'expand-row';
      lenRow.innerHTML = '<span class="expand-key">length: </span><span class="val-number">' + (arg.length || 0) + '</span>';
      container.appendChild(lenRow);
    } else if (arg.children && typeof arg.children === 'object') {
      Object.keys(arg.children).forEach(function (key) {
        var row = document.createElement('div');
        row.className = 'expand-row';
        var keyEl = document.createElement('span');
        keyEl.className = 'expand-key';
        keyEl.textContent = key + ': ';
        row.appendChild(keyEl);
        row.appendChild(formatArg(arg.children[key]));
        container.appendChild(row);
      });
    } else if (arg.items) {
      arg.items.forEach(function (item, idx) {
        var row = document.createElement('div');
        row.className = 'expand-row';
        var key = document.createElement('span');
        key.className = 'expand-key';
        key.textContent = idx + ': ';
        row.appendChild(key);
        row.appendChild(formatArg(item));
        container.appendChild(row);
      });
    }
  }

  function appendConsoleEntry(entry) {
    if (!shouldShowEntry(entry)) return;
    if (entry.method === 'groupEnd') return; // Don't render groupEnd as a visible entry

    const div = document.createElement('div');
    const levelClass = entry.method === 'command' ? 'level-log command'
      : entry.method === 'result' ? 'level-log result'
        : entry.method === 'group' || entry.method === 'groupCollapsed' ? 'level-log group-header'
          : entry.method === 'timeEnd' ? 'level-log time-entry'
            : 'level-' + (entry.method === 'debug' || entry.method === 'trace' ? 'debug' : entry.method === 'assert' ? 'error' : entry.method);
    div.className = 'console-entry ' + levelClass;

    // Apply group indentation
    if (entry.groupDepth > 0) {
      div.style.paddingLeft = (20 + entry.groupDepth * 16) + 'px';
    }

    const icon = document.createElement('span');
    icon.className = 'entry-icon';
    icon.textContent = getEntryIcon(entry.method);
    div.appendChild(icon);

    const content = document.createElement('span');
    content.className = 'entry-content';
    entry.args.forEach(function (arg, idx) {
      if (idx > 0) content.appendChild(document.createTextNode(' '));
      content.appendChild(formatArg(arg));
    });
    div.appendChild(content);

    // Add "Copy object" and "Store as global" context menu
    div.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      showContextMenu(e.pageX, e.pageY, [
        { label: 'Copy object', action: function () {
          var text = entry.args.map(function (a) { return a.value; }).join(' ');
          navigator.clipboard.writeText(text).catch(function () { });
          showToast('Copied to clipboard');
        }},
        { label: 'Store as global variable', action: function () {
          var text = entry.args.map(function (a) { return a.value; }).join(' ');
          var varName = 'temp' + (++storeAsGlobalCounter);
          if (state.tabId) {
            port.postMessage({ type: 'eval-in-page', tabId: state.tabId, expression: 'window.' + varName + ' = ' + JSON.stringify(text) + '; "' + varName + '"' });
            showToast('Stored as ' + varName);
          }
        }},
        { label: 'Copy entry text', action: function () {
          var text = entry.args.map(function (a) { return a.value; }).join(' ');
          navigator.clipboard.writeText(text).catch(function () { });
        }}
      ]);
    });

    if (entry.source) {
      const src = document.createElement('span');
      src.className = 'entry-source';
      const match = entry.source.match(/(?:at\s+)?(?:\S+\s+)?(?:\()?(\S+?)(?:\))?$/);
      var sourceText = match ? match[1] : entry.source;
      // Show only filename + line for display, full URL in tooltip
      var displayText = sourceText;
      try {
        var urlParts = sourceText.split('/');
        var lastPart = urlParts[urlParts.length - 1] || sourceText;
        if (lastPart.length > 0) displayText = lastPart;
      } catch (e) { /* keep original */ }
      src.textContent = displayText;
      src.title = entry.source;
      src.style.cursor = 'pointer';
      src.addEventListener('click', function (e) {
        e.stopPropagation();
        var urlMatch = sourceText.match(/^(https?:\/\/[^:]+)/);
        if (urlMatch) {
          var targetUrl = urlMatch[1];
          var targetFile = state.sources.files.find(function (f) {
            return f.url === targetUrl || f.url.indexOf(targetUrl) !== -1 || targetUrl.indexOf(f.url) !== -1;
          });
          if (targetFile) {
            switchTab('sources');
            loadSourceFile(targetFile);
            var lineMatch = sourceText.match(/:(\d+)/);
            if (lineMatch) {
              var lineNum = parseInt(lineMatch[1]);
              setTimeout(function () {
                var lineEls = sourcesCode.querySelectorAll('.code-line');
                if (lineEls[lineNum - 1]) {
                  lineEls[lineNum - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
                  lineEls[lineNum - 1].style.background = 'rgba(255,255,0,0.15)';
                  setTimeout(function () { lineEls[lineNum - 1].style.background = ''; }, 3000);
                }
              }, 300);
            }
          } else {
            switchTab('sources');
            if (state.sources.files.length === 0) loadPageSources();
          }
        }
      });
      div.appendChild(src);
    }

    consoleOutput.appendChild(div);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  }

  var storeAsGlobalCounter = 0;

  // Context menu helper
  function showContextMenu(x, y, items) {
    // Remove any existing context menu
    var existing = document.querySelector('.custom-context-menu');
    if (existing) existing.remove();
    var menu = document.createElement('div');
    menu.className = 'custom-context-menu';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    items.forEach(function (item) {
      var el = document.createElement('div');
      el.className = 'context-menu-item';
      el.textContent = item.label;
      el.addEventListener('click', function () {
        menu.remove();
        item.action();
      });
      menu.appendChild(el);
    });
    document.body.appendChild(menu);
    // Close on click outside
    setTimeout(function () {
      document.addEventListener('click', function closeMenu() {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      });
    }, 0);
  }

  function renderConsole() {
    consoleOutput.innerHTML = '';
    state.console.entries.forEach(function (entry) {
      appendConsoleEntry(entry);
    });
  }

  // =============================================
  // NETWORK TAB
  // =============================================
  const networkTableBody = document.getElementById('network-table-body');
  const networkFilter = document.getElementById('network-filter');
  const networkDetail = document.getElementById('network-detail');
  const networkDetailContent = document.getElementById('network-detail-content');

  document.getElementById('network-clear').addEventListener('click', function () {
    state.network.entries = [];
    state.network.selectedEntry = null;
    networkDetail.classList.add('hidden');
    renderNetwork();
  });

  document.getElementById('network-preserve').addEventListener('change', function () {
    state.network.preserveLog = this.checked;
  });

  networkFilter.addEventListener('input', function () {
    state.network.filter = this.value.toLowerCase();
    renderNetwork();
  });

  // Network search within request bodies
  document.getElementById('network-search').addEventListener('input', function () {
    state.network.searchQuery = this.value.toLowerCase();
    renderNetwork();
  });

  // Network column sorting
  document.querySelectorAll('.network-table th.sortable').forEach(function (th) {
    th.addEventListener('click', function () {
      var col = this.dataset.sort;
      if (state.network.sortColumn === col) {
        state.network.sortDirection = state.network.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        state.network.sortColumn = col;
        state.network.sortDirection = 'asc';
      }
      // Update sort indicator
      document.querySelectorAll('.network-table th.sortable').forEach(function (h) {
        h.classList.remove('sort-asc', 'sort-desc');
      });
      this.classList.add('sort-' + state.network.sortDirection);
      renderNetwork();
    });
  });

  // Request blocking toggle
  document.getElementById('network-block-toggle').addEventListener('click', function () {
    var panel = document.getElementById('network-blocking-panel');
    panel.classList.toggle('hidden');
    this.classList.toggle('active');
  });

  document.getElementById('network-blocking-close').addEventListener('click', function () {
    document.getElementById('network-blocking-panel').classList.add('hidden');
    document.getElementById('network-block-toggle').classList.remove('active');
  });

  document.getElementById('blocking-add-btn').addEventListener('click', function () {
    var input = document.getElementById('blocking-pattern-input');
    var pattern = input.value.trim();
    if (pattern) {
      state.network.blockedUrls.push(pattern);
      input.value = '';
      renderBlockingPatterns();
      // Send to page
      if (state.tabId) {
        port.postMessage({ type: 'set-blocked-urls', tabId: state.tabId, urls: state.network.blockedUrls });
      }
    }
  });

  document.getElementById('blocking-pattern-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') document.getElementById('blocking-add-btn').click();
  });

  function renderBlockingPatterns() {
    var list = document.getElementById('blocking-patterns-list');
    list.innerHTML = '';
    state.network.blockedUrls.forEach(function (pattern, idx) {
      var row = document.createElement('div');
      row.className = 'blocking-pattern-row';
      row.innerHTML = '<span class="blocking-pattern">' + escapeHtml(pattern) + '</span>';
      var removeBtn = document.createElement('button');
      removeBtn.className = 'toolbar-btn';
      removeBtn.textContent = '✕';
      removeBtn.addEventListener('click', function () {
        state.network.blockedUrls.splice(idx, 1);
        renderBlockingPatterns();
        if (state.tabId) {
          port.postMessage({ type: 'set-blocked-urls', tabId: state.tabId, urls: state.network.blockedUrls });
        }
      });
      row.appendChild(removeBtn);
      list.appendChild(row);
    });
  }

  document.querySelectorAll('.type-filter-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.type-filter-btn').forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
      state.network.typeFilter = this.dataset.type;
      renderNetwork();
    });
  });

  document.querySelectorAll('.detail-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.detail-tab').forEach(function (t) { t.classList.remove('active'); });
      this.classList.add('active');
      state.network.detailTab = this.dataset.detail;
      if (state.network.selectedEntry) renderNetworkDetail(state.network.selectedEntry);
    });
  });

  document.getElementById('network-detail-close').addEventListener('click', function () {
    state.network.selectedEntry = null;
    networkDetail.classList.add('hidden');
    document.querySelectorAll('#network-table-body tr.selected').forEach(function (tr) { tr.classList.remove('selected'); });
  });

  // Export as HAR
  document.getElementById('network-export').addEventListener('click', function () {
    const har = {
      log: {
        version: '1.2',
        creator: { name: 'DevTools Sidebar', version: '1.0.0' },
        entries: state.network.entries.map(function (e) {
          return {
            startedDateTime: new Date(e.timestamp || Date.now()).toISOString(),
            time: e.time || 0,
            request: {
              method: e.method || 'GET',
              url: e.url || '',
              headers: Object.keys(e.requestHeaders || {}).map(function (k) { return { name: k, value: e.requestHeaders[k] }; }),
              postData: e.requestBody ? { mimeType: 'application/octet-stream', text: e.requestBody } : undefined
            },
            response: {
              status: e.status || 0,
              statusText: e.statusText || '',
              headers: Object.keys(e.responseHeaders || {}).map(function (k) { return { name: k, value: e.responseHeaders[k] }; }),
              content: { size: e.size || 0, mimeType: (e.responseHeaders || {})['content-type'] || '', text: e.responseBody || '' }
            },
            timings: { send: 0, wait: e.time || 0, receive: 0 }
          };
        })
      }
    };
    const blob = new Blob([JSON.stringify(har, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'network-log.har';
    a.click();
    URL.revokeObjectURL(url);
  });

  // Copy as cURL
  document.getElementById('network-copy-curl').addEventListener('click', function () {
    if (!state.network.selectedEntry) return;
    const e = state.network.selectedEntry;
    let curl = "curl '" + (e.url || '') + "'";
    if (e.method && e.method !== 'GET') curl += ' -X ' + e.method;
    Object.keys(e.requestHeaders || {}).forEach(function (k) {
      curl += " -H '" + k + ': ' + e.requestHeaders[k] + "'";
    });
    if (e.requestBody) curl += " --data-raw '" + e.requestBody.replace(/'/g, "'\\''") + "'";
    navigator.clipboard.writeText(curl).then(function () {
      document.getElementById('network-copy-curl').textContent = '✓';
      setTimeout(function () { document.getElementById('network-copy-curl').textContent = 'cURL'; }, 1500);
    });
  });

  // Copy URL
  document.getElementById('network-copy-url').addEventListener('click', function () {
    if (!state.network.selectedEntry) return;
    navigator.clipboard.writeText(state.network.selectedEntry.url || '').then(function () {
      document.getElementById('network-copy-url').textContent = '✓';
      setTimeout(function () { document.getElementById('network-copy-url').textContent = 'URL'; }, 1500);
    });
  });

  function handleNetworkMessage(data) {
    state.network.entries.push(data);
    appendNetworkEntry(data, state.network.entries.length - 1);
    updateNetworkSummary();
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' kB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function formatTime(ms) {
    if (ms < 1000) return ms + ' ms';
    return (ms / 1000).toFixed(2) + ' s';
  }

  function getFileName(url) {
    try {
      const u = new URL(url, window.location.href);
      return u.pathname.split('/').pop() || u.hostname;
    } catch (e) {
      return url.length > 60 ? '...' + url.slice(-57) : url;
    }
  }

  function shouldShowNetworkEntry(entry) {
    if (state.network.typeFilter !== 'all') {
      var type = entry.resourceType || 'other';
      if (state.network.typeFilter === 'fetch') {
        if (type !== 'fetch' && type !== 'xhr') return false;
      } else if (state.network.typeFilter === 'websocket') {
        if (type !== 'websocket') return false;
      } else if (type !== state.network.typeFilter) return false;
    }
    if (state.network.filter) {
      var url = (entry.url || '').toLowerCase();
      if (!url.includes(state.network.filter) && !getFileName(entry.url || '').toLowerCase().includes(state.network.filter)) return false;
    }
    // Search within request/response bodies
    if (state.network.searchQuery) {
      var searchIn = ((entry.url || '') + ' ' + (entry.responseBody || '') + ' ' + (entry.requestBody || '')).toLowerCase();
      if (!searchIn.includes(state.network.searchQuery)) return false;
    }
    return true;
  }

  function getStatusClass(status) {
    if (!status || status === 0) return 'status-error';
    if (status >= 200 && status < 300) return 'status-ok';
    if (status >= 300 && status < 400) return 'status-redirect';
    if (status >= 400) return 'status-error';
    return 'status-pending';
  }

  function appendNetworkEntry(entry, index) {
    if (!shouldShowNetworkEntry(entry)) return;
    const tr = document.createElement('tr');
    tr.dataset.index = index;
    if (entry.error || (entry.status && entry.status >= 400)) tr.className = 'error-row';

    // Calculate waterfall bar width (relative to max time)
    const maxTime = Math.max.apply(null, state.network.entries.map(function (e) { return e.time || 1; }));
    const barWidth = Math.max(2, Math.round(((entry.time || 0) / maxTime) * 100));
    const barColor = (entry.status && entry.status >= 400) ? '#f44' : (entry.time > 1000 ? '#fa3' : '#4af');

    tr.innerHTML = '<td class="cell-name" title="' + escapeHtml(entry.url || '') + '">' + escapeHtml(getFileName(entry.url || '')) + '</td>'
      + '<td class="cell-status ' + getStatusClass(entry.status) + '">' + (entry.status || '—') + '</td>'
      + '<td class="cell-type">' + escapeHtml(entry.resourceType || 'other') + '</td>'
      + '<td class="cell-initiator">' + escapeHtml(entry.initiator || '') + '</td>'
      + '<td class="cell-size">' + formatBytes(entry.size || 0) + '</td>'
      + '<td class="cell-time">' + formatTime(entry.time || 0) + '</td>'
      + '<td class="cell-waterfall"><div class="waterfall-bar" style="width:' + barWidth + '%;background:' + barColor + ';height:6px;border-radius:3px;min-width:2px;"></div></td>';

    tr.addEventListener('click', function () {
      document.querySelectorAll('#network-table-body tr.selected').forEach(function (r) { r.classList.remove('selected'); });
      tr.classList.add('selected');
      state.network.selectedEntry = entry;
      networkDetail.classList.remove('hidden');
      renderNetworkDetail(entry);
      // Show WS frames panel for websocket entries
      if (entry.resourceType === 'websocket') {
        showWsFramesForEntry(entry);
      }
    });

    networkTableBody.appendChild(tr);
  }

  function renderNetwork() {
    networkTableBody.innerHTML = '';
    var entries = state.network.entries.slice();
    // Sort if needed
    if (state.network.sortColumn) {
      var col = state.network.sortColumn;
      var dir = state.network.sortDirection === 'asc' ? 1 : -1;
      entries.sort(function (a, b) {
        var va, vb;
        switch (col) {
          case 'name': va = getFileName(a.url || ''); vb = getFileName(b.url || ''); break;
          case 'status': va = a.status || 0; vb = b.status || 0; break;
          case 'type': va = a.resourceType || ''; vb = b.resourceType || ''; break;
          case 'initiator': va = a.initiator || ''; vb = b.initiator || ''; break;
          case 'size': va = a.size || 0; vb = b.size || 0; break;
          case 'time': va = a.time || 0; vb = b.time || 0; break;
          default: va = 0; vb = 0;
        }
        if (typeof va === 'string') return va.localeCompare(vb) * dir;
        return (va - vb) * dir;
      });
    }
    entries.forEach(function (entry, idx) { appendNetworkEntry(entry, idx); });
    updateNetworkSummary();
  }

  function updateNetworkSummary() {
    const count = state.network.entries.length;
    const totalSize = state.network.entries.reduce(function (sum, e) { return sum + (e.size || 0); }, 0);
    const totalTime = state.network.entries.reduce(function (sum, e) { return sum + (e.time || 0); }, 0);
    document.getElementById('network-request-count').textContent = count + ' request' + (count !== 1 ? 's' : '');
    document.getElementById('network-transferred').textContent = formatBytes(totalSize) + ' transferred';
    document.getElementById('network-finish-time').textContent = 'Finish: ' + formatTime(totalTime);
  }

  function renderNetworkDetail(entry) {
    const tab = state.network.detailTab;
    let html = '';
    if (tab === 'headers') {
      html += '<div class="detail-section"><div class="detail-section-title">General</div>';
      html += kv('Request URL', entry.url) + kv('Request Method', entry.method) + kv('Status Code', entry.status + ' ' + (entry.statusText || ''));
      html += kv('Resource Type', entry.resourceType || 'other');
      html += '</div>';
      if (entry.responseHeaders && Object.keys(entry.responseHeaders).length > 0) {
        html += '<div class="detail-section"><div class="detail-section-title">Response Headers (' + Object.keys(entry.responseHeaders).length + ')</div>';
        Object.keys(entry.responseHeaders).sort().forEach(function (k) { html += kv(k, entry.responseHeaders[k]); });
        html += '</div>';
      }
      if (entry.requestHeaders && Object.keys(entry.requestHeaders).length > 0) {
        html += '<div class="detail-section"><div class="detail-section-title">Request Headers (' + Object.keys(entry.requestHeaders).length + ')</div>';
        Object.keys(entry.requestHeaders).sort().forEach(function (k) { html += kv(k, entry.requestHeaders[k]); });
        html += '</div>';
      }
    } else if (tab === 'payload') {
      if (entry.requestBody) {
        const parsed = tryParsePayload(entry.requestBody);
        if (parsed && typeof parsed === 'object') {
          html += '<div class="detail-section"><div class="detail-section-title">Request Payload</div>';
          Object.keys(parsed).forEach(function (k) { html += kv(k, parsed[k]); });
          html += '</div>';
        } else {
          html += '<div class="detail-section"><div class="detail-section-title">Request Payload</div><div class="detail-body">' + escapeHtml(tryPrettyPrint(entry.requestBody)) + '</div></div>';
        }
      } else {
        html += '<div style="color:var(--text-muted);padding:20px;text-align:center;">This request has no payload.</div>';
      }
    } else if (tab === 'preview') {
      if (entry.responseBody) {
        const ct = entry.responseHeaders ? (entry.responseHeaders['content-type'] || '') : '';
        if (ct.indexOf('image') !== -1) {
          // Image preview
          html += '<div class="detail-section"><div class="image-preview-container">';
          html += '<img src="' + escapeHtml(entry.url) + '" class="image-preview" alt="Image preview" onerror="this.outerHTML=\'<span>Unable to load image preview</span>\'">';
          html += '</div></div>';
        } else if (ct.indexOf('json') !== -1 || entry.responseBody.trim().charAt(0) === '{' || entry.responseBody.trim().charAt(0) === '[') {
          html += '<div class="detail-section"><div class="detail-body json-preview">' + escapeHtml(tryPrettyPrint(entry.responseBody)) + '</div></div>';
        } else if (ct.indexOf('html') !== -1) {
          html += '<div class="detail-section"><div class="html-preview-container"><iframe sandbox="" srcdoc="' + escapeHtml(entry.responseBody.substring(0, 50000)) + '" class="html-preview-iframe"></iframe></div></div>';
        } else {
          html += '<div class="detail-section"><div class="detail-body">' + escapeHtml(entry.responseBody.substring(0, 5000)) + '</div></div>';
        }
      } else {
        html += '<div style="color:var(--text-muted);padding:20px;text-align:center;">No data to preview.</div>';
      }
    } else if (tab === 'response') {
      if (entry.responseBody) {
        html += '<div class="detail-section"><div class="detail-body" style="white-space:pre-wrap;word-break:break-all;">' + escapeHtml(entry.responseBody) + '</div></div>';
      } else {
        html += '<div style="color:var(--text-muted);padding:20px;text-align:center;">This request has no response data.</div>';
      }
    } else if (tab === 'timing') {
      html += '<div class="detail-section"><div class="detail-section-title">Timing</div>';
      if (entry.timing) {
        var t = entry.timing;
        var phases = [
          { name: 'Stalled/Blocking', value: t.blocked, color: '#ccc' },
          { name: 'DNS Lookup', value: t.dns, color: '#48c9b0' },
          { name: 'Initial Connection', value: t.connect, color: '#f5b041' },
          { name: 'SSL', value: t.ssl, color: '#a569bd' },
          { name: 'Request Sent', value: t.send, color: '#5dade2' },
          { name: 'Waiting (TTFB)', value: t.wait, color: '#58d68d' },
          { name: 'Content Download', value: t.receive, color: '#5499c7' }
        ];
        var maxPhase = Math.max.apply(null, phases.map(function (p) { return p.value || 0; }));
        if (maxPhase === 0) maxPhase = 1;
        phases.forEach(function (phase) {
          var barWidth = Math.max(0, Math.round((phase.value / maxPhase) * 100));
          html += '<div class="timing-row">';
          html += '<span class="timing-label">' + phase.name + '</span>';
          html += '<div class="timing-bar-wrap"><div class="timing-bar-fill" style="width:' + barWidth + '%;background:' + phase.color + ';"></div></div>';
          html += '<span class="timing-value">' + formatTime(phase.value || 0) + '</span>';
          html += '</div>';
        });
        html += '<div class="timing-row total"><span class="timing-label">Total</span><span class="timing-value">' + formatTime(t.total || entry.time || 0) + '</span></div>';
        if (t.transferSize) {
          html += '<div style="margin-top:12px;padding-top:8px;border-top:1px solid var(--border-color);">';
          html += kv('Transfer Size', formatBytes(t.transferSize));
          html += kv('Resource Size', formatBytes(t.decodedBodySize || 0));
          html += kv('Compressed', formatBytes(t.encodedBodySize || 0));
          html += '</div>';
        }
      } else {
        html += '<div class="timing-bar" style="width:100%;background:var(--accent-color);height:8px;border-radius:4px;margin:8px 0 16px;"></div>';
        html += kv('Total Duration', formatTime(entry.time || 0));
        html += '<div style="color:var(--text-muted);font-size:10px;margin-top:8px;">Detailed timing data not available for this request. Resource Timing API may not expose details for cross-origin requests without Timing-Allow-Origin header.</div>';
      }
      html += kv('Request sent at', new Date(entry.timestamp || Date.now()).toLocaleTimeString());
      html += kv('Response size', formatBytes(entry.size || 0));
      html += '</div>';
    }
    networkDetailContent.innerHTML = html;
  }

  function kv(key, value) {
    return '<div class="detail-kv"><span class="detail-kv-key">' + escapeHtml(key) + ':</span><span class="detail-kv-value">' + escapeHtml(String(value || '')) + '</span></div>';
  }

  function tryPrettyPrint(str) {
    try { return JSON.stringify(JSON.parse(str), null, 2); } catch (e) { return str; }
  }

  function tryParsePayload(str) {
    // Try JSON
    try { return JSON.parse(str); } catch (e) { }
    // Try URL-encoded form data
    if (str.indexOf('=') !== -1) {
      try {
        const params = new URLSearchParams(str);
        const obj = {};
        params.forEach(function (v, k) { obj[k] = v; });
        if (Object.keys(obj).length > 0) return obj;
      } catch (e) { }
    }
    return null;
  }

  // =============================================
  // WEBSOCKET HANDLING
  // =============================================
  function handleWebSocketMessage(message) {
    var d = message.data || message;
    if (!d) return;
    if (message.action === 'open') {
      state.network.websockets[d.id] = { url: d.url, status: 'open', timestamp: d.timestamp };
      // Add to network entries as a WS connection
      state.network.entries.push({
        url: d.url, method: 'WS', status: 101, statusText: 'Switching Protocols',
        requestHeaders: {}, responseHeaders: {}, responseBody: '', resourceType: 'websocket',
        size: 0, time: 0, initiator: 'WebSocket', timestamp: d.timestamp, wsId: d.id
      });
      renderNetwork();
    } else if (message.action === 'message') {
      state.network.wsFrames.push({
        id: d.id, url: d.url, direction: d.direction, data: d.data, timestamp: d.timestamp
      });
      renderWsFrames();
    } else if (message.action === 'close') {
      if (state.network.websockets[d.id]) {
        state.network.websockets[d.id].status = 'closed';
      }
    } else if (message.action === 'error') {
      if (state.network.websockets[d.id]) {
        state.network.websockets[d.id].status = 'error';
      }
    }
  }

  // WebSocket frames panel
  document.getElementById('network-ws-close').addEventListener('click', function () {
    document.getElementById('network-ws-panel').classList.add('hidden');
  });

  function renderWsFrames() {
    var panel = document.getElementById('network-ws-panel');
    var list = document.getElementById('ws-frames-list');
    if (state.network.wsFrames.length === 0) {
      list.innerHTML = '<div class="sources-placeholder">No WebSocket frames captured</div>';
      return;
    }
    // Show only last 200 frames
    var frames = state.network.wsFrames.slice(-200);
    list.innerHTML = '';
    frames.forEach(function (frame) {
      var row = document.createElement('div');
      row.className = 'ws-frame-row ws-frame-' + frame.direction;
      var arrow = frame.direction === 'sent' ? '↑' : '↓';
      var time = new Date(frame.timestamp).toLocaleTimeString();
      row.innerHTML = '<span class="ws-frame-arrow">' + arrow + '</span>'
        + '<span class="ws-frame-data">' + escapeHtml((frame.data || '').substring(0, 200)) + '</span>'
        + '<span class="ws-frame-time">' + time + '</span>';
      row.title = frame.data || '';
      row.addEventListener('click', function () {
        // Show full frame data
        var detail = document.getElementById('network-detail-content');
        if (detail) {
          detail.innerHTML = '<div class="detail-section"><div class="detail-section-title">WebSocket Frame (' + frame.direction + ')</div>'
            + '<div class="detail-body" style="white-space:pre-wrap;">' + escapeHtml(frame.data || '') + '</div></div>';
          document.getElementById('network-detail').classList.remove('hidden');
        }
      });
      list.appendChild(row);
    });
    list.scrollTop = list.scrollHeight;
  }

  // Show WS frames when clicking a websocket entry
  function showWsFramesForEntry(entry) {
    if (entry.resourceType === 'websocket') {
      var panel = document.getElementById('network-ws-panel');
      panel.classList.remove('hidden');
      renderWsFrames();
    }
  }

  // =============================================
  // SOURCES TAB
  // =============================================
  const sourcesTree = document.getElementById('sources-tree');
  const sourcesCode = document.getElementById('sources-code');
  const sourcesFilename = document.getElementById('sources-filename');

  function loadPageSources() {
    if (!state.tabId) return;
    sourcesTree.innerHTML = '<div class="sources-placeholder">Loading sources...</div>';
    port.postMessage({ type: 'get-page-sources', tabId: state.tabId });
  }

  function handlePageSources(sources) {
    if (!sources || sources.length === 0) {
      sourcesTree.innerHTML = '<div class="sources-placeholder">No sources found</div>';
      return;
    }
    state.sources.files = sources;
    renderSourcesTree();
  }

  function renderSourcesTree() {
    sourcesTree.innerHTML = '';
    const groups = {};
    state.sources.files.forEach(function (file) {
      try {
        const origin = new URL(file.url).origin;
        if (!groups[origin]) groups[origin] = [];
        groups[origin].push(file);
      } catch (e) {
        if (!groups['other']) groups['other'] = [];
        groups['other'].push(file);
      }
    });

    Object.keys(groups).sort().forEach(function (origin) {
      const folderEl = document.createElement('div');
      folderEl.className = 'tree-item';
      folderEl.innerHTML = '<span class="tree-icon folder">📁</span>' + escapeHtml(origin);

      const groupEl = document.createElement('div');
      groupEl.className = 'tree-group';

      folderEl.addEventListener('click', function () { groupEl.classList.toggle('collapsed'); });
      sourcesTree.appendChild(folderEl);

      groups[origin].forEach(function (file) {
        const fileEl = document.createElement('div');
        fileEl.className = 'tree-item';
        const icon = file.type === 'document' ? '📄' : file.type === 'stylesheet' ? '🎨' : file.type === 'script' ? '📜' : '📋';
        const iconClass = file.type === 'document' ? 'file-html' : file.type === 'stylesheet' ? 'file-css' : file.type === 'script' ? 'file-js' : 'file-other';
        fileEl.innerHTML = '<span class="tree-icon ' + iconClass + '">' + icon + '</span>' + escapeHtml(getFileName(file.url));
        fileEl.title = file.url;
        fileEl.addEventListener('click', function () {
          sourcesTree.querySelectorAll('.tree-item.selected').forEach(function (el) { el.classList.remove('selected'); });
          fileEl.classList.add('selected');
          loadSourceFile(file);
        });
        groupEl.appendChild(fileEl);
      });

      sourcesTree.appendChild(groupEl);
    });
  }

  function loadSourceFile(file) {
    state.sources.selectedFile = file;
    sourcesFilename.textContent = file.url;
    
    if (file.content) {
      renderSourceCode(file.content, file.type);
    } else {
      // Fetch external resource
      sourcesCode.innerHTML = '<div class="sources-placeholder">Loading...</div>';
      fetch(file.url).then(function (res) { return res.text(); }).then(function (text) {
        file.content = text;
        renderSourceCode(text, file.type);
      }).catch(function () {
        sourcesCode.innerHTML = '<div class="sources-placeholder">Unable to load content (CORS restricted)</div>';
      });
    }
  }

  function renderSourceCode(content, type) {
    sourcesCode.innerHTML = '';
    state.sources.prettyPrinted = false;
    const lines = content.split('\n');
    const fragment = document.createDocumentFragment();
    lines.forEach(function (line, idx) {
      const lineEl = document.createElement('div');
      lineEl.className = 'code-line';
      const numEl = document.createElement('span');
      numEl.className = 'line-number';
      numEl.textContent = (idx + 1);
      const contentEl = document.createElement('span');
      contentEl.className = 'line-content';
      contentEl.innerHTML = highlightSyntax(line, type);
      lineEl.appendChild(numEl);
      lineEl.appendChild(contentEl);
      fragment.appendChild(lineEl);
    });
    sourcesCode.appendChild(fragment);
  }

  // Pretty-print
  document.getElementById('sources-pretty-print').addEventListener('click', function () {
    if (!state.sources.selectedFile || !state.sources.selectedFile.content) return;
    var content = state.sources.selectedFile.content;
    var type = state.sources.selectedFile.type;
    if (!state.sources.prettyPrinted) {
      // Try to pretty-print
      var pretty = content;
      if (type === 'script') {
        pretty = prettyPrintJs(content);
      } else if (type === 'stylesheet') {
        pretty = prettyPrintCss(content);
      } else {
        pretty = prettyPrintHtml(content);
      }
      state.sources.prettyPrinted = true;
      state.sources.selectedFile._origContent = content;
      state.sources.selectedFile.content = pretty;
      renderSourceCode(pretty, type);
      this.classList.add('active');
    } else {
      // Revert to original
      state.sources.prettyPrinted = false;
      state.sources.selectedFile.content = state.sources.selectedFile._origContent || content;
      renderSourceCode(state.sources.selectedFile.content, type);
      this.classList.remove('active');
    }
  });

  function prettyPrintJs(code) {
    try {
      // Simple JS pretty-printer: add newlines after { } ; and indent
      var result = '';
      var indent = 0;
      var inString = false;
      var stringChar = '';
      for (var i = 0; i < code.length; i++) {
        var c = code[i];
        if (inString) {
          result += c;
          if (c === stringChar && code[i - 1] !== '\\') inString = false;
          continue;
        }
        if (c === '"' || c === "'" || c === '`') {
          inString = true;
          stringChar = c;
          result += c;
          continue;
        }
        if (c === '{') {
          indent++;
          result += ' {\n' + '  '.repeat(indent);
        } else if (c === '}') {
          indent = Math.max(0, indent - 1);
          result += '\n' + '  '.repeat(indent) + '}';
          if (i + 1 < code.length && code[i + 1] !== ';' && code[i + 1] !== ',' && code[i + 1] !== ')') {
            result += '\n' + '  '.repeat(indent);
          }
        } else if (c === ';') {
          result += ';\n' + '  '.repeat(indent);
        } else if (c === '\n' || c === '\r') {
          // Skip original newlines in favor of our formatting
          if (c === '\r' && code[i + 1] === '\n') i++;
        } else {
          result += c;
        }
      }
      return result;
    } catch (e) {
      return code;
    }
  }

  function prettyPrintCss(code) {
    try {
      return code
        .replace(/\{/g, ' {\n  ')
        .replace(/\}/g, '\n}\n')
        .replace(/;/g, ';\n  ')
        .replace(/\n\s*\n/g, '\n');
    } catch (e) {
      return code;
    }
  }

  function prettyPrintHtml(code) {
    try {
      var indent = 0;
      return code.replace(/(>)(<)(\/*)/g, '$1\n$2$3').split('\n').map(function (line) {
        line = line.trim();
        if (!line) return '';
        if (line.match(/^<\//)) indent = Math.max(0, indent - 1);
        var result = '  '.repeat(indent) + line;
        if (line.match(/^<[^/!]/) && !line.match(/\/>$/)) indent++;
        return result;
      }).join('\n');
    } catch (e) {
      return code;
    }
  }

  // Search across files
  var sourcesSearchBar = document.getElementById('sources-search-bar');
  var sourcesSearchInput = document.getElementById('sources-search-input');
  var sourcesSearchCount = document.getElementById('sources-search-count');
  var sourcesSearchResults = document.getElementById('sources-search-results');

  document.getElementById('sources-search-toggle').addEventListener('click', function () {
    sourcesSearchBar.classList.toggle('hidden');
    sourcesSearchResults.classList.toggle('hidden');
    if (!sourcesSearchBar.classList.contains('hidden')) {
      sourcesSearchInput.focus();
    }
  });

  var searchDebounce = null;
  sourcesSearchInput.addEventListener('input', function () {
    if (searchDebounce) clearTimeout(searchDebounce);
    searchDebounce = setTimeout(function () {
      searchAcrossFiles(sourcesSearchInput.value);
    }, 300);
  });

  function searchAcrossFiles(query) {
    if (!query || query.length < 2) {
      sourcesSearchResults.innerHTML = '';
      sourcesSearchCount.textContent = '';
      return;
    }
    var results = [];
    var queryLower = query.toLowerCase();
    state.sources.files.forEach(function (file) {
      if (!file.content) return;
      var lines = file.content.split('\n');
      lines.forEach(function (line, lineIdx) {
        if (line.toLowerCase().indexOf(queryLower) !== -1) {
          results.push({ file: file, line: line.trim(), lineNum: lineIdx + 1 });
        }
      });
    });
    sourcesSearchCount.textContent = results.length + ' result' + (results.length !== 1 ? 's' : '');
    sourcesSearchResults.innerHTML = '';
    results.slice(0, 100).forEach(function (r) {
      var item = document.createElement('div');
      item.className = 'search-result-item';
      item.innerHTML = '<span class="search-result-file">' + escapeHtml(getFileName(r.file.url)) + ':' + r.lineNum + '</span>'
        + '<span class="search-result-line">' + highlightSearchMatch(escapeHtml(r.line.substring(0, 200)), query) + '</span>';
      item.addEventListener('click', function () {
        loadSourceFile(r.file);
        setTimeout(function () {
          var lineEls = sourcesCode.querySelectorAll('.code-line');
          if (lineEls[r.lineNum - 1]) {
            lineEls[r.lineNum - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
            lineEls[r.lineNum - 1].style.background = 'rgba(255,255,0,0.15)';
            setTimeout(function () { lineEls[r.lineNum - 1].style.background = ''; }, 3000);
          }
        }, 200);
      });
      sourcesSearchResults.appendChild(item);
    });
  }

  function highlightSearchMatch(text, query) {
    var idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return text.substring(0, idx) + '<mark>' + text.substring(idx, idx + query.length) + '</mark>' + text.substring(idx + query.length);
  }

  // =============================================
  // SYNTAX HIGHLIGHTING
  // =============================================
  function highlightSyntax(line, type) {
    const escaped = escapeHtml(line);
    if (type === 'document') return highlightHtml(escaped);
    if (type === 'stylesheet') return highlightCss(escaped);
    if (type === 'script') return highlightJs(escaped);
    return escaped;
  }

  function highlightHtml(line) {
    line = line.replace(/(&lt;!--.*?--&gt;)/g, '<span class="syntax-comment">$1</span>');
    line = line.replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="syntax-tag">$2</span>');
    line = line.replace(/([\w-]+)(=)(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)/g,
      '<span class="syntax-attr-name">$1</span>$2<span class="syntax-attr-value">$3</span>');
    return line;
  }

  function highlightCss(line) {
    line = line.replace(/(\/\*.*?\*\/)/g, '<span class="syntax-comment">$1</span>');
    line = line.replace(/^([^{:]+)(\{)/, '<span class="syntax-selector">$1</span>$2');
    line = line.replace(/([\w-]+)(\s*:)/g, '<span class="syntax-property">$1</span>$2');
    line = line.replace(/(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)/g, '<span class="syntax-string">$1</span>');
    line = line.replace(/\b(\d+(?:\.\d+)?)(px|em|rem|%|vh|vw|s|ms)?\b/g, '<span class="syntax-number">$1$2</span>');
    return line;
  }

  function highlightJs(line) {
    line = line.replace(/(\/\/.*$)/g, '<span class="syntax-comment">$1</span>');
    line = line.replace(/(&quot;(?:[^&]|&(?!quot;))*?&quot;|&#39;(?:[^&]|&(?!#39;))*?&#39;|`[^`]*?`)/g, '<span class="syntax-string">$1</span>');
    const keywords = ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'new', 'this', 'class', 'extends', 'import', 'export', 'from', 'default', 'try', 'catch', 'finally', 'throw', 'async', 'await', 'typeof', 'instanceof', 'null', 'undefined', 'true', 'false'];
    keywords.forEach(function (kw) {
      line = line.replace(new RegExp('\\b(' + kw + ')\\b', 'g'), '<span class="syntax-keyword">$1</span>');
    });
    line = line.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="syntax-number">$1</span>');
    return line;
  }

  // =============================================
  // APPLICATION PANEL
  // =============================================
  var appDataContainer = document.getElementById('app-data-container');

  // Navigation
  document.querySelectorAll('.app-nav-item').forEach(function (item) {
    item.addEventListener('click', function () {
      document.querySelectorAll('.app-nav-item').forEach(function (i) { i.classList.remove('active'); });
      this.classList.add('active');
      state.application.activeSection = this.dataset.appSection;
      loadApplicationData();
    });
  });

  document.getElementById('app-refresh').addEventListener('click', function () {
    loadApplicationData();
  });

  document.getElementById('app-clear-storage').addEventListener('click', function () {
    if (!state.tabId) return;
    var section = state.application.activeSection;
    if (section === 'cookies') {
      state.application.cookies.forEach(function (c) {
        var url = (c.secure ? 'https://' : 'http://') + c.domain + c.path;
        port.postMessage({ type: 'delete-cookie', tabId: state.tabId, url: url, name: c.name });
      });
    } else if (section === 'localStorage') {
      port.postMessage({ type: 'eval-in-page', tabId: state.tabId, expression: 'localStorage.clear(); "cleared"' });
    } else if (section === 'sessionStorage') {
      port.postMessage({ type: 'eval-in-page', tabId: state.tabId, expression: 'sessionStorage.clear(); "cleared"' });
    }
    setTimeout(loadApplicationData, 300);
  });

  document.getElementById('app-filter').addEventListener('input', function () {
    state.application.filter = this.value.toLowerCase();
    renderApplicationData();
  });

  function loadApplicationData() {
    if (!state.tabId || !port) return;
    var section = state.application.activeSection;
    if (section === 'cookies') {
      loadCookies();
    } else if (section === 'localStorage') {
      port.postMessage({ type: 'get-storage', tabId: state.tabId, storageType: 'localStorage' });
    } else if (section === 'sessionStorage') {
      port.postMessage({ type: 'get-storage', tabId: state.tabId, storageType: 'sessionStorage' });
    }
  }

  function loadCookies() {
    if (!state.tabId || !port) return;
    port.postMessage({ type: 'get-cookies', tabId: state.tabId });
  }

  function handleCookiesData(cookies) {
    state.application.cookies = cookies || [];
    renderApplicationData();
  }

  function handleStorageData(storageType, data) {
    if (storageType === 'localStorage') {
      state.application.localStorage = data || [];
    } else if (storageType === 'sessionStorage') {
      state.application.sessionStorage = data || [];
    }
    renderApplicationData();
  }

  function renderApplicationData() {
    var section = state.application.activeSection;
    var filter = state.application.filter;

    if (section === 'cookies') {
      renderCookiesTable(state.application.cookies, filter);
    } else if (section === 'localStorage') {
      renderStorageTable(state.application.localStorage, filter, 'localStorage');
    } else if (section === 'sessionStorage') {
      renderStorageTable(state.application.sessionStorage, filter, 'sessionStorage');
    }
  }

  function renderCookiesTable(cookies, filter) {
    if (!cookies || cookies.length === 0) {
      appDataContainer.innerHTML = '<div class="sources-placeholder">No cookies found</div>';
      return;
    }
    var filtered = cookies.filter(function (c) {
      if (!filter) return true;
      return (c.name + ' ' + c.value + ' ' + c.domain).toLowerCase().indexOf(filter) !== -1;
    });
    var html = '<table class="app-table"><thead><tr><th>Name</th><th>Value</th><th>Domain</th><th>Path</th><th>Expires</th><th>Size</th><th></th></tr></thead><tbody>';
    filtered.forEach(function (c) {
      var expires = c.expirationDate ? new Date(c.expirationDate * 1000).toLocaleString() : 'Session';
      var size = (c.name.length + (c.value || '').length);
      html += '<tr>';
      html += '<td class="cell-name">' + escapeHtml(c.name) + '</td>';
      html += '<td class="cell-value" title="' + escapeHtml(c.value || '') + '">' + escapeHtml((c.value || '').substring(0, 80)) + '</td>';
      html += '<td>' + escapeHtml(c.domain || '') + '</td>';
      html += '<td>' + escapeHtml(c.path || '') + '</td>';
      html += '<td>' + escapeHtml(expires) + '</td>';
      html += '<td>' + size + '</td>';
      html += '<td><button class="toolbar-btn delete-cookie-btn" data-name="' + escapeHtml(c.name) + '" data-domain="' + escapeHtml(c.domain || '') + '" data-path="' + escapeHtml(c.path || '') + '" data-secure="' + (c.secure ? '1' : '0') + '">✕</button></td>';
      html += '</tr>';
    });
    html += '</tbody></table>';
    appDataContainer.innerHTML = html;

    // Delete cookie buttons
    appDataContainer.querySelectorAll('.delete-cookie-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var name = this.dataset.name;
        var domain = this.dataset.domain;
        var path = this.dataset.path;
        var secure = this.dataset.secure === '1';
        var url = (secure ? 'https://' : 'http://') + domain + path;
        port.postMessage({ type: 'delete-cookie', tabId: state.tabId, url: url, name: name });
      });
    });
  }

  function renderStorageTable(items, filter, storageType) {
    if (!items || items.length === 0) {
      appDataContainer.innerHTML = '<div class="sources-placeholder">No ' + storageType + ' data found</div>';
      return;
    }
    var filtered = items.filter(function (item) {
      if (!filter) return true;
      return (item.key + ' ' + item.value).toLowerCase().indexOf(filter) !== -1;
    });
    var html = '<table class="app-table"><thead><tr><th>Key</th><th>Value</th></tr></thead><tbody>';
    filtered.forEach(function (item) {
      html += '<tr>';
      html += '<td class="cell-name">' + escapeHtml(item.key) + '</td>';
      html += '<td class="cell-value" title="' + escapeHtml(item.value || '') + '">' + escapeHtml((item.value || '').substring(0, 200)) + '</td>';
      html += '</tr>';
    });
    html += '</tbody></table>';
    appDataContainer.innerHTML = html;
  }

  // =============================================
  // UTILITIES
  // =============================================
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

})();
