/**
 * Page Hooks — Runs in MAIN world (page context).
 * Hooks console methods, XHR, fetch, WebSocket, and handles eval requests.
 *
 * This is the entry point that composes all page-hook modules.
 */

import { hookConsole } from './page-hooks/console-hooks';
import { hookXHR, hookFetch, hookWebSocket } from './page-hooks/network-hooks';
import { hookErrors } from './page-hooks/error-hooks';
import { initRequestBlocking } from './page-hooks/request-blocking';
import { initEvalHandler } from './page-hooks/eval-handler';
import { captureInitialResources } from './page-hooks/resource-capture';
import { hookEventListeners } from './page-hooks/event-listener-hooks';

// Initialize all hooks
hookConsole();
hookXHR();
hookFetch();
hookWebSocket();
hookErrors();
initRequestBlocking();
initEvalHandler();
hookEventListeners();

// Capture initial resources after page load
if (document.readyState === 'complete') {
  setTimeout(captureInitialResources, 500);
} else {
  window.addEventListener('load', () => {
    setTimeout(captureInitialResources, 500);
  });
}
