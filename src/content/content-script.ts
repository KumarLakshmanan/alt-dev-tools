/**
 * Content Script — Bridge between page hooks (MAIN world) and extension.
 * Also handles DOM inspection, highlighting, computed styles, and mutations.
 */

import { serializeNode } from './dom-serializer';
import { highlightElement, removeHighlight } from './highlight';
import { startInspectMode, stopInspectMode } from './inspect-mode';
import { startDomObserver, stopDomObserver } from './dom-observer';
import { getElementStyles } from './styles';
import { collectPageSources } from './sources';
import {
  getEventListeners,
  forceElementState,
  getElementHtml,
  getElementSelector,
  scrollElementIntoView,
  deleteElement,
  addHtmlAdjacentTo,
  editElementOuterHtml,
} from './element-helpers';

// =============================================
// CONTEXT GUARD
// =============================================

/** Returns true if the extension context is still valid */
function isContextValid(): boolean {
  try { return !!chrome.runtime.id; } catch { return false; }
}

// Stop DOM observer and unregister listeners if the context becomes invalid.
// This prevents "Extension context invalidated" uncaught errors on hot-reload.
const contextCheckInterval = setInterval(() => {
  if (!isContextValid()) {
    clearInterval(contextCheckInterval);
    stopDomObserver();
  }
}, 2000);

// =============================================
// MESSAGE BRIDGE: page (MAIN world) → content → background
// =============================================

const pendingEvalCallbacks: Record<string, (response: unknown) => void> = {};

window.addEventListener('message', (event: MessageEvent) => {
  if (event.source !== window || !event.data) return;

  // Forward console/network from page hooks to background
  if (event.data.__devtools_sidebar__) {
    try {
      chrome.runtime.sendMessage(event.data);
    } catch {
      // Extension context invalidated
    }
  }

  // Forward eval responses to pending handler
  if (event.data.__devtools_eval_response__ && pendingEvalCallbacks[event.data.id]) {
    pendingEvalCallbacks[event.data.id](event.data);
    delete pendingEvalCallbacks[event.data.id];
  }
});

// =============================================
// MESSAGE HANDLER FROM BACKGROUND / PANEL
// =============================================

chrome.runtime.onMessage.addListener(
  (message: { type: string; [key: string]: unknown }, _sender, sendResponse) => {
    if (!isContextValid()) return false;
    try {
      switch (message.type) {
        case 'eval-in-page': {
          const id = `eval_${Date.now()}_${Math.random()}`;
        pendingEvalCallbacks[id] = (response) => sendResponse(response);
        window.postMessage(
          { __devtools_eval_request__: true, expression: message.expression, id },
          '*'
        );
        setTimeout(() => {
          if (pendingEvalCallbacks[id]) {
            pendingEvalCallbacks[id]({
              result: { type: 'error', value: 'Evaluation timed out' },
              isError: true,
            });
            delete pendingEvalCallbacks[id];
          }
        }, 5000);
        return true; // async
      }

      case 'get-page-sources':
        sendResponse(collectPageSources());
        return true;

      case 'get-dom-tree':
        try {
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
              try {
                sendResponse(serializeNode(document.documentElement, 0));
              } catch (e) {
                sendResponse({
                  nodeType: 1,
                  tagName: 'html',
                  attributes: {},
                  children: [{ nodeType: -1, textContent: 'Error: ' + (e as Error).message }],
                  selector: 'html',
                });
              }
            });
          } else {
            sendResponse(serializeNode(document.documentElement, 0));
          }
        } catch (e) {
          sendResponse({
            nodeType: 1,
            tagName: 'html',
            attributes: {},
            children: [{ nodeType: -1, textContent: 'Error: ' + (e as Error).message }],
            selector: 'html',
          });
        }
        return true;

      case 'highlight-element':
        highlightElement(message.selector as string);
        return false;

      case 'unhighlight-element':
        removeHighlight();
        return false;

      case 'get-element-styles':
        sendResponse(getElementStyles(message.selector as string));
        return true;

      case 'start-inspect-mode':
        startInspectMode();
        return false;

      case 'stop-inspect-mode':
        stopInspectMode();
        return false;

      case 'get-event-listeners': {
        const sel = message.selector as string;
        // 1. Synchronous attribute / property listeners (onX= attributes)
        const attrListeners = getEventListeners(sel);

        // 2. Query MAIN world for addEventListener-tracked listeners via eval bridge
        const evalId = `eval_${Date.now()}_${Math.random()}`;
        pendingEvalCallbacks[evalId] = (response: unknown) => {
          let mainListeners: object[] = [];
          const resp = response as { result?: { value?: string }; isError?: boolean };
          if (!resp.isError && resp.result?.value) {
            try { mainListeners = JSON.parse(resp.result.value) || []; } catch { /* ignore */ }
          }
          // Merge: MAIN world listeners first (more informative), then attribute ones
          sendResponse([...mainListeners, ...attrListeners]);
        };
        window.postMessage(
          {
            __devtools_eval_request__: true,
            expression: `JSON.stringify(typeof window.__devtools_getEventListeners__ === 'function' ? window.__devtools_getEventListeners__(${JSON.stringify(sel)}) : [])`,
            id: evalId,
          },
          '*'
        );
        // Safety timeout — fall back to attr listeners only
        setTimeout(() => {
          if (pendingEvalCallbacks[evalId]) {
            pendingEvalCallbacks[evalId]({ result: { value: '[]' }, isError: false });
            delete pendingEvalCallbacks[evalId];
          }
        }, 3000);
        return true; // async
      }

      case 'force-element-state':
        sendResponse(
          forceElementState(
            message.selector as string,
            message.pseudoClass as string,
            message.enable as boolean
          )
        );
        return true;

      case 'copy-element-html':
        sendResponse(getElementHtml(message.selector as string));
        return true;

      case 'copy-element-selector':
        sendResponse(getElementSelector(message.selector as string));
        return true;

      case 'scroll-into-view':
        sendResponse(scrollElementIntoView(message.selector as string));
        return true;

      case 'delete-element':
        sendResponse(deleteElement(message.selector as string));
        return true;

      case 'add-html-adjacent':
        sendResponse(
          addHtmlAdjacentTo(
            message.selector as string,
            message.position as InsertPosition,
            message.html as string
          )
        );
        return true;

      case 'edit-outer-html':
        sendResponse(
          editElementOuterHtml(message.selector as string, message.html as string)
        );
        return true;

      case 'start-dom-observer':
        startDomObserver();
        return false;

      case 'stop-dom-observer':
        stopDomObserver();
        return false;
      }
    } catch {
      // Extension context invalidated or other runtime error — ignore silently
    }
    return false;
  }
);

// =============================================
// AUTO-START DOM OBSERVER
// =============================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => startDomObserver());
} else {
  startDomObserver();
}
