/**
 * Page source collection for the content script.
 */

import type { SourceFile } from '@/shared/types';

export function collectPageSources(): SourceFile[] {
  const sources: SourceFile[] = [];

  // Main document
  sources.push({
    url: window.location.href,
    type: 'document',
    content: document.documentElement.outerHTML,
  });

  // External stylesheets
  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    sources.push({
      url: (link as HTMLLinkElement).href,
      type: 'stylesheet',
      content: null,
    });
  });

  // Inline styles
  document.querySelectorAll('style').forEach((style, idx) => {
    sources.push({
      url: `${window.location.href}#inline-style-${idx}`,
      type: 'stylesheet',
      content: style.textContent,
    });
  });

  // External scripts
  document.querySelectorAll('script[src]').forEach((script) => {
    sources.push({
      url: (script as HTMLScriptElement).src,
      type: 'script',
      content: null,
    });
  });

  // Inline scripts
  document.querySelectorAll('script:not([src])').forEach((script, idx) => {
    if (script.textContent?.trim()) {
      sources.push({
        url: `${window.location.href}#inline-script-${idx}`,
        type: 'script',
        content: script.textContent,
      });
    }
  });

  return sources;
}
