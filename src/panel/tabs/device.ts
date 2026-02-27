/**
 * Device Emulation Tab — emulates device viewports using Chrome's CDP.
 * Properly changes window.innerWidth, media queries, and responsive layouts.
 */
import type { PanelState } from '../state';
import { sendMessage } from '../connection';

let state: PanelState;

const PRESETS: Record<string, { width: number; height: number; mobile: boolean; dpr: number }> = {
  'iPhone SE':          { width: 375,  height: 667,  mobile: true,  dpr: 2 },
  'iPhone 14':          { width: 390,  height: 844,  mobile: true,  dpr: 3 },
  'iPhone 14 Pro Max':  { width: 430,  height: 932,  mobile: true,  dpr: 3 },
  'Samsung Galaxy S20': { width: 360,  height: 800,  mobile: true,  dpr: 3 },
  'iPad':               { width: 768,  height: 1024, mobile: false, dpr: 2 },
  'iPad Pro':           { width: 1024, height: 1366, mobile: false, dpr: 2 },
  'Laptop':             { width: 1280, height: 800,  mobile: false, dpr: 1 },
  'Desktop 1080p':      { width: 1920, height: 1080, mobile: false, dpr: 1 },
};

let activePreset: string | null = null;
let isEmulating = false;

export function initDeviceTab(panelState: PanelState): void {
  state = panelState;

  // Wire the preset dropdown
  const presetSelect = document.getElementById('device-preset-select') as HTMLSelectElement;
  presetSelect?.addEventListener('change', () => {
    const name = presetSelect.value;
    if (!name) return; // "Responsive" selected — leave inputs as-is
    const preset = PRESETS[name];
    if (!preset) return;
    (document.getElementById('device-width')  as HTMLInputElement).value = String(preset.width);
    (document.getElementById('device-height') as HTMLInputElement).value = String(preset.height);
    activePreset = name;
    setStatus(`Preset selected: ${name} (${preset.width}×${preset.height})`);
  });

  document.getElementById('device-apply')!.addEventListener('click', () => applyEmulation());
  document.getElementById('device-reset')!.addEventListener('click', () => resetEmulation());
}

function applyEmulation(): void {
  if (!state.tabId) return;

  const widthInput  = (document.getElementById('device-width')  as HTMLInputElement).value.trim();
  const heightInput = (document.getElementById('device-height') as HTMLInputElement).value.trim();
  const w = parseInt(widthInput,  10);
  const h = parseInt(heightInput, 10);
  if (!w || !h || w < 1 || h < 1) {
    setStatus('Invalid dimensions — enter positive numbers.'); return;
  }

  isEmulating = true;

  // Use preset DPR/mobile flag if a preset is selected; otherwise guess from width
  const preset = activePreset ? PRESETS[activePreset] : null;
  const isMobile  = preset ? preset.mobile  : w <= 768;
  const dpr       = preset ? preset.dpr     : (isMobile ? 2 : 1);

  sendMessage({
    type: 'apply-device-emulation',
    tabId: state.tabId,
    width: w,
    height: h,
    deviceScaleFactor: dpr,
    mobile: isMobile,
  });
  setStatus(`Applying emulation ${w}×${h}…`);
  document.getElementById('device-apply')!.classList.add('active');
}

function resetEmulation(): void {
  if (!state.tabId) return;

  isEmulating = false;
  activePreset = null;

  // Reset the dropdown to "Responsive"
  const sel = document.getElementById('device-preset-select') as HTMLSelectElement;
  if (sel) sel.value = '';

  document.getElementById('device-apply')!.classList.remove('active');
  sendMessage({ type: 'reset-device-emulation', tabId: state.tabId });
  setStatus('Resetting emulation…');
}

export function handleDeviceEmulationResult(message: any): void {
  if (message.type === 'device-emulation-applied') {
    if (message.success) {
      const wInput = (document.getElementById('device-width') as HTMLInputElement)?.value;
      const hInput = (document.getElementById('device-height') as HTMLInputElement)?.value;
      setStatus(`Emulating ${wInput}×${hInput} — viewport active.`);
    } else {
      setStatus(`Emulation failed: ${message.error || 'unknown error'}`);
      isEmulating = false;
      document.getElementById('device-apply')!.classList.remove('active');
    }
  } else if (message.type === 'device-emulation-reset') {
    setStatus(message.success ? 'Emulation reset.' : `Reset failed: ${message.error || 'unknown error'}`);
  }
}

function setStatus(msg: string): void {
  const el = document.getElementById('device-status');
  if (el) el.textContent = msg;
}
