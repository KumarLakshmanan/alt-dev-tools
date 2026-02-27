/**
 * Inspect Mode — Element picker overlay for the content script.
 * When active, hovering highlights elements and clicking selects one.
 */

import {
  INSPECT_OVERLAY_ID,
  INSPECT_TOOLTIP_ID,
} from '@/shared/constants';
import { getUniqueSelector } from './dom-serializer';

let inspectModeActive = false;
let inspectOverlay: HTMLDivElement | null = null;
let inspectTooltip: HTMLDivElement | null = null;

export function startInspectMode(): void {
  if (inspectModeActive) return;
  inspectModeActive = true;

  inspectOverlay = document.createElement('div');
  inspectOverlay.id = INSPECT_OVERLAY_ID;
  inspectOverlay.style.cssText =
    'position:fixed;z-index:2147483646;pointer-events:none;' +
    'border:2px solid #1a73e8;background:rgba(66,133,244,0.15);display:none;transition:all 0.05s;';
  document.body.appendChild(inspectOverlay);

  inspectTooltip = document.createElement('div');
  inspectTooltip.id = INSPECT_TOOLTIP_ID;
  inspectTooltip.style.cssText =
    'position:fixed;z-index:2147483647;pointer-events:none;' +
    'background:#1a1a2e;color:#e0e0e0;font:11px/1.4 monospace;padding:4px 8px;border-radius:3px;' +
    'box-shadow:0 2px 8px rgba(0,0,0,0.5);display:none;white-space:nowrap;max-width:400px;overflow:hidden;text-overflow:ellipsis;';
  document.body.appendChild(inspectTooltip);

  document.addEventListener('mousemove', inspectMouseMove, true);
  document.addEventListener('click', inspectClick, true);
  document.addEventListener('keydown', inspectKeyDown, true);
}

export function stopInspectMode(): void {
  inspectModeActive = false;
  document.removeEventListener('mousemove', inspectMouseMove, true);
  document.removeEventListener('click', inspectClick, true);
  document.removeEventListener('keydown', inspectKeyDown, true);
  if (inspectOverlay) {
    inspectOverlay.remove();
    inspectOverlay = null;
  }
  if (inspectTooltip) {
    inspectTooltip.remove();
    inspectTooltip = null;
  }
}

function inspectMouseMove(e: MouseEvent): void {
  if (!inspectModeActive) return;
  const target = e.target as HTMLElement;
  if (
    !target ||
    target === inspectOverlay ||
    target === inspectTooltip ||
    target.id === INSPECT_OVERLAY_ID ||
    target.id === INSPECT_TOOLTIP_ID ||
    target.id === '__devtools_highlight__'
  )
    return;

  const rect = target.getBoundingClientRect();

  if (inspectOverlay) {
    inspectOverlay.style.display = 'block';
    inspectOverlay.style.top = rect.top + 'px';
    inspectOverlay.style.left = rect.left + 'px';
    inspectOverlay.style.width = rect.width + 'px';
    inspectOverlay.style.height = rect.height + 'px';
  }

  if (inspectTooltip) {
    let label = target.tagName.toLowerCase();
    if (target.id) label += '#' + target.id;
    if (target.className && typeof target.className === 'string') {
      label += '.' + target.className.trim().split(/\s+/).slice(0, 3).join('.');
    }
    const dims = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
    inspectTooltip.textContent = `${label}  ${dims}`;
    inspectTooltip.style.display = 'block';
    let tooltipTop = rect.top - 28;
    if (tooltipTop < 4) tooltipTop = rect.bottom + 4;
    inspectTooltip.style.top = tooltipTop + 'px';
    inspectTooltip.style.left = Math.max(4, rect.left) + 'px';
  }
}

function inspectClick(e: MouseEvent): void {
  if (!inspectModeActive) return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  const target = e.target as HTMLElement;
  if (!target || target === inspectOverlay || target === inspectTooltip) return;

  const selector = getUniqueSelector(target);
  stopInspectMode();

  try {
    chrome.runtime.sendMessage({
      type: 'inspect-element-selected',
      selector,
      tagName: target.tagName.toLowerCase(),
      id: target.id || '',
      className:
        target.className && typeof target.className === 'string' ? target.className : '',
    });
  } catch {
    /* extension context invalidated */
  }
}

function inspectKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    stopInspectMode();
    try {
      chrome.runtime.sendMessage({ type: 'inspect-mode-cancelled' });
    } catch {
      /* ignore */
    }
  }
}
