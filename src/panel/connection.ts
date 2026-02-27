/**
 * Connection manager — handles the port to the background service worker.
 */

import { PORT_NAME } from '@/shared/constants';
import type { PanelToBackgroundMessage } from '@/shared/types';

let port: chrome.runtime.Port | null = null;
let portReconnectTimer: ReturnType<typeof setTimeout> | null = null;
let messageHandler: ((message: unknown) => void) | null = null;
let reconnectCallback: (() => void) | null = null;

export function connectPort(): void {
  try {
    port = (chrome.runtime.connect as any)({ name: PORT_NAME });
    port!.onDisconnect.addListener(() => {
      port = null;
      if (portReconnectTimer) clearTimeout(portReconnectTimer);
      portReconnectTimer = setTimeout(() => {
        connectPort();
        reconnectCallback?.();
      }, 1000);
    });
    port!.onMessage.addListener((message) => {
      messageHandler?.(message);
    });
  } catch {
    if (portReconnectTimer) clearTimeout(portReconnectTimer);
    portReconnectTimer = setTimeout(connectPort, 2000);
  }
}

export function onPortMessage(handler: (message: unknown) => void): void {
  messageHandler = handler;
}

export function onReconnect(callback: () => void): void {
  reconnectCallback = callback;
}

export function sendMessage(message: PanelToBackgroundMessage): void {
  port?.postMessage(message);
}

export function getPort(): chrome.runtime.Port | null {
  return port;
}
