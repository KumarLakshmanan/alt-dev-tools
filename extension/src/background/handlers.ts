import { safeSendToTab } from './messaging';
import type { PanelToBackgroundMessage, IndexedDBDatabase, CacheStorageData, ServiceWorkerData, WebManifestData } from '@/shared/types';

/**
 * Handle cookie-related messages from the panel.
 */
export function handleCookiesMessage(
  message: PanelToBackgroundMessage,
  tabId: number,
  panelPort: chrome.runtime.Port | null
): void {
  if (message.type === 'get-cookies') {
    chrome.tabs.get(tabId, (tab) => {
      if ((chrome.runtime as any).lastError || !tab || !tab.url) {
        panelPort?.postMessage({ type: 'cookies-data', data: [] });
        return;
      }
      const url = tab.url;
      if (
        url.startsWith('chrome://') ||
        url.startsWith('about:') ||
        url.startsWith('chrome-extension://')
      ) {
        panelPort?.postMessage({ type: 'cookies-data', data: [] });
        return;
      }
      try {
        chrome.cookies.getAll({ url }, (cookies) => {
          if ((chrome.runtime as any).lastError) {
            panelPort?.postMessage({ type: 'cookies-data', data: [] });
            return;
          }
          panelPort?.postMessage({ type: 'cookies-data', data: cookies || [] });
        });
      } catch {
        panelPort?.postMessage({ type: 'cookies-data', data: [] });
      }
    });
  }

  if (message.type === 'delete-cookie') {
    chrome.cookies.remove({ url: message.url, name: message.name }, () => {
      panelPort?.postMessage({ type: 'cookie-deleted', name: message.name });
    });
  }
}

/**
 * Handle storage-related messages from the panel.
 */
export function handleStorageMessage(
  message: PanelToBackgroundMessage,
  tabId: number,
  panelPort: chrome.runtime.Port | null
): void {
  if (message.type !== 'get-storage') return;

  const storageType = message.storageType;
  const expression = `(function(){ try { var s = ${storageType}; var items = []; for (var i = 0; i < s.length; i++) { var k = s.key(i); var v = s.getItem(k); items.push({key: k, value: v ? v.substring(0, 1000) : ""}); } return JSON.stringify(items); } catch(e) { return "[]"; } })()`;

  safeSendToTab(tabId, { type: 'eval-in-page', expression }, (response: unknown) => {
    if (!panelPort) return;
    let data: { key: string; value: string }[] = [];
    try {
      const resp = response as { result?: { value?: string } } | null;
      if (resp?.result?.value) {
        let val = resp.result.value;
        if (typeof val === 'string') {
          // Handle double-encoded JSON
          if (val.charAt(0) === '"' && val.charAt(val.length - 1) === '"') {
            val = JSON.parse(val);
          }
          data = JSON.parse(val);
        }
      }
    } catch {
      // Fallback: leave data as empty
    }
    panelPort.postMessage({ type: 'storage-data', storageType, data });
  });
}

/**
 * Handle IndexedDB data request — uses executeScript with async function.
 */
export function handleIndexedDBMessage(
  tabId: number,
  panelPort: chrome.runtime.Port | null
): void {
  chrome.scripting.executeScript(
    {
      target: { tabId },
      world: 'MAIN',
      func: (async () => {
        try {
          const dbInfos = await window.indexedDB.databases();
          const result: { name: string; version: number; stores: string[] }[] = [];
          for (const dbInfo of dbInfos) {
            try {
              const db: IDBDatabase = await new Promise((res, rej) => {
                const req = window.indexedDB.open(dbInfo.name ?? '', dbInfo.version);
                req.onsuccess = () => res(req.result);
                req.onerror = () => rej(req.error);
              });
              result.push({ name: dbInfo.name ?? '', version: dbInfo.version ?? 0, stores: Array.from(db.objectStoreNames) });
              db.close();
            } catch {
              result.push({ name: dbInfo.name ?? '', version: dbInfo.version ?? 0, stores: [] });
            }
          }
          return result;
        } catch { return []; }
      }) as unknown as () => void,
      args: [],
    }
  ).then((results) => {
    const data = (results?.[0]?.result as IndexedDBDatabase[]) || [];
    panelPort?.postMessage({ type: 'indexeddb-data', data });
  }).catch(() => {
    panelPort?.postMessage({ type: 'indexeddb-data', data: [] });
  });
}

/**
 * Handle CacheStorage data request.
 */
export function handleCacheStorageMessage(
  tabId: number,
  panelPort: chrome.runtime.Port | null
): void {
  chrome.scripting.executeScript(
    {
      target: { tabId },
      world: 'MAIN',
      func: (async () => {
        try {
          const names = await caches.keys();
          const result: { name: string; size: number; entries: { url: string; method: string }[] }[] = [];
          for (const name of names) {
            try {
              const cache = await caches.open(name);
              const requests = await cache.keys();
              result.push({ name, size: requests.length, entries: requests.slice(0, 50).map((r) => ({ url: r.url, method: r.method })) });
            } catch {
              result.push({ name, size: 0, entries: [] });
            }
          }
          return result;
        } catch { return []; }
      }) as unknown as () => void,
      args: [],
    }
  ).then((results) => {
    const data = (results?.[0]?.result as CacheStorageData[]) || [];
    panelPort?.postMessage({ type: 'cache-data', data });
  }).catch(() => {
    panelPort?.postMessage({ type: 'cache-data', data: [] });
  });
}

/**
 * Handle Service Workers data request.
 */
export function handleServiceWorkersMessage(
  tabId: number,
  panelPort: chrome.runtime.Port | null
): void {
  chrome.scripting.executeScript(
    {
      target: { tabId },
      world: 'MAIN',
      func: (async () => {
        try {
          if (!navigator.serviceWorker) return [];
          const registrations = await navigator.serviceWorker.getRegistrations();
          return registrations.map((r) => ({
            scope: r.scope,
            scriptURL: r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || '',
            state: r.active ? 'activated' : r.installing ? 'installing' : r.waiting ? 'waiting' : 'unknown',
            updateViaCache: r.updateViaCache,
          }));
        } catch { return []; }
      }) as unknown as () => void,
      args: [],
    }
  ).then((results) => {
    const data = (results?.[0]?.result as ServiceWorkerData[]) || [];
    panelPort?.postMessage({ type: 'service-workers-data', data });
  }).catch(() => {
    panelPort?.postMessage({ type: 'service-workers-data', data: [] });
  });
}

/**
 * Handle Web App Manifest data request.
 */
export function handleManifestMessage(
  tabId: number,
  panelPort: chrome.runtime.Port | null
): void {
  chrome.scripting.executeScript(
    {
      target: { tabId },
      world: 'MAIN',
      func: (async () => {
        try {
          const link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
          if (!link) return null;
          const href = link.href;
          const response = await fetch(href);
          const data = await response.json() as Record<string, unknown>;
          return { url: href, ...data };
        } catch (e) {
          const link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
          return link ? { url: link.href, error: String(e) } : null;
        }
      }) as unknown as () => void,
      args: [],
    }
  ).then((results) => {
    const data = (results?.[0]?.result as WebManifestData) || null;
    panelPort?.postMessage({ type: 'manifest-data', data });
  }).catch(() => {
    panelPort?.postMessage({ type: 'manifest-data', data: null });
  });
}

