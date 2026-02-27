/**
 * Request blocking — intercepts fetch/XHR and blocks URLs matching patterns.
 */

import { MARKER } from '@/shared/constants';

let blockedUrls: string[] = [];

export function initRequestBlocking(): void {
  // Listen for blocked URL updates from panel
  window.addEventListener('message', (event: MessageEvent) => {
    if (event.source !== window || !event.data) return;
    if (event.data.__devtools_set_blocked_urls__) {
      blockedUrls = event.data.urls || [];
    }
  });

  wrapFetchBlocking();
  wrapXhrBlocking();
}

function isUrlBlocked(url: string): boolean {
  if (!blockedUrls || blockedUrls.length === 0) return false;
  return blockedUrls.some((pattern) => {
    if (!pattern) return false;
    const regex = new RegExp(
      '^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$',
      'i'
    );
    return regex.test(url);
  });
}

function wrapFetchBlocking(): void {
  const prevFetch = window.fetch;
  window.fetch = function (...args: Parameters<typeof fetch>) {
    const input = args[0];
    let url = '';
    if (typeof input === 'string') url = input;
    else if (input instanceof URL) url = input.href;
    else if (input instanceof Request) url = input.url;

    if (isUrlBlocked(url)) {
      window.postMessage(
        {
          [MARKER]: true,
          type: 'network',
          data: {
            url,
            method: (args[1]?.method) || 'GET',
            status: 0,
            statusText: 'Blocked',
            requestHeaders: {},
            requestBody: null,
            responseHeaders: {},
            responseBody: '(blocked by DevTools)',
            resourceType: 'fetch',
            size: 0,
            time: 0,
            initiator: 'fetch',
            timestamp: Date.now(),
            blocked: true,
          },
        },
        '*'
      );
      return Promise.reject(new TypeError('Request blocked by DevTools: ' + url));
    }
    return prevFetch.apply(window, args);
  };
}

function wrapXhrBlocking(): void {
  const prevXHRSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
    const info = (this as XMLHttpRequest & { __dt_info__?: { url: string; method: string; requestHeaders: Record<string, string> } }).__dt_info__;
    if (info && isUrlBlocked(info.url)) {
      window.postMessage(
        {
          [MARKER]: true,
          type: 'network',
          data: {
            url: info.url,
            method: info.method,
            status: 0,
            statusText: 'Blocked',
            requestHeaders: info.requestHeaders || {},
            requestBody: null,
            responseHeaders: {},
            responseBody: '(blocked by DevTools)',
            resourceType: 'xhr',
            size: 0,
            time: 0,
            initiator: 'XMLHttpRequest',
            timestamp: Date.now(),
            blocked: true,
          },
        },
        '*'
      );
      const self = this;
      setTimeout(() => {
        self.dispatchEvent(new ProgressEvent('error'));
        self.dispatchEvent(new ProgressEvent('loadend'));
      }, 0);
      return;
    }
    return prevXHRSend.apply(this, [body] as Parameters<typeof prevXHRSend>);
  };
}
