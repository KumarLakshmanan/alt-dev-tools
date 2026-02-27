/**
 * Computed styles extraction for the content script.
 */

import type { ElementStylesData } from '@/shared/types';

const IMPORTANT_PROPERTIES = [
  'display', 'position', 'width', 'height',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'border', 'border-width', 'border-style', 'border-color', 'border-radius',
  'background', 'background-color', 'color', 'font-family', 'font-size', 'font-weight',
  'line-height', 'text-align', 'overflow', 'opacity', 'z-index',
  'top', 'right', 'bottom', 'left', 'flex', 'flex-direction', 'justify-content', 'align-items',
  'grid-template-columns', 'grid-template-rows', 'gap', 'box-shadow', 'transform', 'transition',
];

const IGNORED_VALUES = new Set(['none', 'normal', 'auto', '0px', 'rgba(0, 0, 0, 0)']);

export function getElementStyles(selector: string): ElementStylesData | null {
  try {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) return null;

    const computed = window.getComputedStyle(el);
    const styles: Record<string, string> = {};

    IMPORTANT_PROPERTIES.forEach((prop) => {
      const val = computed.getPropertyValue(prop);
      if (val && !IGNORED_VALUES.has(val)) {
        styles[prop] = val;
      }
    });

    const boxModel = {
      width: el.offsetWidth,
      height: el.offsetHeight,
      margin: {
        top: parseFloat(computed.marginTop) || 0,
        right: parseFloat(computed.marginRight) || 0,
        bottom: parseFloat(computed.marginBottom) || 0,
        left: parseFloat(computed.marginLeft) || 0,
      },
      padding: {
        top: parseFloat(computed.paddingTop) || 0,
        right: parseFloat(computed.paddingRight) || 0,
        bottom: parseFloat(computed.paddingBottom) || 0,
        left: parseFloat(computed.paddingLeft) || 0,
      },
      border: {
        top: parseFloat(computed.borderTopWidth) || 0,
        right: parseFloat(computed.borderRightWidth) || 0,
        bottom: parseFloat(computed.borderBottomWidth) || 0,
        left: parseFloat(computed.borderLeftWidth) || 0,
      },
    };

    return {
      styles,
      boxModel,
      tagName: el.tagName.toLowerCase(),
      id: el.id,
      className: typeof el.className === 'string' ? el.className : '',
    };
  } catch {
    return null;
  }
}
