// Page hooks - Runs in MAIN world (page context)
// Hooks console methods, XHR, fetch, and handles eval requests

(function () {
  'use strict';

  const MARKER = '__devtools_sidebar__';

  // ============================================
  // SPECIAL VARIABLES & STATE
  // ============================================
  var __devtools_last_result__ = undefined;
  var __devtools_selected_element__ = null;
  var __devtools_console_timers__ = {};
  var __devtools_console_counters__ = {};
  var __devtools_group_depth__ = 0;
  var __devtools_blocked_urls__ = []; // URL patterns for request blocking

  // Expose special variables on window for eval access
  Object.defineProperty(window, '$_', {
    get: function () { return __devtools_last_result__; },
    configurable: true
  });
  Object.defineProperty(window, '$0', {
    get: function () { return __devtools_selected_element__; },
    set: function (v) { __devtools_selected_element__ = v; },
    configurable: true
  });
  // Helper: $$(selector) = document.querySelectorAll
  window.$$ = function (selector) { return Array.from(document.querySelectorAll(selector)); };
  // Helper: copy() to clipboard
  window.copy = function (val) {
    var text = typeof val === 'string' ? val : JSON.stringify(val, null, 2);
    navigator.clipboard.writeText(text).catch(function () { });
  };

  // ============================================
  // CONSOLE HOOKS
  // ============================================
  const originalConsole = {};
  const methods = ['log', 'warn', 'error', 'info', 'debug', 'clear', 'table', 'dir', 'count', 'assert', 'trace',
    'group', 'groupCollapsed', 'groupEnd', 'time', 'timeEnd', 'timeLog'];

  methods.forEach(function (method) {
    originalConsole[method] = console[method] ? console[method].bind(console) : function () {};
  });

  function serializeArg(arg, depth) {
    depth = depth || 0;
    if (arg === null) return { type: 'null', value: 'null' };
    if (arg === undefined) return { type: 'undefined', value: 'undefined' };
    if (typeof arg === 'string') return { type: 'string', value: arg };
    if (typeof arg === 'number') return { type: 'number', value: String(arg) };
    if (typeof arg === 'boolean') return { type: 'boolean', value: String(arg) };
    if (typeof arg === 'symbol') return { type: 'symbol', value: String(arg) };
    if (typeof arg === 'function') return { type: 'function', value: 'f ' + (arg.name || 'anonymous') + '()' };
    if (arg instanceof Error) return { type: 'error', value: arg.stack || arg.message || String(arg) };
    if (arg instanceof HTMLElement) return { type: 'html', value: arg.outerHTML.substring(0, 500) };
    if (arg instanceof RegExp) return { type: 'regexp', value: String(arg) };
    if (arg instanceof Date) return { type: 'date', value: arg.toISOString() };
    if (arg instanceof Map) {
      var mapObj = {};
      try { arg.forEach(function (v, k) { mapObj[String(k)] = serializeArg(v, depth + 1); }); } catch (e) {}
      return { type: 'map', value: 'Map(' + arg.size + ')', preview: 'Map(' + arg.size + ')', children: mapObj, expandable: depth < 3 };
    }
    if (arg instanceof Set) {
      var setArr = [];
      try { arg.forEach(function (v) { setArr.push(serializeArg(v, depth + 1)); }); } catch (e) {}
      return { type: 'set', value: 'Set(' + arg.size + ')', preview: 'Set(' + arg.size + ')', items: setArr, expandable: depth < 3 };
    }
    if (Array.isArray(arg)) {
      if (depth < 3) {
        var arrItems = [];
        try {
          for (var i = 0; i < Math.min(arg.length, 50); i++) {
            arrItems.push(serializeArg(arg[i], depth + 1));
          }
        } catch (e) {}
        var preview = '(' + arg.length + ') [' + arg.slice(0, 5).map(function (v) {
          try { return typeof v === 'string' ? '"' + v.substring(0, 30) + '"' : String(v).substring(0, 30); } catch (e) { return '?'; }
        }).join(', ') + (arg.length > 5 ? ', ...' : '') + ']';
        return { type: 'array', value: preview, preview: preview, items: arrItems, length: arg.length, expandable: true };
      }
      try { return { type: 'array', value: JSON.stringify(arg, null, 2).substring(0, 5000) }; }
      catch (e) { return { type: 'array', value: String(arg) }; }
    }
    if (typeof arg === 'object') {
      if (depth < 3) {
        var children = {};
        var keys = [];
        try { keys = Object.keys(arg); } catch (e) {}
        var preview = '{' + keys.slice(0, 5).map(function (k) {
          try {
            var v = arg[k];
            var vs = typeof v === 'string' ? '"' + v.substring(0, 20) + '"' : typeof v === 'object' && v !== null ? (Array.isArray(v) ? 'Array(' + v.length + ')' : '{...}') : String(v).substring(0, 30);
            return k + ': ' + vs;
          } catch (e) { return k + ': ?'; }
        }).join(', ') + (keys.length > 5 ? ', ...' : '') + '}';
        try {
          for (var j = 0; j < Math.min(keys.length, 100); j++) {
            children[keys[j]] = serializeArg(arg[keys[j]], depth + 1);
          }
        } catch (e) {}
        var ctorName = '';
        try { ctorName = arg.constructor && arg.constructor.name !== 'Object' ? arg.constructor.name + ' ' : ''; } catch (e) {}
        return { type: 'object', value: ctorName + preview, preview: ctorName + preview, children: children, expandable: keys.length > 0 };
      }
      try { return { type: 'object', value: JSON.stringify(arg, null, 2).substring(0, 5000) }; }
      catch (e) { return { type: 'object', value: String(arg) }; }
    }
    return { type: 'string', value: String(arg) };
  }

  function getCallStack() {
    try { throw new Error(); } catch (e) {
      var lines = (e.stack || '').split('\n');
      for (var i = 4; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line && line.indexOf('page-hooks') === -1) return line;
      }
      return lines[4] ? lines[4].trim() : '';
    }
  }

  methods.forEach(function (method) {
    if (method === 'clear') {
      console.clear = function () {
        originalConsole.clear();
        window.postMessage({ __devtools_sidebar__: true, type: 'console', method: 'clear' }, '*');
      };
      return;
    }
    if (method === 'group' || method === 'groupCollapsed') {
      console[method] = function () {
        var args = Array.from(arguments);
        originalConsole[method] ? originalConsole[method].apply(console, args) : null;
        __devtools_group_depth__++;
        window.postMessage({
          __devtools_sidebar__: true, type: 'console', method: method,
          args: args.length > 0 ? args.map(serializeArg) : [{ type: 'string', value: 'console.group' }],
          source: getCallStack(), timestamp: Date.now(), groupDepth: __devtools_group_depth__
        }, '*');
      };
      return;
    }
    if (method === 'groupEnd') {
      console.groupEnd = function () {
        originalConsole.groupEnd ? originalConsole.groupEnd() : null;
        window.postMessage({
          __devtools_sidebar__: true, type: 'console', method: 'groupEnd',
          args: [], source: '', timestamp: Date.now(), groupDepth: __devtools_group_depth__
        }, '*');
        __devtools_group_depth__ = Math.max(0, __devtools_group_depth__ - 1);
      };
      return;
    }
    if (method === 'time') {
      console.time = function (label) {
        label = label || 'default';
        originalConsole.time ? originalConsole.time(label) : null;
        __devtools_console_timers__[label] = performance.now();
      };
      return;
    }
    if (method === 'timeEnd') {
      console.timeEnd = function (label) {
        label = label || 'default';
        originalConsole.timeEnd ? originalConsole.timeEnd(label) : null;
        var start = __devtools_console_timers__[label];
        if (start !== undefined) {
          var elapsed = performance.now() - start;
          delete __devtools_console_timers__[label];
          window.postMessage({
            __devtools_sidebar__: true, type: 'console', method: 'timeEnd',
            args: [{ type: 'string', value: label + ': ' + elapsed.toFixed(3) + 'ms' }],
            source: getCallStack(), timestamp: Date.now()
          }, '*');
        }
      };
      return;
    }
    if (method === 'timeLog') {
      console.timeLog = function (label) {
        label = label || 'default';
        originalConsole.timeLog ? originalConsole.timeLog.apply(console, arguments) : null;
        var start = __devtools_console_timers__[label];
        if (start !== undefined) {
          var elapsed = performance.now() - start;
          window.postMessage({
            __devtools_sidebar__: true, type: 'console', method: 'log',
            args: [{ type: 'string', value: label + ': ' + elapsed.toFixed(3) + 'ms' }],
            source: getCallStack(), timestamp: Date.now()
          }, '*');
        }
      };
      return;
    }
    console[method] = function () {
      var args = Array.from(arguments);
      originalConsole[method].apply(console, args);
      window.postMessage({
        __devtools_sidebar__: true, type: 'console', method: method,
        args: args.map(serializeArg), source: getCallStack(), timestamp: Date.now(),
        groupDepth: __devtools_group_depth__
      }, '*');
    };
  });

  // ============================================
  // UNCAUGHT ERRORS
  // ============================================
  window.addEventListener('error', function (event) {
    window.postMessage({
      __devtools_sidebar__: true, type: 'console', method: 'error',
      args: [{ type: 'error', value: 'Uncaught ' + (event.error ? (event.error.stack || event.error.message) : event.message) }],
      source: event.filename + ':' + event.lineno + ':' + event.colno, timestamp: Date.now()
    }, '*');
  });

  window.addEventListener('unhandledrejection', function (event) {
    var reason = event.reason;
    var value;
    if (reason instanceof Error) value = 'Uncaught (in promise) ' + (reason.stack || reason.message);
    else { try { value = 'Uncaught (in promise) ' + JSON.stringify(reason); } catch (e) { value = 'Uncaught (in promise) ' + String(reason); } }
    window.postMessage({
      __devtools_sidebar__: true, type: 'console', method: 'error',
      args: [{ type: 'error', value: value }], source: '', timestamp: Date.now()
    }, '*');
  });

  // ============================================
  // PERFORMANCE TIMING HELPER
  // ============================================
  function getPerformanceTiming(url) {
    try {
      var entries = performance.getEntriesByName(url, 'resource');
      if (!entries || entries.length === 0) return null;
      var e = entries[entries.length - 1]; // most recent
      var timing = {};
      timing.blocked = Math.round(Math.max(0, (e.connectStart || e.startTime) - e.startTime));
      timing.dns = Math.round(Math.max(0, (e.domainLookupEnd || 0) - (e.domainLookupStart || 0)));
      timing.connect = Math.round(Math.max(0, (e.connectEnd || 0) - (e.connectStart || 0)));
      timing.ssl = Math.round(Math.max(0, (e.connectEnd || 0) - (e.secureConnectionStart || e.connectEnd || 0)));
      timing.send = Math.round(Math.max(0, (e.responseStart || 0) - (e.requestStart || 0)));
      timing.wait = Math.round(Math.max(0, (e.responseStart || 0) - (e.requestStart || e.startTime)));
      timing.receive = Math.round(Math.max(0, (e.responseEnd || 0) - (e.responseStart || 0)));
      timing.total = Math.round(Math.max(0, (e.responseEnd || 0) - e.startTime));
      timing.transferSize = e.transferSize || 0;
      timing.encodedBodySize = e.encodedBodySize || 0;
      timing.decodedBodySize = e.decodedBodySize || 0;
      return timing;
    } catch (err) {
      return null;
    }
  }

  // ============================================
  // XHR HOOKS
  // ============================================
  var origXHROpen = XMLHttpRequest.prototype.open;
  var origXHRSend = XMLHttpRequest.prototype.send;
  var origXHRSetHeader = XMLHttpRequest.prototype.setRequestHeader;

  XMLHttpRequest.prototype.open = function (method, url) {
    this.__dt_info__ = { method: method, url: String(url), startTime: 0, requestHeaders: {}, type: 'xhr' };
    return origXHROpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
    if (this.__dt_info__) this.__dt_info__.requestHeaders[name] = value;
    return origXHRSetHeader.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function (body) {
    if (this.__dt_info__) {
      var info = this.__dt_info__;
      info.startTime = performance.now();
      info.requestBody = body ? String(body).substring(0, 2000) : null;
      var xhr = this;
      xhr.addEventListener('loadend', function () {
        var endTime = performance.now();
        var responseHeaders = {};
        try {
          xhr.getAllResponseHeaders().split('\r\n').forEach(function (h) {
            var i = h.indexOf(':');
            if (i > 0) responseHeaders[h.substring(0, i).trim()] = h.substring(i + 1).trim();
          });
        } catch (e) { }
        var responseBody = '';
        try {
          if (xhr.responseType === '' || xhr.responseType === 'text') responseBody = xhr.responseText.substring(0, 10000);
          else if (xhr.responseType === 'json') responseBody = JSON.stringify(xhr.response).substring(0, 10000);
          else responseBody = '[' + xhr.responseType + ' response]';
        } catch (e) { responseBody = '[Unable to read]'; }
        var ct = responseHeaders['content-type'] || '';
        var rt = 'xhr';
        if (ct.indexOf('json') !== -1) rt = 'fetch';
        else if (ct.indexOf('javascript') !== -1) rt = 'script';
        else if (ct.indexOf('css') !== -1) rt = 'stylesheet';
        else if (ct.indexOf('html') !== -1) rt = 'document';
        else if (ct.indexOf('image') !== -1) rt = 'image';
        else if (ct.indexOf('font') !== -1) rt = 'font';
        // Get performance timing if available
        var timingDetail = getPerformanceTiming(info.url);
        window.postMessage({
          __devtools_sidebar__: true, type: 'network', data: {
            url: info.url, method: info.method, status: xhr.status, statusText: xhr.statusText,
            requestHeaders: info.requestHeaders, requestBody: info.requestBody,
            responseHeaders: responseHeaders, responseBody: responseBody, resourceType: rt,
            size: responseHeaders['content-length'] ? parseInt(responseHeaders['content-length']) : (responseBody ? responseBody.length : 0),
            time: Math.round(endTime - info.startTime), initiator: 'XMLHttpRequest', timestamp: Date.now(),
            timing: timingDetail
          }
        }, '*');
      });
    }
    return origXHRSend.apply(this, arguments);
  };

  // ============================================
  // FETCH HOOKS
  // ============================================
  var origFetch = window.fetch;
  window.fetch = function () {
    var args = Array.from(arguments);
    var input = args[0];
    var init = args[1] || {};
    var url = '', method = 'GET', requestHeaders = {}, requestBody = null;
    if (typeof input === 'string') url = input;
    else if (input instanceof URL) url = input.href;
    else if (input instanceof Request) { url = input.url; method = input.method; }
    if (init.method) method = init.method;
    if (init.headers) {
      if (init.headers instanceof Headers) init.headers.forEach(function (v, k) { requestHeaders[k] = v; });
      else if (typeof init.headers === 'object') requestHeaders = Object.assign({}, init.headers);
    }
    if (init.body) { try { requestBody = String(init.body).substring(0, 2000); } catch (e) { requestBody = '[body]'; } }
    var startTime = performance.now();
    return origFetch.apply(window, args).then(function (response) {
      var endTime = performance.now();
      var cloned = response.clone();
      var rh = {};
      response.headers.forEach(function (v, k) { rh[k] = v; });
      var ct = rh['content-type'] || '';
      var rt = 'fetch';
      if (ct.indexOf('javascript') !== -1) rt = 'script';
      else if (ct.indexOf('css') !== -1) rt = 'stylesheet';
      else if (ct.indexOf('html') !== -1) rt = 'document';
      else if (ct.indexOf('image') !== -1) rt = 'image';
      else if (ct.indexOf('font') !== -1) rt = 'font';
      else if (ct.indexOf('json') !== -1) rt = 'fetch';
      cloned.text().then(function (body) {
        var timingDetail = getPerformanceTiming(url);
        window.postMessage({
          __devtools_sidebar__: true, type: 'network', data: {
            url: url, method: method.toUpperCase(), status: response.status, statusText: response.statusText,
            requestHeaders: requestHeaders, requestBody: requestBody, responseHeaders: rh,
            responseBody: (body || '').substring(0, 10000), resourceType: rt,
            size: rh['content-length'] ? parseInt(rh['content-length']) : (body ? body.length : 0),
            time: Math.round(endTime - startTime), initiator: 'fetch', timestamp: Date.now(),
            timing: timingDetail
          }
        }, '*');
      }).catch(function () { });
      return response;
    }).catch(function (error) {
      var endTime = performance.now();
      window.postMessage({
        __devtools_sidebar__: true, type: 'network', data: {
          url: url, method: method.toUpperCase(), status: 0, statusText: 'Failed',
          requestHeaders: requestHeaders, requestBody: requestBody, responseHeaders: {},
          responseBody: error.message || String(error), resourceType: 'fetch', size: 0,
          time: Math.round(endTime - startTime), initiator: 'fetch', timestamp: Date.now(), error: true
        }
      }, '*');
      throw error;
    });
  };

  // ============================================
  // WEBSOCKET HOOKS
  // ============================================
  var OrigWebSocket = window.WebSocket;
  window.WebSocket = function (url, protocols) {
    var ws = protocols ? new OrigWebSocket(url, protocols) : new OrigWebSocket(url);
    var wsId = 'ws_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

    window.postMessage({
      __devtools_sidebar__: true, type: 'websocket', action: 'open',
      data: { id: wsId, url: String(url), protocols: protocols ? String(protocols) : '', timestamp: Date.now() }
    }, '*');

    ws.addEventListener('message', function (event) {
      var data = '';
      try { data = typeof event.data === 'string' ? event.data.substring(0, 5000) : '[Binary ' + (event.data.byteLength || event.data.size || 0) + ' bytes]'; }
      catch (e) { data = '[Unable to read]'; }
      window.postMessage({
        __devtools_sidebar__: true, type: 'websocket', action: 'message',
        data: { id: wsId, url: String(url), direction: 'received', data: data, timestamp: Date.now() }
      }, '*');
    });

    var origSend = ws.send.bind(ws);
    ws.send = function (data) {
      var d = '';
      try { d = typeof data === 'string' ? data.substring(0, 5000) : '[Binary ' + (data.byteLength || data.size || 0) + ' bytes]'; }
      catch (e) { d = '[Unable to read]'; }
      window.postMessage({
        __devtools_sidebar__: true, type: 'websocket', action: 'message',
        data: { id: wsId, url: String(url), direction: 'sent', data: d, timestamp: Date.now() }
      }, '*');
      return origSend(data);
    };

    ws.addEventListener('close', function (event) {
      window.postMessage({
        __devtools_sidebar__: true, type: 'websocket', action: 'close',
        data: { id: wsId, url: String(url), code: event.code, reason: event.reason, timestamp: Date.now() }
      }, '*');
    });

    ws.addEventListener('error', function () {
      window.postMessage({
        __devtools_sidebar__: true, type: 'websocket', action: 'error',
        data: { id: wsId, url: String(url), timestamp: Date.now() }
      }, '*');
    });

    return ws;
  };
  window.WebSocket.prototype = OrigWebSocket.prototype;
  window.WebSocket.CONNECTING = OrigWebSocket.CONNECTING;
  window.WebSocket.OPEN = OrigWebSocket.OPEN;
  window.WebSocket.CLOSING = OrigWebSocket.CLOSING;
  window.WebSocket.CLOSED = OrigWebSocket.CLOSED;

  // ============================================
  // REQUEST BLOCKING
  // ============================================
  window.addEventListener('message', function (event) {
    if (event.source !== window || !event.data) return;
    if (event.data.__devtools_set_blocked_urls__) {
      __devtools_blocked_urls__ = event.data.urls || [];
    }
    if (event.data.__devtools_set_selected_element__) {
      try {
        __devtools_selected_element__ = document.querySelector(event.data.selector);
      } catch (e) { /* ignore */ }
    }
  });

  function isUrlBlocked(url) {
    if (!__devtools_blocked_urls__ || __devtools_blocked_urls__.length === 0) return false;
    return __devtools_blocked_urls__.some(function (pattern) {
      if (!pattern) return false;
      // Simple glob matching: * matches anything
      var regex = new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$', 'i');
      return regex.test(url);
    });
  }

  // Wrap fetch to support blocking
  var _prevFetch = window.fetch;
  window.fetch = function () {
    var args = Array.from(arguments);
    var input = args[0];
    var url = '';
    if (typeof input === 'string') url = input;
    else if (input instanceof URL) url = input.href;
    else if (input instanceof Request) url = input.url;
    if (isUrlBlocked(url)) {
      window.postMessage({
        __devtools_sidebar__: true, type: 'network', data: {
          url: url, method: (args[1] && args[1].method) || 'GET', status: 0, statusText: 'Blocked',
          requestHeaders: {}, requestBody: null, responseHeaders: {}, responseBody: '(blocked by DevTools)',
          resourceType: 'fetch', size: 0, time: 0, initiator: 'fetch', timestamp: Date.now(), blocked: true
        }
      }, '*');
      return Promise.reject(new TypeError('Request blocked by DevTools: ' + url));
    }
    return _prevFetch.apply(window, args);
  };

  // Wrap XHR send to support blocking
  var _prevXHRSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (body) {
    if (this.__dt_info__ && isUrlBlocked(this.__dt_info__.url)) {
      window.postMessage({
        __devtools_sidebar__: true, type: 'network', data: {
          url: this.__dt_info__.url, method: this.__dt_info__.method, status: 0, statusText: 'Blocked',
          requestHeaders: this.__dt_info__.requestHeaders || {}, requestBody: null, responseHeaders: {},
          responseBody: '(blocked by DevTools)', resourceType: 'xhr', size: 0, time: 0,
          initiator: 'XMLHttpRequest', timestamp: Date.now(), blocked: true
        }
      }, '*');
      // Simulate network error
      var self = this;
      setTimeout(function () {
        var evt = new ProgressEvent('error');
        self.dispatchEvent(evt);
        var loadEnd = new ProgressEvent('loadend');
        self.dispatchEvent(loadEnd);
      }, 0);
      return;
    }
    return _prevXHRSend.apply(this, arguments);
  };

  // ============================================
  // EVAL HANDLER (from sidebar panel)
  // ============================================
  window.addEventListener('message', function (event) {
    if (event.source !== window) return;
    if (!event.data || event.data.__devtools_eval_request__ !== true) return;
    var result, isError = false;
    try { result = eval(event.data.expression); __devtools_last_result__ = result; } catch (e) { result = e.message || String(e); isError = true; }
    var serialized;
    if (isError) { serialized = { type: 'error', value: String(result) }; }
    else if (result === null) { serialized = { type: 'null', value: 'null' }; }
    else if (result === undefined) { serialized = { type: 'undefined', value: 'undefined' }; }
    else if (typeof result === 'object') {
      try { serialized = { type: 'object', value: JSON.stringify(result, null, 2).substring(0, 10000) }; }
      catch (e) { serialized = { type: 'string', value: String(result) }; }
    } else {
      serialized = { type: typeof result, value: String(result) };
    }
    window.postMessage({ __devtools_eval_response__: true, id: event.data.id, result: serialized, isError: isError }, '*');
  });

  // ============================================
  // INITIAL PAGE RESOURCE CAPTURE
  // ============================================
  // Capture the initial navigation and sub-resources via Performance API
  function captureInitialResources() {
    try {
      var entries = performance.getEntriesByType('navigation');
      if (entries.length > 0) {
        var nav = entries[0];
        window.postMessage({
          __devtools_sidebar__: true, type: 'network', data: {
            url: nav.name || window.location.href,
            method: 'GET',
            status: 200,
            statusText: 'OK',
            requestHeaders: {},
            requestBody: null,
            responseHeaders: {},
            responseBody: null,
            resourceType: 'document',
            size: nav.transferSize || 0,
            time: Math.round(nav.responseEnd - nav.requestStart) || 0,
            initiator: 'navigation',
            timestamp: Date.now() - Math.round(performance.now()),
            timing: {
              dns: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
              connect: Math.round(nav.connectEnd - nav.connectStart),
              ssl: nav.secureConnectionStart > 0 ? Math.round(nav.connectEnd - nav.secureConnectionStart) : 0,
              ttfb: Math.round(nav.responseStart - nav.requestStart),
              download: Math.round(nav.responseEnd - nav.responseStart),
              total: Math.round(nav.responseEnd - nav.requestStart)
            }
          }
        }, '*');
      }
      // Also capture sub-resources (CSS, JS, images, fonts)
      var resources = performance.getEntriesByType('resource');
      resources.forEach(function (r) {
        var rt = 'other';
        var t = r.initiatorType || '';
        if (t === 'script') rt = 'script';
        else if (t === 'link' || t === 'css') rt = 'stylesheet';
        else if (t === 'img') rt = 'image';
        else if (t === 'font') rt = 'font';
        else if (t === 'fetch' || t === 'xmlhttprequest') return; // Already captured by hooks
        window.postMessage({
          __devtools_sidebar__: true, type: 'network', data: {
            url: r.name,
            method: 'GET',
            status: 200,
            statusText: 'OK',
            requestHeaders: {},
            requestBody: null,
            responseHeaders: {},
            responseBody: null,
            resourceType: rt,
            size: r.transferSize || r.encodedBodySize || 0,
            time: Math.round(r.responseEnd - r.startTime) || 0,
            initiator: t || 'other',
            timestamp: Date.now() - Math.round(performance.now() - r.startTime),
            timing: {
              dns: Math.round(r.domainLookupEnd - r.domainLookupStart),
              connect: Math.round(r.connectEnd - r.connectStart),
              ssl: r.secureConnectionStart > 0 ? Math.round(r.connectEnd - r.secureConnectionStart) : 0,
              ttfb: Math.round(r.responseStart - r.requestStart),
              download: Math.round(r.responseEnd - r.responseStart),
              total: Math.round(r.responseEnd - r.startTime)
            }
          }
        }, '*');
      });
    } catch (e) {
      // Performance API not available
    }
  }
  // Run after page is loaded
  if (document.readyState === 'complete') {
    setTimeout(captureInitialResources, 500);
  } else {
    window.addEventListener('load', function () {
      setTimeout(captureInitialResources, 500);
    });
  }

})();
