/**
 * Initial resource capture using the Performance API.
 * Captures the navigation entry and all sub-resources loaded before the hooks.
 */

import { MARKER } from '@/shared/constants';

export function captureInitialResources(): void {
  try {
    // Navigation entry
    const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (entries.length > 0) {
      const nav = entries[0];
      window.postMessage(
        {
          [MARKER]: true,
          type: 'network',
          data: {
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
              ssl:
                nav.secureConnectionStart > 0
                  ? Math.round(nav.connectEnd - nav.secureConnectionStart)
                  : 0,
              ttfb: Math.round(nav.responseStart - nav.requestStart),
              download: Math.round(nav.responseEnd - nav.responseStart),
              total: Math.round(nav.responseEnd - nav.requestStart),
            },
          },
        },
        '*'
      );
    }

    // Sub-resources
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    resources.forEach((r) => {
      let rt = 'other';
      const t = r.initiatorType || '';
      if (t === 'script') rt = 'script';
      else if (t === 'link' || t === 'css') rt = 'stylesheet';
      else if (t === 'img') rt = 'image';
      else if (t === 'font') rt = 'font';
      else if (t === 'fetch' || t === 'xmlhttprequest') return; // Already captured by hooks

      window.postMessage(
        {
          [MARKER]: true,
          type: 'network',
          data: {
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
              ssl:
                r.secureConnectionStart > 0
                  ? Math.round(r.connectEnd - r.secureConnectionStart)
                  : 0,
              ttfb: Math.round(r.responseStart - r.requestStart),
              download: Math.round(r.responseEnd - r.responseStart),
              total: Math.round(r.responseEnd - r.startTime),
            },
          },
        },
        '*'
      );
    });
  } catch {
    // Performance API not available
  }
}
