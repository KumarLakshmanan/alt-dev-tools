// Content script - Bridge between page hooks and extension
// Also handles DOM inspection, highlighting, and computed styles

(function () {
  'use strict';

  // ============================================
  // MESSAGE BRIDGE: page (MAIN world) → content → background
  // ============================================
  var pendingEvalCallbacks = {};

  window.addEventListener('message', function (event) {
    if (event.source !== window) return;
    if (!event.data) return;

    // Forward console/network from page hooks to background
    if (event.data.__devtools_sidebar__) {
      try {
        chrome.runtime.sendMessage(event.data);
      } catch (e) {
        // Extension context invalidated
      }
    }

    // Forward eval responses to pending handler
    if (event.data.__devtools_eval_response__ && pendingEvalCallbacks[event.data.id]) {
      pendingEvalCallbacks[event.data.id](event.data);
      delete pendingEvalCallbacks[event.data.id];
    }
  });

  // ============================================
  // HANDLE MESSAGES FROM BACKGROUND/PANEL
  // ============================================
  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    // Evaluate expression in page context
    if (message.type === 'eval-in-page') {
      var id = 'eval_' + Date.now() + '_' + Math.random();
      pendingEvalCallbacks[id] = function (response) {
        sendResponse(response);
      };
      window.postMessage({ __devtools_eval_request__: true, expression: message.expression, id: id }, '*');
      setTimeout(function () {
        if (pendingEvalCallbacks[id]) {
          pendingEvalCallbacks[id]({ result: { type: 'error', value: 'Evaluation timed out' }, isError: true });
          delete pendingEvalCallbacks[id];
        }
      }, 5000);
      return true; // async
    }

    // Get page sources
    if (message.type === 'get-page-sources') {
      var sources = [];
      sources.push({ url: window.location.href, type: 'document', content: document.documentElement.outerHTML });
      document.querySelectorAll('link[rel="stylesheet"]').forEach(function (link) {
        sources.push({ url: link.href, type: 'stylesheet', content: null });
      });
      document.querySelectorAll('style').forEach(function (style, idx) {
        sources.push({ url: window.location.href + '#inline-style-' + idx, type: 'stylesheet', content: style.textContent });
      });
      document.querySelectorAll('script[src]').forEach(function (script) {
        sources.push({ url: script.src, type: 'script', content: null });
      });
      document.querySelectorAll('script:not([src])').forEach(function (script, idx) {
        if (script.textContent.trim()) {
          sources.push({ url: window.location.href + '#inline-script-' + idx, type: 'script', content: script.textContent });
        }
      });
      sendResponse(sources);
      return true;
    }

    // Get DOM tree
    if (message.type === 'get-dom-tree') {
      try {
        // Wait for document to be ready if needed
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', function () {
            try {
              var tree = serializeNode(document.documentElement, 0);
              sendResponse(tree);
            } catch (e2) {
              sendResponse({ nodeType: 1, tagName: 'html', attributes: {}, children: [{ nodeType: -1, textContent: 'Error: ' + e2.message }], selector: 'html' });
            }
          });
        } else {
          var tree = serializeNode(document.documentElement, 0);
          sendResponse(tree);
        }
      } catch (e) {
        sendResponse({ nodeType: 1, tagName: 'html', attributes: {}, children: [{ nodeType: -1, textContent: 'Error: ' + e.message }], selector: 'html' });
      }
      return true;
    }

    // Highlight element
    if (message.type === 'highlight-element') {
      try {
        removeHighlight();
        var el = document.querySelector(message.selector);
        if (el) {
          var rect = el.getBoundingClientRect();
          var overlay = document.createElement('div');
          overlay.id = '__devtools_highlight__';
          overlay.style.cssText = 'position:fixed;z-index:2147483647;pointer-events:none;'
            + 'background:rgba(111,168,220,0.33);border:1px solid rgba(111,168,220,0.8);'
            + 'top:' + rect.top + 'px;left:' + rect.left + 'px;width:' + rect.width + 'px;height:' + rect.height + 'px;'
            + 'transition:all 0.05s;';
          document.body.appendChild(overlay);
        }
      } catch (e) { /* ignore */ }
      return false;
    }

    // Remove highlight
    if (message.type === 'unhighlight-element') {
      removeHighlight();
      return false;
    }

    // Get element computed styles
    if (message.type === 'get-element-styles') {
      try {
        var el = document.querySelector(message.selector);
        if (el) {
          var computed = window.getComputedStyle(el);
          var styles = {};
          var important = ['display', 'position', 'width', 'height',
            'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
            'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
            'border', 'border-width', 'border-style', 'border-color', 'border-radius',
            'background', 'background-color', 'color', 'font-family', 'font-size', 'font-weight',
            'line-height', 'text-align', 'overflow', 'opacity', 'z-index',
            'top', 'right', 'bottom', 'left', 'flex', 'flex-direction', 'justify-content', 'align-items',
            'grid-template-columns', 'grid-template-rows', 'gap', 'box-shadow', 'transform', 'transition'];
          important.forEach(function (prop) {
            var val = computed.getPropertyValue(prop);
            if (val && val !== 'none' && val !== 'normal' && val !== 'auto' && val !== '0px' && val !== 'rgba(0, 0, 0, 0)') {
              styles[prop] = val;
            }
          });
          var boxModel = {
            width: el.offsetWidth,
            height: el.offsetHeight,
            margin: {
              top: parseFloat(computed.marginTop) || 0,
              right: parseFloat(computed.marginRight) || 0,
              bottom: parseFloat(computed.marginBottom) || 0,
              left: parseFloat(computed.marginLeft) || 0
            },
            padding: {
              top: parseFloat(computed.paddingTop) || 0,
              right: parseFloat(computed.paddingRight) || 0,
              bottom: parseFloat(computed.paddingBottom) || 0,
              left: parseFloat(computed.paddingLeft) || 0
            },
            border: {
              top: parseFloat(computed.borderTopWidth) || 0,
              right: parseFloat(computed.borderRightWidth) || 0,
              bottom: parseFloat(computed.borderBottomWidth) || 0,
              left: parseFloat(computed.borderLeftWidth) || 0
            }
          };
          sendResponse({ styles: styles, boxModel: boxModel, tagName: el.tagName.toLowerCase(), id: el.id, className: el.className });
        } else {
          sendResponse(null);
        }
      } catch (e) {
        sendResponse(null);
      }
      return true;
    }

    // Inspect mode
    if (message.type === 'start-inspect-mode') {
      startInspectMode();
      return false;
    }

    if (message.type === 'stop-inspect-mode') {
      stopInspectMode();
      return false;
    }

    return false;
  });

  // ============================================
  // DOM TREE SERIALIZATION
  // ============================================
  function serializeNode(node, depth) {
    if (!node) return null;
    if (depth > 15) return null;

    var result = {
      nodeType: node.nodeType,
      tagName: null,
      id: null,
      className: null,
      attributes: {},
      textContent: null,
      children: [],
      selector: ''
    };

    try {
      result.tagName = node.tagName ? node.tagName.toLowerCase() : null;
      result.id = node.id || null;
      result.className = node.className && typeof node.className === 'string' ? node.className : null;
      result.selector = getUniqueSelector(node);
    } catch (e) {
      // SVG elements or exotic nodes may throw
    }

    if (node.nodeType === Node.TEXT_NODE) {
      var text = '';
      try { text = node.textContent.trim(); } catch (e) { return null; }
      if (text) result.textContent = text.substring(0, 200);
      else return null;
      return result;
    }

    if (node.nodeType === Node.COMMENT_NODE) {
      try {
        result.textContent = '<!-- ' + node.textContent.substring(0, 100) + ' -->';
      } catch (e) {
        result.textContent = '<!-- comment -->';
      }
      return result;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    // Skip invisible metadata nodes for cleaner tree
    var tag = result.tagName;
    if (tag === 'script' || tag === 'noscript' || tag === 'link' || tag === 'meta') {
      // Still include them but don't recurse into children
      try {
        if (node.attributes) {
          for (var i = 0; i < node.attributes.length; i++) {
            var attr = node.attributes[i];
            result.attributes[attr.name] = (attr.value || '').substring(0, 200);
          }
        }
      } catch (e) { /* ignore */ }
      return result;
    }

    try {
      if (node.attributes) {
        for (var i = 0; i < node.attributes.length; i++) {
          var attr = node.attributes[i];
          result.attributes[attr.name] = (attr.value || '').substring(0, 200);
        }
      }
    } catch (e) { /* ignore exotic elements */ }

    var maxChildren = 100;
    var childCount = 0;
    try {
      for (var j = 0; j < node.childNodes.length && childCount < maxChildren; j++) {
        var childResult = serializeNode(node.childNodes[j], depth + 1);
        if (childResult) {
          result.children.push(childResult);
          childCount++;
        }
      }
      if (node.childNodes.length > maxChildren) {
        result.children.push({ nodeType: -1, textContent: '... ' + (node.childNodes.length - maxChildren) + ' more nodes' });
      }
    } catch (e) {
      result.children.push({ nodeType: -1, textContent: '... error reading children: ' + e.message });
    }

    return result;
  }

  function getUniqueSelector(el) {
    try {
      if (!el || el.nodeType !== Node.ELEMENT_NODE) return '';
      if (el === document.body) return 'body';
      if (el === document.documentElement) return 'html';
      if (el.id) return '#' + CSS.escape(el.id);

      var path = el.tagName.toLowerCase();
      if (el.className && typeof el.className === 'string' && el.className.trim()) {
        var cls = el.className.trim().split(/\s+/).slice(0, 2).map(function (c) {
          try { return '.' + CSS.escape(c); } catch (e) { return ''; }
        }).filter(Boolean).join('');
        path += cls;
      }

      var parent = el.parentElement;
      if (parent) {
        var siblings = Array.from(parent.children).filter(function (c) { return c.tagName === el.tagName; });
        if (siblings.length > 1) {
          var index = siblings.indexOf(el) + 1;
          path += ':nth-of-type(' + index + ')';
        }
        path = getUniqueSelector(parent) + ' > ' + path;
      }
      return path;
    } catch (e) {
      return '';
    }
  }

  // ============================================
  // ELEMENT HIGHLIGHT
  // ============================================
  function removeHighlight() {
    var existing = document.getElementById('__devtools_highlight__');
    if (existing) existing.remove();
  }

  // ============================================
  // INSPECT MODE (element picker)
  // ============================================
  var inspectModeActive = false;
  var inspectOverlay = null;
  var inspectTooltip = null;

  function startInspectMode() {
    if (inspectModeActive) return;
    inspectModeActive = true;

    inspectOverlay = document.createElement('div');
    inspectOverlay.id = '__devtools_inspect_overlay__';
    inspectOverlay.style.cssText = 'position:fixed;z-index:2147483646;pointer-events:none;'
      + 'border:2px solid #1a73e8;background:rgba(66,133,244,0.15);display:none;transition:all 0.05s;';
    document.body.appendChild(inspectOverlay);

    inspectTooltip = document.createElement('div');
    inspectTooltip.id = '__devtools_inspect_tooltip__';
    inspectTooltip.style.cssText = 'position:fixed;z-index:2147483647;pointer-events:none;'
      + 'background:#1a1a2e;color:#e0e0e0;font:11px/1.4 monospace;padding:4px 8px;border-radius:3px;'
      + 'box-shadow:0 2px 8px rgba(0,0,0,0.5);display:none;white-space:nowrap;max-width:400px;overflow:hidden;text-overflow:ellipsis;';
    document.body.appendChild(inspectTooltip);

    document.addEventListener('mousemove', inspectMouseMove, true);
    document.addEventListener('click', inspectClick, true);
    document.addEventListener('keydown', inspectKeyDown, true);
  }

  function stopInspectMode() {
    inspectModeActive = false;
    document.removeEventListener('mousemove', inspectMouseMove, true);
    document.removeEventListener('click', inspectClick, true);
    document.removeEventListener('keydown', inspectKeyDown, true);
    if (inspectOverlay) { inspectOverlay.remove(); inspectOverlay = null; }
    if (inspectTooltip) { inspectTooltip.remove(); inspectTooltip = null; }
  }

  function inspectMouseMove(e) {
    if (!inspectModeActive) return;
    var target = e.target;
    if (!target || target === inspectOverlay || target === inspectTooltip) return;
    if (target.id === '__devtools_highlight__' || target.id === '__devtools_inspect_overlay__' || target.id === '__devtools_inspect_tooltip__') return;

    var rect = target.getBoundingClientRect();
    if (inspectOverlay) {
      inspectOverlay.style.display = 'block';
      inspectOverlay.style.top = rect.top + 'px';
      inspectOverlay.style.left = rect.left + 'px';
      inspectOverlay.style.width = rect.width + 'px';
      inspectOverlay.style.height = rect.height + 'px';
    }

    if (inspectTooltip) {
      var label = target.tagName.toLowerCase();
      if (target.id) label += '#' + target.id;
      if (target.className && typeof target.className === 'string') {
        label += '.' + target.className.trim().split(/\s+/).slice(0, 3).join('.');
      }
      var dims = Math.round(rect.width) + ' \u00D7 ' + Math.round(rect.height);
      inspectTooltip.textContent = label + '  ' + dims;
      inspectTooltip.style.display = 'block';
      var tooltipTop = rect.top - 28;
      if (tooltipTop < 4) tooltipTop = rect.bottom + 4;
      inspectTooltip.style.top = tooltipTop + 'px';
      inspectTooltip.style.left = Math.max(4, rect.left) + 'px';
    }
  }

  function inspectClick(e) {
    if (!inspectModeActive) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    var target = e.target;
    if (!target || target === inspectOverlay || target === inspectTooltip) return;

    var selector = getUniqueSelector(target);
    stopInspectMode();

    try {
      chrome.runtime.sendMessage({
        type: 'inspect-element-selected',
        selector: selector,
        tagName: target.tagName.toLowerCase(),
        id: target.id || '',
        className: (target.className && typeof target.className === 'string') ? target.className : ''
      });
    } catch (e) { /* ignore */ }
  }

  function inspectKeyDown(e) {
    if (e.key === 'Escape') {
      stopInspectMode();
      try {
        chrome.runtime.sendMessage({ type: 'inspect-mode-cancelled' });
      } catch (e) { /* ignore */ }
    }
  }

  // ============================================
  // LIVE DOM UPDATES (MutationObserver)
  // ============================================
  var domObserver = null;
  var domObserverDebounce = null;

  function startDomObserver() {
    if (domObserver) return;
    domObserver = new MutationObserver(function (mutations) {
      if (domObserverDebounce) clearTimeout(domObserverDebounce);
      domObserverDebounce = setTimeout(function () {
        var summary = [];
        mutations.forEach(function (m) {
          if (m.type === 'childList') {
            summary.push({ type: 'childList', target: getUniqueSelector(m.target), added: m.addedNodes.length, removed: m.removedNodes.length });
          } else if (m.type === 'attributes') {
            summary.push({ type: 'attributes', target: getUniqueSelector(m.target), attr: m.attributeName });
          } else if (m.type === 'characterData') {
            summary.push({ type: 'characterData', target: getUniqueSelector(m.target) });
          }
        });
        try {
          chrome.runtime.sendMessage({ type: 'dom-mutation', mutations: summary.slice(0, 50) });
        } catch (e) { /* extension context invalidated */ }
      }, 300);
    });
    domObserver.observe(document.documentElement, {
      childList: true, subtree: true, attributes: true, characterData: true
    });
  }

  function stopDomObserver() {
    if (domObserver) {
      domObserver.disconnect();
      domObserver = null;
    }
  }

  // Auto-start observer
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startDomObserver);
  } else {
    startDomObserver();
  }

  // ============================================
  // EVENT LISTENERS EXTRACTION
  // ============================================
  function getEventListeners(selector) {
    try {
      var el = document.querySelector(selector);
      if (!el) return [];
      // Use Chrome's getEventListeners if available (only in DevTools context)
      // Fallback: walk known event attribute properties
      var listeners = [];
      var eventTypes = ['click', 'dblclick', 'mousedown', 'mouseup', 'mouseover', 'mouseout', 'mousemove',
        'keydown', 'keyup', 'keypress', 'focus', 'blur', 'change', 'input', 'submit', 'reset',
        'scroll', 'resize', 'load', 'unload', 'error', 'contextmenu', 'touchstart', 'touchend',
        'touchmove', 'pointerdown', 'pointerup', 'pointermove', 'wheel', 'dragstart', 'drag',
        'dragend', 'drop', 'dragover', 'dragenter', 'dragleave', 'animationstart', 'animationend',
        'transitionend'];
      eventTypes.forEach(function (type) {
        // Check inline handler
        var handler = el.getAttribute('on' + type);
        if (handler) {
          listeners.push({ type: type, source: 'attribute', handler: handler.substring(0, 200), useCapture: false });
        }
        // Check property handler
        if (typeof el['on' + type] === 'function') {
          var fn = el['on' + type];
          listeners.push({ type: type, source: 'property', handler: (fn.name || 'anonymous') + '()', useCapture: false });
        }
      });
      // Check data attributes that suggest frameworks
      if (el.dataset) {
        Object.keys(el.dataset).forEach(function (key) {
          if (key.startsWith('on') || key.startsWith('v-on') || key.startsWith('ng-')) {
            listeners.push({ type: key, source: 'data-attr', handler: el.dataset[key].substring(0, 200), useCapture: false });
          }
        });
      }
      return listeners;
    } catch (e) {
      return [];
    }
  }

  // ============================================
  // FORCE ELEMENT STATE
  // ============================================
  var forcedStates = {}; // selector → Set of pseudoClasses

  function forceElementState(selector, pseudoClass, enable) {
    try {
      var el = document.querySelector(selector);
      if (!el) return false;
      if (!forcedStates[selector]) forcedStates[selector] = new Set();
      var styleId = '__devtools_forced_' + pseudoClass.replace(':', '') + '__';
      if (enable) {
        forcedStates[selector].add(pseudoClass);
        // Apply by adding a special class that mimics the state
        el.classList.add('__devtools_force_' + pseudoClass.replace(':', ''));
        // Inject CSS rule that copies pseudo-class styles
        var existing = document.getElementById(styleId);
        if (!existing) {
          var style = document.createElement('style');
          style.id = styleId;
          style.textContent = '.__devtools_force_' + pseudoClass.replace(':', '') + ' { }';
          document.head.appendChild(style);
        }
      } else {
        forcedStates[selector].delete(pseudoClass);
        el.classList.remove('__devtools_force_' + pseudoClass.replace(':', ''));
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  // ============================================
  // COPY ELEMENT AS HTML / SELECTOR
  // ============================================
  function getElementHtml(selector) {
    try {
      var el = document.querySelector(selector);
      if (!el) return null;
      return el.outerHTML;
    } catch (e) {
      return null;
    }
  }

  function getElementSelector(selector) {
    try {
      var el = document.querySelector(selector);
      if (!el) return null;
      return getUniqueSelector(el);
    } catch (e) {
      return null;
    }
  }

  // ============================================
  // SCROLL INTO VIEW
  // ============================================
  function scrollElementIntoView(selector) {
    try {
      var el = document.querySelector(selector);
      if (!el) return false;
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      // Flash highlight
      var prev = el.style.outline;
      el.style.outline = '2px solid #1a73e8';
      setTimeout(function () { el.style.outline = prev; }, 1500);
      return true;
    } catch (e) {
      return false;
    }
  }

  // ============================================
  // ADD / REMOVE HTML NODES
  // ============================================
  function deleteElement(selector) {
    try {
      var el = document.querySelector(selector);
      if (!el) return false;
      el.remove();
      return true;
    } catch (e) {
      return false;
    }
  }

  function addHtmlAdjacentTo(selector, position, html) {
    try {
      var el = document.querySelector(selector);
      if (!el) return false;
      el.insertAdjacentHTML(position, html); // beforebegin, afterbegin, beforeend, afterend
      return true;
    } catch (e) {
      return false;
    }
  }

  function editElementOuterHtml(selector, newHtml) {
    try {
      var el = document.querySelector(selector);
      if (!el) return false;
      el.outerHTML = newHtml;
      return true;
    } catch (e) {
      return false;
    }
  }

  // ============================================
  // ADDITIONAL MESSAGE HANDLERS
  // ============================================
  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.type === 'get-event-listeners') {
      sendResponse(getEventListeners(message.selector));
      return true;
    }
    if (message.type === 'force-element-state') {
      sendResponse(forceElementState(message.selector, message.pseudoClass, message.enable));
      return true;
    }
    if (message.type === 'copy-element-html') {
      sendResponse(getElementHtml(message.selector));
      return true;
    }
    if (message.type === 'copy-element-selector') {
      sendResponse(getElementSelector(message.selector));
      return true;
    }
    if (message.type === 'scroll-into-view') {
      sendResponse(scrollElementIntoView(message.selector));
      return true;
    }
    if (message.type === 'delete-element') {
      sendResponse(deleteElement(message.selector));
      return true;
    }
    if (message.type === 'add-html-adjacent') {
      sendResponse(addHtmlAdjacentTo(message.selector, message.position, message.html));
      return true;
    }
    if (message.type === 'edit-outer-html') {
      sendResponse(editElementOuterHtml(message.selector, message.html));
      return true;
    }
    if (message.type === 'start-dom-observer') {
      startDomObserver();
      return false;
    }
    if (message.type === 'stop-dom-observer') {
      stopDomObserver();
      return false;
    }
    return false;
  });

})();
