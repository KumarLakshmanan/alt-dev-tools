/**
 * Computed styles extraction for the content script.
 * Returns inline styles, matching CSS rules, and computed styles — Chrome DevTools style.
 */

import type { ElementStylesData, CSSRuleInfo } from '@/shared/types';

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

/** Extract inline styles directly set on element.style */
function getInlineStyles(el: HTMLElement): Record<string, string> {
  const inline: Record<string, string> = {};
  for (let i = 0; i < el.style.length; i++) {
    const prop = el.style[i];
    const val = el.style.getPropertyValue(prop);
    if (val) inline[prop] = val;
  }
  return inline;
}

/** Get filename portion of a URL for display in the source hint */
function sourceLabel(href: string | null): string {
  if (!href) return '<style>';
  try {
    const pathname = new URL(href).pathname;
    return pathname.split('/').pop() || href;
  } catch {
    return href;
  }
}

/** Extract all CSS rules from stylesheets that match the element */
function getMatchingCSSRules(el: HTMLElement): CSSRuleInfo[] {
  const rules: CSSRuleInfo[] = [];
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      let cssRules: CSSRuleList | null = null;
      try { cssRules = sheet.cssRules; } catch { continue; } // skip cross-origin sheets
      if (!cssRules) continue;
      for (const rule of Array.from(cssRules)) {
        if (!(rule instanceof CSSStyleRule)) continue;
        let matches = false;
        try { matches = el.matches(rule.selectorText); } catch { continue; }
        if (!matches) continue;
        const properties: Record<string, string> = {};
        for (let i = 0; i < rule.style.length; i++) {
          const prop = rule.style[i];
          properties[prop] = rule.style.getPropertyValue(prop);
        }
        if (Object.keys(properties).length === 0) continue;
        rules.push({
          selector: rule.selectorText,
          source: sourceLabel(sheet.href),
          properties,
        });
      }
    }
  } catch { /* ignore */ }
  return rules;
}

export function getElementStyles(selector: string): ElementStylesData | null {
  try {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) return null;

    // Inline styles
    const inline = getInlineStyles(el);

    // Matching CSS rules
    const rules = getMatchingCSSRules(el);

    // Filtered computed styles
    const computed = window.getComputedStyle(el);
    const computedMap: Record<string, string> = {};
    IMPORTANT_PROPERTIES.forEach((prop) => {
      const val = computed.getPropertyValue(prop);
      if (val && !IGNORED_VALUES.has(val)) {
        computedMap[prop] = val;
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
      inline,
      rules,
      computed: computedMap,
      boxModel,
      tagName: el.tagName.toLowerCase(),
      id: el.id,
      className: typeof el.className === 'string' ? el.className : '',
    };
  } catch {
    return null;
  }
}

