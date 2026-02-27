/**
 * DOM Serialization utilities for the content script.
 * Converts live DOM nodes into a serializable tree structure.
 */

import { MAX_DOM_DEPTH, MAX_CHILDREN_PER_NODE, MAX_ATTRIBUTE_LENGTH } from '@/shared/constants';
import type { DomTreeNode } from '@/shared/types';

/**
 * Serialize a DOM node into a transferable tree structure.
 */
export function serializeNode(node: Node, depth: number): DomTreeNode | null {
  if (!node) return null;
  if (depth > MAX_DOM_DEPTH) return null;

  const result: DomTreeNode = {
    nodeType: node.nodeType,
    tagName: null,
    id: null,
    className: null,
    attributes: {},
    textContent: null,
    children: [],
    selector: '',
  };

  try {
    const el = node as Element;
    result.tagName = el.tagName ? el.tagName.toLowerCase() : null;
    result.id = (el as HTMLElement).id || null;
    result.className =
      el.className && typeof el.className === 'string' ? el.className : null;
    result.selector = getUniqueSelector(el);
  } catch {
    // SVG or exotic elements may throw
  }

  // Text node
  if (node.nodeType === Node.TEXT_NODE) {
    let text = '';
    try {
      text = (node.textContent ?? '').trim();
    } catch {
      return null;
    }
    if (text) result.textContent = text.substring(0, 200);
    else return null;
    return result;
  }

  // Comment node
  if (node.nodeType === Node.COMMENT_NODE) {
    try {
      result.textContent = '<!-- ' + (node.textContent ?? '').substring(0, 100) + ' -->';
    } catch {
      result.textContent = '<!-- comment -->';
    }
    return result;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const el = node as Element;
  const tag = result.tagName;

  // Metadata nodes: include but don't recurse
  if (tag === 'script' || tag === 'noscript' || tag === 'link' || tag === 'meta') {
    collectAttributes(el, result);
    return result;
  }

  collectAttributes(el, result);

  // Children
  let childCount = 0;
  try {
    for (let j = 0; j < node.childNodes.length && childCount < MAX_CHILDREN_PER_NODE; j++) {
      const childResult = serializeNode(node.childNodes[j], depth + 1);
      if (childResult) {
        result.children.push(childResult);
        childCount++;
      }
    }
    if (node.childNodes.length > MAX_CHILDREN_PER_NODE) {
      result.children.push({
        nodeType: -1,
        tagName: null,
        id: null,
        className: null,
        attributes: {},
        textContent: `... ${node.childNodes.length - MAX_CHILDREN_PER_NODE} more nodes`,
        children: [],
        selector: '',
      });
    }
  } catch (e) {
    result.children.push({
      nodeType: -1,
      tagName: null,
      id: null,
      className: null,
      attributes: {},
      textContent: `... error reading children: ${(e as Error).message}`,
      children: [],
      selector: '',
    });
  }

  return result;
}

function collectAttributes(el: Element, result: DomTreeNode): void {
  try {
    if (el.attributes) {
      for (let i = 0; i < el.attributes.length; i++) {
        const attr = el.attributes[i];
        result.attributes[attr.name] = (attr.value || '').substring(0, MAX_ATTRIBUTE_LENGTH);
      }
    }
  } catch {
    /* ignore exotic elements */
  }
}

/**
 * Generate a unique CSS selector for an element.
 */
export function getUniqueSelector(el: Element | null): string {
  try {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return '';
    if (el === document.body) return 'body';
    if (el === document.documentElement) return 'html';
    if ((el as HTMLElement).id) return '#' + CSS.escape((el as HTMLElement).id);

    let path = el.tagName.toLowerCase();
    if (el.className && typeof el.className === 'string' && el.className.trim()) {
      const cls = el.className
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((c) => {
          try {
            return '.' + CSS.escape(c);
          } catch {
            return '';
          }
        })
        .filter(Boolean)
        .join('');
      path += cls;
    }

    const parent = el.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (c) => c.tagName === el.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(el) + 1;
        path += ':nth-of-type(' + index + ')';
      }
      path = getUniqueSelector(parent) + ' > ' + path;
    }
    return path;
  } catch {
    return '';
  }
}
