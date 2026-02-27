/**
 * Live DOM Mutation Observer for the content script.
 * Watches for DOM changes and forwards summaries to the background.
 */

import { getUniqueSelector } from './dom-serializer';
import type { DomMutationSummary } from '@/shared/types';

let domObserver: MutationObserver | null = null;
let domObserverDebounce: ReturnType<typeof setTimeout> | null = null;

export function startDomObserver(): void {
  if (domObserver) return;

  domObserver = new MutationObserver((mutations) => {
    if (domObserverDebounce) clearTimeout(domObserverDebounce);
    domObserverDebounce = setTimeout(() => {
      const summary: DomMutationSummary[] = [];
      mutations.forEach((m) => {
        if (m.type === 'childList') {
          summary.push({
            type: 'childList',
            target: getUniqueSelector(m.target as Element),
            added: m.addedNodes.length,
            removed: m.removedNodes.length,
          });
        } else if (m.type === 'attributes') {
          summary.push({
            type: 'attributes',
            target: getUniqueSelector(m.target as Element),
            attr: m.attributeName ?? undefined,
          });
        } else if (m.type === 'characterData') {
          summary.push({
            type: 'characterData',
            target: getUniqueSelector(m.target as Element),
          });
        }
      });
      try {
        chrome.runtime.sendMessage({
          type: 'dom-mutation',
          mutations: summary.slice(0, 50),
        });
      } catch {
        /* extension context invalidated */
      }
    }, 300);
  });

  domObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  });
}

export function stopDomObserver(): void {
  if (domObserver) {
    domObserver.disconnect();
    domObserver = null;
  }
}
