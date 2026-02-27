/**
 * Element manipulation helpers for the content script.
 * Handles event listeners, force-state, copy, scroll, delete, add.
 */

import { getUniqueSelector } from './dom-serializer';
import type { EventListenerInfo } from '@/shared/types';

// =============================================
// EVENT LISTENERS EXTRACTION
// =============================================

const KNOWN_EVENT_TYPES = [
  'click', 'dblclick', 'mousedown', 'mouseup', 'mouseover', 'mouseout', 'mousemove',
  'keydown', 'keyup', 'keypress', 'focus', 'blur', 'change', 'input', 'submit', 'reset',
  'scroll', 'resize', 'load', 'unload', 'error', 'contextmenu', 'touchstart', 'touchend',
  'touchmove', 'pointerdown', 'pointerup', 'pointermove', 'wheel', 'dragstart', 'drag',
  'dragend', 'drop', 'dragover', 'dragenter', 'dragleave', 'animationstart', 'animationend',
  'transitionend',
];

export function getEventListeners(selector: string): EventListenerInfo[] {
  try {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) return [];
    const listeners: EventListenerInfo[] = [];

    KNOWN_EVENT_TYPES.forEach((type) => {
      const handler = el.getAttribute('on' + type);
      if (handler) {
        listeners.push({
          type,
          source: 'attribute',
          handler: handler.substring(0, 200),
          useCapture: false,
        });
      }
      const propHandler = (el as unknown as Record<string, unknown>)['on' + type];
      if (typeof propHandler === 'function') {
        listeners.push({
          type,
          source: 'property',
          handler: ((propHandler as { name?: string }).name || 'anonymous') + '()',
          useCapture: false,
        });
      }
    });

    if (el.dataset) {
      Object.keys(el.dataset).forEach((key) => {
        if (key.startsWith('on') || key.startsWith('v-on') || key.startsWith('ng-')) {
          listeners.push({
            type: key,
            source: 'data-attr',
            handler: (el.dataset[key] ?? '').substring(0, 200),
            useCapture: false,
          });
        }
      });
    }

    return listeners;
  } catch {
    return [];
  }
}

// =============================================
// FORCE ELEMENT STATE
// =============================================

const forcedStates: Record<string, Set<string>> = {};

export function forceElementState(
  selector: string,
  pseudoClass: string,
  enable: boolean
): boolean {
  try {
    const el = document.querySelector(selector);
    if (!el) return false;
    if (!forcedStates[selector]) forcedStates[selector] = new Set();

    const cleanPseudo = pseudoClass.replace(':', '');
    const className = `__devtools_force_${cleanPseudo}`;
    const styleId = `__devtools_forced_${cleanPseudo}__`;

    if (enable) {
      forcedStates[selector].add(pseudoClass);
      el.classList.add(className);
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `.${className} { }`;
        document.head.appendChild(style);
      }
    } else {
      forcedStates[selector].delete(pseudoClass);
      el.classList.remove(className);
    }
    return true;
  } catch {
    return false;
  }
}

// =============================================
// COPY ELEMENT
// =============================================

export function getElementHtml(selector: string): string | null {
  try {
    const el = document.querySelector(selector);
    return el ? el.outerHTML : null;
  } catch {
    return null;
  }
}

export function getElementSelector(selector: string): string | null {
  try {
    const el = document.querySelector(selector);
    return el ? getUniqueSelector(el) : null;
  } catch {
    return null;
  }
}

// =============================================
// SCROLL INTO VIEW
// =============================================

export function scrollElementIntoView(selector: string): boolean {
  try {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) return false;
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    const prev = el.style.outline;
    el.style.outline = '2px solid #1a73e8';
    setTimeout(() => {
      el.style.outline = prev;
    }, 1500);
    return true;
  } catch {
    return false;
  }
}

// =============================================
// ADD / REMOVE HTML NODES
// =============================================

export function deleteElement(selector: string): boolean {
  try {
    const el = document.querySelector(selector);
    if (!el) return false;
    el.remove();
    return true;
  } catch {
    return false;
  }
}

export function addHtmlAdjacentTo(
  selector: string,
  position: InsertPosition,
  html: string
): boolean {
  try {
    const el = document.querySelector(selector);
    if (!el) return false;
    el.insertAdjacentHTML(position, html);
    return true;
  } catch {
    return false;
  }
}

export function editElementOuterHtml(selector: string, newHtml: string): boolean {
  try {
    const el = document.querySelector(selector);
    if (!el) return false;
    el.outerHTML = newHtml;
    return true;
  } catch {
    return false;
  }
}
