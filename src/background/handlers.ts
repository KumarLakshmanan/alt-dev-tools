import { safeSendToTab } from './messaging';
import type { PanelToBackgroundMessage } from '@/shared/types';

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
