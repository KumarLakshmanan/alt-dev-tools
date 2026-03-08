/**
 * Security Tab — shows page protocol, HTTPS status, mixed-content warnings,
 * and CSP info derived from page URL and live page inspection.
 */
import type { PanelState } from '../state';
import { sendMessage } from '../connection';
import { escapeHtml } from '../utils';

let state: PanelState;
let securityContent: HTMLElement;

export function initSecurityTab(panelState: PanelState): void {
  state = panelState;
  securityContent = document.getElementById('security-content')!;

  document.getElementById('security-refresh')!.addEventListener('click', () => loadSecurityData());
}

export function loadSecurityData(): void {
  if (!state.tabId) return;
  // Use eval-in-page to collect security details from the page
  const expr = `(function(){
    var proto = location.protocol;
    var isHttps = proto === 'https:';
    var mixedActive = [];
    var mixedPassive = [];
    try {
      var allSrcs = Array.from(document.querySelectorAll('script[src],link[rel="stylesheet"][href],iframe[src]'));
      allSrcs.forEach(function(el){
        var src = el.getAttribute('src') || el.getAttribute('href');
        if(src && src.startsWith('http:')) mixedActive.push(src.substring(0, 200));
      });
      var passiveSrcs = Array.from(document.querySelectorAll('img[src],video[src],audio[src],source[src]'));
      passiveSrcs.forEach(function(el){
        var src = el.getAttribute('src');
        if(src && src.startsWith('http:')) mixedPassive.push(src.substring(0, 200));
      });
    } catch(e){}
    var cspMeta = '';
    try {
      var meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if(meta) cspMeta = meta.getAttribute('content') || '';
    } catch(e){}
    return JSON.stringify({
      href: location.href,
      protocol: proto,
      host: location.host,
      isHttps: isHttps,
      mixedActive: mixedActive.slice(0, 20),
      mixedPassive: mixedPassive.slice(0, 20),
      cspMeta: cspMeta.substring(0, 500)
    });
  })()`;

  sendMessage({ type: 'eval-in-page', tabId: state.tabId, expression: expr });
}

export function handleSecurityData(result: { type: string; value: string; isError?: boolean }): void {
  if (!securityContent) return;
  if (result.isError || result.type === 'error') {
    securityContent.innerHTML = '<div class="sources-placeholder">Could not load security info: ' + escapeHtml(result.value) + '</div>';
    return;
  }

  let data: { href: string; protocol: string; host: string; isHttps: boolean; mixedActive: string[]; mixedPassive: string[]; cspMeta: string };
  try {
    let val = result.value;
    // Handle double-encoded JSON
    if (typeof val === 'string' && val.charAt(0) === '"') {
      val = JSON.parse(val);
    }
    data = JSON.parse(val);
  } catch {
    securityContent.innerHTML = '<div class="sources-placeholder">Could not parse security info.</div>';
    return;
  }

  const isSecure = data.isHttps;
  const statusColor = isSecure ? '#22c55e' : '#ef4444';
  const statusIcon = isSecure ? '🔒' : '⚠️';

  let html = '<div class="security-section">';

  // Protocol status
  html += '<div class="security-row">';
  html += '<div class="security-label">Protocol</div>';
  html += '<div class="security-value"><span style="color:' + statusColor + ';font-weight:600;">' + statusIcon + ' ' + escapeHtml(data.protocol) + '</span></div>';
  html += '</div>';

  html += '<div class="security-row">';
  html += '<div class="security-label">Host</div>';
  html += '<div class="security-value">' + escapeHtml(data.host) + '</div>';
  html += '</div>';

  html += '<div class="security-row">';
  html += '<div class="security-label">Connection</div>';
  html += '<div class="security-value" style="color:' + statusColor + '">' + (isSecure ? 'Secure (HTTPS)' : 'Not Secure (HTTP)') + '</div>';
  html += '</div>';

  // Mixed content
  if (isSecure && data.mixedActive.length > 0) {
    html += '<div class="security-row">';
    html += '<div class="security-label" style="color:#ef4444">Mixed Content (Active)</div>';
    html += '<div class="security-value">';
    data.mixedActive.forEach((src) => {
      html += '<div class="security-mixed-item">' + escapeHtml(src) + '</div>';
    });
    html += '</div>';
    html += '</div>';
  } else if (isSecure) {
    html += '<div class="security-row">';
    html += '<div class="security-label">Mixed Content (Active)</div>';
    html += '<div class="security-value" style="color:#22c55e">None detected</div>';
    html += '</div>';
  }

  if (isSecure && data.mixedPassive.length > 0) {
    html += '<div class="security-row">';
    html += '<div class="security-label" style="color:#f59e0b">Mixed Content (Passive)</div>';
    html += '<div class="security-value">';
    data.mixedPassive.forEach((src) => {
      html += '<div class="security-mixed-item">' + escapeHtml(src) + '</div>';
    });
    html += '</div>';
    html += '</div>';
  }

  // CSP
  html += '<div class="security-row">';
  html += '<div class="security-label">Content Security Policy</div>';
  html += '<div class="security-value">' + (data.cspMeta ? ('<code class="security-csp">' + escapeHtml(data.cspMeta) + '</code>') : '<span style="opacity:.6">No &lt;meta&gt; CSP tag found (may be set via HTTP header)</span>') + '</div>';
  html += '</div>';

  html += '</div>';
  securityContent.innerHTML = html;
}
