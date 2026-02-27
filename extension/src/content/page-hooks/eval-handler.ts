/**
 * Eval handler — executes expressions sent from the panel in page context.
 */

import { serializeArg } from './serializer';

let lastResult: unknown = undefined;
let selectedElement: Element | null = null;

export function initEvalHandler(): void {
  // Expose special variables on window
  Object.defineProperty(window, '$_', {
    get: () => lastResult,
    configurable: true,
  });
  Object.defineProperty(window, '$0', {
    get: () => selectedElement,
    set: (v: Element) => {
      selectedElement = v;
    },
    configurable: true,
  });
  // $$(selector) = querySelectorAll
  (window as unknown as Record<string, unknown>).$$  = (selector: string) =>
    Array.from(document.querySelectorAll(selector));
  // copy() to clipboard
  (window as unknown as Record<string, unknown>).copy = (val: unknown) => {
    const text = typeof val === 'string' ? val : JSON.stringify(val, null, 2);
    navigator.clipboard.writeText(text).catch(() => {});
  };

  // Listen for selected element updates
  window.addEventListener('message', (event: MessageEvent) => {
    if (event.source !== window || !event.data) return;
    if (event.data.__devtools_set_selected_element__) {
      try {
        selectedElement = document.querySelector(event.data.selector);
      } catch {
        /* ignore */
      }
    }
  });

  // Listen for eval requests
  window.addEventListener('message', (event: MessageEvent) => {
    if (event.source !== window) return;
    if (!event.data || event.data.__devtools_eval_request__ !== true) return;

    let result: unknown;
    let isError = false;
    try {
      // eslint-disable-next-line no-eval
      result = eval(event.data.expression);
      lastResult = result;
    } catch (e) {
      result = (e as Error).message || String(e);
      isError = true;
    }

    let serialized;
    if (isError) {
      serialized = { type: 'error', value: String(result) };
    } else if (result === null) {
      serialized = { type: 'null', value: 'null' };
    } else if (result === undefined) {
      serialized = { type: 'undefined', value: 'undefined' };
    } else if (typeof result === 'object') {
      try {
        serialized = {
          type: 'object',
          value: JSON.stringify(result, null, 2).substring(0, 10000),
        };
      } catch {
        serialized = { type: 'string', value: String(result) };
      }
    } else {
      serialized = { type: typeof result, value: String(result) };
    }

    window.postMessage(
      {
        __devtools_eval_response__: true,
        id: event.data.id,
        result: serialized,
        isError,
      },
      '*'
    );
  });
}
