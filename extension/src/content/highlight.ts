/**
 * Element highlighting overlay for the content script.
 */

import { HIGHLIGHT_ID } from '@/shared/constants';

/**
 * Remove the highlight overlay.
 */
export function removeHighlight(): void {
  const existing = document.getElementById(HIGHLIGHT_ID);
  if (existing) existing.remove();
}

/**
 * Add a highlight overlay over the element matching `selector`.
 */
export function highlightElement(selector: string): void {
  removeHighlight();
  try {
    const el = document.querySelector(selector);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const overlay = document.createElement('div');
    overlay.id = HIGHLIGHT_ID;
    overlay.style.cssText =
      'position:fixed;z-index:2147483647;pointer-events:none;' +
      'background:rgba(111,168,220,0.33);border:1px solid rgba(111,168,220,0.8);' +
      `top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;height:${rect.height}px;` +
      'transition:all 0.05s;';
    document.body.appendChild(overlay);
  } catch {
    /* ignore */
  }
}
