/**
 * Performance Tab — collects and displays page performance metrics.
 * Uses chrome.scripting.executeScript (via eval-in-page) to read
 * window.performance data from the page context.
 */
import type { PanelState } from '../state';
import { sendMessage } from '../connection';
import { formatBytes } from '../utils';

let state: PanelState;

let isRecording = false;
let fpsRafId: number | null = null;
let lastFrameTime = 0;
let frameCount = 0;
let fpsSamples: number[] = [];

export function initPerformanceTab(panelState: PanelState): void {
  state = panelState;

  document.getElementById('perf-refresh')!.addEventListener('click', () => loadPerformanceData());
  document.getElementById('perf-clear')!.addEventListener('click', () => clearPerformance());

  document.getElementById('perf-record')!.addEventListener('click', () => {
    isRecording = !isRecording;
    const btn = document.getElementById('perf-record')!;
    btn.classList.toggle('recording', isRecording);
    btn.querySelector('circle')?.setAttribute('fill', isRecording ? '#f44' : 'currentColor');
    if (isRecording) {
      startFpsMeter();
    } else {
      stopFpsMeter();
      loadPerformanceData();
    }
  });
}

export function loadPerformanceData(): void {
  if (!state.tabId) return;

  const expression = `(function(){
    const nav = performance.getEntriesByType('navigation')[0] || {};
    const paintEntries = performance.getEntriesByType('paint');
    const fp  = paintEntries.find(e => e.name === 'first-paint');
    const fcp = paintEntries.find(e => e.name === 'first-contentful-paint');
    const resources = performance.getEntriesByType('resource').map(r => ({
      name: r.name,
      type: r.initiatorType,
      duration: Math.round(r.duration),
      transferSize: r.transferSize || 0,
    })).slice(0, 100);
    const mem = performance.memory || {};
    return JSON.stringify({
      loadTime:    Math.round(nav.loadEventEnd - nav.fetchStart) || 0,
      dclTime:     Math.round(nav.domContentLoadedEventEnd - nav.fetchStart) || 0,
      fpTime:      fp  ? Math.round(fp.startTime)  : null,
      fcpTime:     fcp ? Math.round(fcp.startTime) : null,
      heapUsed:    mem.usedJSHeapSize  || null,
      heapTotal:   mem.totalJSHeapSize || null,
      resources,
    });
  })()`;

  sendMessage({ type: 'eval-in-page', tabId: state.tabId, expression });
}

export function handlePerformanceData(result: any): void {
  if (!result || result.isError) return;
  let data: any;
  try {
    const raw = typeof result.result?.value === 'string' ? result.result.value : String(result.result?.value || '');
    data = JSON.parse(raw);
  } catch { return; }

  const fmt = (ms: number | null) => ms !== null && ms !== undefined ? ms + ' ms' : '—';
  const fmtB = (b: number | null) => b ? formatBytes(b) : '—';

  const set = (id: string, val: string) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('perf-load-time', fmt(data.loadTime));
  set('perf-dcl-time', fmt(data.dclTime));
  set('perf-fp-time', fmt(data.fpTime));
  set('perf-fcp-time', fmt(data.fcpTime));
  set('perf-heap-used', fmtB(data.heapUsed));
  set('perf-heap-total', fmtB(data.heapTotal));
  set('perf-resource-count', (data.resources?.length ?? 0) + ' items');
  const transferred = (data.resources || []).reduce((s: number, r: any) => s + (r.transferSize || 0), 0);
  set('perf-transferred', formatBytes(transferred));

  // Render resource table
  const container = document.getElementById('perf-resources')!;
  if (!data.resources || data.resources.length === 0) {
    container.innerHTML = '<div class="sources-placeholder">No resource timing data</div>';
    return;
  }
  const sorted = [...data.resources].sort((a: any, b: any) => b.duration - a.duration);
  const maxDur = sorted[0]?.duration || 1;
  let html = '<table class="perf-table"><thead><tr><th>Resource</th><th>Type</th><th>Duration</th><th>Size</th><th>Waterfall</th></tr></thead><tbody>';
  sorted.forEach((r: any) => {
    const barW = Math.max(2, Math.round((r.duration / maxDur) * 100));
    const barColor = r.duration > 500 ? '#f44' : r.duration > 200 ? '#fa3' : '#4af';
    const name = r.name.split('/').pop()?.split('?')[0] || r.name;
    html += `<tr>
      <td class="cell-name" title="${r.name}">${name}</td>
      <td class="cell-type">${r.type}</td>
      <td class="cell-time">${r.duration} ms</td>
      <td class="cell-size">${formatBytes(r.transferSize)}</td>
      <td><div class="waterfall-bar" style="width:${barW}%;background:${barColor};height:6px;border-radius:3px;min-width:2px;"></div></td>
    </tr>`;
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}

function clearPerformance(): void {
  const ids = ['perf-load-time', 'perf-dcl-time', 'perf-fp-time', 'perf-fcp-time', 'perf-heap-used', 'perf-heap-total', 'perf-resource-count', 'perf-transferred'];
  ids.forEach((id) => { const el = document.getElementById(id); if (el) el.textContent = '—'; });
  const container = document.getElementById('perf-resources')!;
  container.innerHTML = '<div class="sources-placeholder">Click "Refresh" to load performance data</div>';
  stopFpsMeter();
  const fpsVal = document.getElementById('perf-fps-value');
  if (fpsVal) fpsVal.textContent = '—';
  const fpsFill = document.getElementById('perf-fps-fill');
  if (fpsFill) fpsFill.style.width = '0%';
}

function startFpsMeter(): void {
  lastFrameTime = performance.now();
  frameCount = 0;
  fpsSamples = [];

  const tick = (now: number) => {
    frameCount++;
    const elapsed = now - lastFrameTime;
    if (elapsed >= 1000) {
      const fps = Math.round((frameCount / elapsed) * 1000);
      fpsSamples.push(fps);
      if (fpsSamples.length > 30) fpsSamples.shift();
      const avg = Math.round(fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length);
      const fpsVal = document.getElementById('perf-fps-value');
      if (fpsVal) fpsVal.textContent = avg + ' fps';
      const fpsFill = document.getElementById('perf-fps-fill');
      if (fpsFill) fpsFill.style.width = Math.min(100, Math.round((avg / 60) * 100)) + '%';
      frameCount = 0;
      lastFrameTime = now;
    }
    if (isRecording) fpsRafId = requestAnimationFrame(tick);
  };
  fpsRafId = requestAnimationFrame(tick);
}

function stopFpsMeter(): void {
  isRecording = false;
  if (fpsRafId !== null) { cancelAnimationFrame(fpsRafId); fpsRafId = null; }
}
