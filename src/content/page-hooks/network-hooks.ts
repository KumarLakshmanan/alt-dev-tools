/**
 * Network hooks — intercept XHR, Fetch, and WebSocket calls
 * and forward request/response data to the devtools panel.
 */

import { MARKER } from '@/shared/constants';
import { MAX_RESPONSE_BODY_LENGTH, MAX_REQUEST_BODY_LENGTH } from '@/shared/constants';

// =============================================
// PERFORMANCE TIMING HELPER
// =============================================

interface PerformanceTimingDetail {
  blocked: number;
  dns: number;
  connect: number;
  ssl: number;
  send: number;
  wait: number;
  receive: number;
  total: number;
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
}

function getPerformanceTiming(url: string): PerformanceTimingDetail | null {
  try {
    const entries = performance.getEntriesByName(url, 'resource') as PerformanceResourceTiming[];
    if (!entries || entries.length === 0) return null;
    const e = entries[entries.length - 1];
    return {
      blocked: Math.round(Math.max(0, (e.connectStart || e.startTime) - e.startTime)),
      dns: Math.round(Math.max(0, (e.domainLookupEnd || 0) - (e.domainLookupStart || 0))),
      connect: Math.round(Math.max(0, (e.connectEnd || 0) - (e.connectStart || 0))),
      ssl: Math.round(Math.max(0, (e.connectEnd || 0) - (e.secureConnectionStart || e.connectEnd || 0))),
      send: Math.round(Math.max(0, (e.responseStart || 0) - (e.requestStart || 0))),
      wait: Math.round(Math.max(0, (e.responseStart || 0) - (e.requestStart || e.startTime))),
      receive: Math.round(Math.max(0, (e.responseEnd || 0) - (e.responseStart || 0))),
      total: Math.round(Math.max(0, (e.responseEnd || 0) - e.startTime)),
      transferSize: e.transferSize || 0,
      encodedBodySize: e.encodedBodySize || 0,
      decodedBodySize: e.decodedBodySize || 0,
    };
  } catch {
    return null;
  }
}

function guessResourceType(contentType: string): string {
  if (contentType.includes('json')) return 'fetch';
  if (contentType.includes('javascript')) return 'script';
  if (contentType.includes('css')) return 'stylesheet';
  if (contentType.includes('html')) return 'document';
  if (contentType.includes('image')) return 'image';
  if (contentType.includes('font')) return 'font';
  return 'xhr';
}

// =============================================
// XHR HOOKS
// =============================================

interface XhrInfo {
  method: string;
  url: string;
  startTime: number;
  requestHeaders: Record<string, string>;
  requestBody: string | null;
  type: string;
}

const origXHROpen = XMLHttpRequest.prototype.open;
const origXHRSend = XMLHttpRequest.prototype.send;
const origXHRSetHeader = XMLHttpRequest.prototype.setRequestHeader;

export function hookXHR(): void {
  XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...rest: unknown[]) {
    (this as XMLHttpRequest & { __dt_info__: XhrInfo }).__dt_info__ = {
      method,
      url: String(url),
      startTime: 0,
      requestHeaders: {},
      requestBody: null,
      type: 'xhr',
    };
    return origXHROpen.apply(this, [method, url, ...rest] as Parameters<typeof origXHROpen>);
  };

  XMLHttpRequest.prototype.setRequestHeader = function (name: string, value: string) {
    const info = (this as XMLHttpRequest & { __dt_info__?: XhrInfo }).__dt_info__;
    if (info) info.requestHeaders[name] = value;
    return origXHRSetHeader.apply(this, [name, value]);
  };

  XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
    const info = (this as XMLHttpRequest & { __dt_info__?: XhrInfo }).__dt_info__;
    if (info) {
      info.startTime = performance.now();
      info.requestBody = body ? String(body).substring(0, MAX_REQUEST_BODY_LENGTH) : null;

      const xhr = this;
      xhr.addEventListener('loadend', () => {
        const endTime = performance.now();
        const responseHeaders: Record<string, string> = {};
        try {
          xhr.getAllResponseHeaders().split('\r\n').forEach((h) => {
            const i = h.indexOf(':');
            if (i > 0) responseHeaders[h.substring(0, i).trim()] = h.substring(i + 1).trim();
          });
        } catch { /* ignore */ }

        let responseBody = '';
        try {
          if (xhr.responseType === '' || xhr.responseType === 'text') {
            responseBody = xhr.responseText.substring(0, MAX_RESPONSE_BODY_LENGTH);
          } else if (xhr.responseType === 'json') {
            responseBody = JSON.stringify(xhr.response).substring(0, MAX_RESPONSE_BODY_LENGTH);
          } else {
            responseBody = `[${xhr.responseType} response]`;
          }
        } catch {
          responseBody = '[Unable to read]';
        }

        const ct = responseHeaders['content-type'] || '';
        const rt = guessResourceType(ct);
        const timingDetail = getPerformanceTiming(info.url);

        window.postMessage(
          {
            [MARKER]: true,
            type: 'network',
            data: {
              url: info.url,
              method: info.method,
              status: xhr.status,
              statusText: xhr.statusText,
              requestHeaders: info.requestHeaders,
              requestBody: info.requestBody,
              responseHeaders,
              responseBody,
              resourceType: rt,
              size: responseHeaders['content-length']
                ? parseInt(responseHeaders['content-length'])
                : responseBody.length,
              time: Math.round(endTime - info.startTime),
              initiator: 'XMLHttpRequest',
              timestamp: Date.now(),
              timing: timingDetail,
            },
          },
          '*'
        );
      });
    }
    return origXHRSend.apply(this, [body] as Parameters<typeof origXHRSend>);
  };
}

// =============================================
// FETCH HOOKS
// =============================================

const origFetch = window.fetch;

export function hookFetch(): void {
  window.fetch = function (...args: Parameters<typeof fetch>) {
    const input = args[0];
    const init = args[1] || {};
    let url = '';
    let method = 'GET';
    const requestHeaders: Record<string, string> = {};
    let requestBody: string | null = null;

    if (typeof input === 'string') url = input;
    else if (input instanceof URL) url = input.href;
    else if (input instanceof Request) {
      url = input.url;
      method = input.method;
    }
    if (init.method) method = init.method;
    if (init.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((v, k) => {
          requestHeaders[k] = v;
        });
      } else if (typeof init.headers === 'object') {
        Object.assign(requestHeaders, init.headers);
      }
    }
    if (init.body) {
      try {
        requestBody = String(init.body).substring(0, MAX_REQUEST_BODY_LENGTH);
      } catch {
        requestBody = '[body]';
      }
    }

    const startTime = performance.now();

    return origFetch
      .apply(window, args)
      .then((response: Response) => {
        const endTime = performance.now();
        const cloned = response.clone();
        const rh: Record<string, string> = {};
        response.headers.forEach((v, k) => {
          rh[k] = v;
        });

        const ct = rh['content-type'] || '';
        let rt = 'fetch';
        if (ct.includes('javascript')) rt = 'script';
        else if (ct.includes('css')) rt = 'stylesheet';
        else if (ct.includes('html')) rt = 'document';
        else if (ct.includes('image')) rt = 'image';
        else if (ct.includes('font')) rt = 'font';

        cloned.text().then((body) => {
          const timingDetail = getPerformanceTiming(url);
          window.postMessage(
            {
              [MARKER]: true,
              type: 'network',
              data: {
                url,
                method: method.toUpperCase(),
                status: response.status,
                statusText: response.statusText,
                requestHeaders,
                requestBody,
                responseHeaders: rh,
                responseBody: (body || '').substring(0, MAX_RESPONSE_BODY_LENGTH),
                resourceType: rt,
                size: rh['content-length'] ? parseInt(rh['content-length']) : body.length,
                time: Math.round(endTime - startTime),
                initiator: 'fetch',
                timestamp: Date.now(),
                timing: timingDetail,
              },
            },
            '*'
          );
        }).catch(() => {});

        return response;
      })
      .catch((error: Error) => {
        const endTime = performance.now();
        window.postMessage(
          {
            [MARKER]: true,
            type: 'network',
            data: {
              url,
              method: method.toUpperCase(),
              status: 0,
              statusText: 'Failed',
              requestHeaders,
              requestBody,
              responseHeaders: {},
              responseBody: error.message || String(error),
              resourceType: 'fetch',
              size: 0,
              time: Math.round(endTime - startTime),
              initiator: 'fetch',
              timestamp: Date.now(),
              error: true,
            },
          },
          '*'
        );
        throw error;
      });
  };
}

// =============================================
// WEBSOCKET HOOKS
// =============================================

const OrigWebSocket = window.WebSocket;

export function hookWebSocket(): void {
  (window as unknown as { WebSocket: unknown }).WebSocket = function (
    url: string | URL,
    protocols?: string | string[]
  ) {
    const ws = protocols ? new OrigWebSocket(url, protocols) : new OrigWebSocket(url);
    const wsId = `ws_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    window.postMessage(
      {
        [MARKER]: true,
        type: 'websocket',
        action: 'open',
        data: {
          id: wsId,
          url: String(url),
          protocols: protocols ? String(protocols) : '',
          timestamp: Date.now(),
        },
      },
      '*'
    );

    ws.addEventListener('message', (event) => {
      let data = '';
      try {
        data =
          typeof event.data === 'string'
            ? event.data.substring(0, 5000)
            : `[Binary ${(event.data as { byteLength?: number; size?: number }).byteLength || (event.data as { size?: number }).size || 0} bytes]`;
      } catch {
        data = '[Unable to read]';
      }
      window.postMessage(
        {
          [MARKER]: true,
          type: 'websocket',
          action: 'message',
          data: { id: wsId, url: String(url), direction: 'received', data, timestamp: Date.now() },
        },
        '*'
      );
    });

    const origSend = ws.send.bind(ws);
    ws.send = function (data: string | ArrayBufferLike | Blob | ArrayBufferView) {
      let d = '';
      try {
        d =
          typeof data === 'string'
            ? data.substring(0, 5000)
            : `[Binary ${(data as { byteLength?: number; size?: number }).byteLength || (data as { size?: number }).size || 0} bytes]`;
      } catch {
        d = '[Unable to read]';
      }
      window.postMessage(
        {
          [MARKER]: true,
          type: 'websocket',
          action: 'message',
          data: { id: wsId, url: String(url), direction: 'sent', data: d, timestamp: Date.now() },
        },
        '*'
      );
      return origSend(data);
    };

    ws.addEventListener('close', (event) => {
      window.postMessage(
        {
          [MARKER]: true,
          type: 'websocket',
          action: 'close',
          data: { id: wsId, url: String(url), code: event.code, reason: event.reason, timestamp: Date.now() },
        },
        '*'
      );
    });

    ws.addEventListener('error', () => {
      window.postMessage(
        {
          [MARKER]: true,
          type: 'websocket',
          action: 'error',
          data: { id: wsId, url: String(url), timestamp: Date.now() },
        },
        '*'
      );
    });

    return ws;
  } as unknown as typeof WebSocket;

  (window.WebSocket as unknown as Record<string, unknown>).prototype = OrigWebSocket.prototype;
  (window.WebSocket as unknown as Record<string, unknown>).CONNECTING = OrigWebSocket.CONNECTING;
  (window.WebSocket as unknown as Record<string, unknown>).OPEN = OrigWebSocket.OPEN;
  (window.WebSocket as unknown as Record<string, unknown>).CLOSING = OrigWebSocket.CLOSING;
  (window.WebSocket as unknown as Record<string, unknown>).CLOSED = OrigWebSocket.CLOSED;
}
