/**
 * Event Listener Hooks — Runs in MAIN world (page context).
 *
 * Monkey-patches EventTarget.prototype.addEventListener so that every listener
 * registered on an Element, Document, or Window is tracked in a WeakMap.
 * Exposes window.__devtools_getEventListeners__(selector) which the content
 * script can call via the eval bridge to retrieve the tracked list.
 */

interface TrackedListener {
  type: string;
  handler: string;
  useCapture: boolean;
  source: string;
}

export function hookEventListeners(): void {
  const listenerMap = new WeakMap<EventTarget, TrackedListener[]>();

  const originalAdd = EventTarget.prototype.addEventListener;
  const originalRemove = EventTarget.prototype.removeEventListener;

  // Patch addEventListener
  EventTarget.prototype.addEventListener = function (
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ): void {
    // Only track Element / Document / Window targets
    if (listener && (this instanceof Element || this instanceof Document || this instanceof Window)) {
      const existing = listenerMap.get(this) || [];
      const handlerStr =
        typeof listener === 'function'
          ? listener.name
            ? listener.name + '()'
            : 'anonymous()'
          : '[EventListenerObject]';
      existing.push({
        type,
        handler: handlerStr,
        useCapture: options === true || !!(options as AddEventListenerOptions)?.capture,
        source: 'addEventListener',
      });
      listenerMap.set(this, existing);
    }
    return originalAdd.call(this, type, listener as EventListenerOrEventListenerObject, options as EventListenerOptions);
  };

  // Patch removeEventListener — remove from our tracking map too
  EventTarget.prototype.removeEventListener = function (
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions
  ): void {
    if (listener && (this instanceof Element || this instanceof Document || this instanceof Window)) {
      const existing = listenerMap.get(this);
      if (existing) {
        const capture = options === true || !!(options as EventListenerOptions)?.capture;
        const handlerStr =
          typeof listener === 'function'
            ? listener.name ? listener.name + '()' : 'anonymous()'
            : '[EventListenerObject]';
        const idx = existing.findIndex(
          (l) => l.type === type && l.handler === handlerStr && l.useCapture === capture
        );
        if (idx !== -1) existing.splice(idx, 1);
      }
    }
    return originalRemove.call(this, type, listener as EventListenerOrEventListenerObject, options as EventListenerOptions);
  };

  // Expose retrieval function — called via eval bridge from content script
  (window as unknown as Record<string, unknown>).__devtools_getEventListeners__ = function (
    selector: string
  ): TrackedListener[] {
    try {
      const el = document.querySelector(selector);
      if (!el) return [];
      return listenerMap.get(el) || [];
    } catch {
      return [];
    }
  };
}
