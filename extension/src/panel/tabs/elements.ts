/**
 * Elements Tab — DOM tree rendering, styles, box model, inline editing, actions.
 */
import type { PanelState } from '../state';
import { sendMessage } from '../connection';
import { escapeHtml, makeEditable, showToast } from '../utils';

// ── internal state ──
let isEditingDom = false;
let domLoadRetries = 0;
let domLoadTimeout: ReturnType<typeof setTimeout> | null = null;
let mutationDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let inspectModeOn = false;
/** Set to true only when user explicitly selects/inspects an element; cleared after scroll */
let pendingScrollOnLoad = false;

// ── DOM references ──
let elementsTree: HTMLElement;
let elementsStyles: HTMLElement;
let elementsBoxModel: HTMLElement;
let inspectBtn: HTMLElement;

// will be set from panel.ts
let state: PanelState;
let switchTabFn: (tab: string) => void;
let loadSourceFileFn: (file: any) => void;

/**
 * Initialise the elements tab.
 * Call once after DOMContentLoaded.
 */
export function initElementsTab(
  panelState: PanelState,
  switchTab: (tab: string) => void,
  loadSourceFile: (file: any) => void
): void {
  state = panelState;
  switchTabFn = switchTab;
  loadSourceFileFn = loadSourceFile;

  elementsTree = document.getElementById('elements-tree')!;
  elementsStyles = document.getElementById('elements-styles')!;
  elementsBoxModel = document.getElementById('elements-box-model')!;
  inspectBtn = document.getElementById('elements-inspect')!;

  // Refresh button
  document.getElementById('elements-refresh')!.addEventListener('click', () => loadDomTree());

  // Inspect mode toggle
  inspectBtn.addEventListener('click', () => {
    inspectModeOn = !inspectModeOn;
    inspectBtn.classList.toggle('active', inspectModeOn);
    if (state.tabId) {
      sendMessage({ type: inspectModeOn ? 'start-inspect-mode' : 'stop-inspect-mode', tabId: state.tabId });
    }
  });

  // Element search
  document.getElementById('elements-search')!.addEventListener('input', function (this: HTMLInputElement) {
    const query = this.value.toLowerCase();
    elementsTree.querySelectorAll<HTMLElement>('.dom-node-line').forEach((line) => {
      if (!query) { line.style.display = ''; line.style.opacity = ''; return; }
      line.style.opacity = line.textContent!.toLowerCase().includes(query) ? '1' : '0.3';
    });
  });

  // Styles sub-tabs
  document.querySelectorAll<HTMLElement>('.styles-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.styles-tab-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.styles-tab-content').forEach((c) => c.classList.remove('active'));
      btn.classList.add('active');
      const tabEl = document.getElementById('styles-tab-' + btn.dataset.stylesTab);
      tabEl?.classList.add('active');
      if (btn.dataset.stylesTab === 'event-listeners' && state.elements.selectedSelector && state.tabId) {
        sendMessage({ type: 'get-event-listeners', tabId: state.tabId, selector: state.elements.selectedSelector });
      }
    });
  });

  // Force State checkboxes
  document.querySelectorAll<HTMLInputElement>('#elements-force-state input[type="checkbox"]').forEach((cb) => {
    cb.addEventListener('change', () => {
      if (!state.elements.selectedSelector || !state.tabId) return;
      sendMessage({
        type: 'force-element-state',
        tabId: state.tabId,
        selector: state.elements.selectedSelector,
        pseudoClass: cb.dataset.pseudo!,
        enable: cb.checked,
      });
    });
  });

  // Action buttons
  bindActionButtons();
}

// ── Actions ──
function bindActionButtons(): void {
  document.getElementById('elem-scroll-into-view')!.addEventListener('click', () => {
    if (!state.elements.selectedSelector || !state.tabId) return;
    sendMessage({ type: 'scroll-into-view', tabId: state.tabId, selector: state.elements.selectedSelector });
  });

  document.getElementById('elem-copy-html')!.addEventListener('click', () => {
    if (!state.elements.selectedSelector || !state.tabId) return;
    sendMessage({ type: 'copy-element-html', tabId: state.tabId, selector: state.elements.selectedSelector });
  });

  document.getElementById('elem-copy-selector')!.addEventListener('click', () => {
    if (!state.elements.selectedSelector || !state.tabId) return;
    sendMessage({ type: 'copy-element-selector', tabId: state.tabId, selector: state.elements.selectedSelector });
  });

  document.getElementById('elem-delete')!.addEventListener('click', () => {
    if (!state.elements.selectedSelector || !state.tabId) return;
    sendMessage({ type: 'delete-element', tabId: state.tabId, selector: state.elements.selectedSelector });
  });

  document.getElementById('elem-add-child')!.addEventListener('click', () => {
    if (!state.elements.selectedSelector || !state.tabId) return;
    const html = prompt('Enter HTML to add as child:', '<div>New element</div>');
    if (html) sendMessage({ type: 'add-html-adjacent', tabId: state.tabId, selector: state.elements.selectedSelector, position: 'beforeend', html });
  });

  document.getElementById('elem-add-before')!.addEventListener('click', () => {
    if (!state.elements.selectedSelector || !state.tabId) return;
    const html = prompt('Enter HTML to add before:', '<div>New element</div>');
    if (html) sendMessage({ type: 'add-html-adjacent', tabId: state.tabId, selector: state.elements.selectedSelector, position: 'beforebegin', html });
  });

  document.getElementById('elem-add-after')!.addEventListener('click', () => {
    if (!state.elements.selectedSelector || !state.tabId) return;
    const html = prompt('Enter HTML to add after:', '<div>New element</div>');
    if (html) sendMessage({ type: 'add-html-adjacent', tabId: state.tabId, selector: state.elements.selectedSelector, position: 'afterend', html });
  });
}

// ── Public API used by message handler ──

export function loadDomTree(): void {
  if (!state.tabId) {
    elementsTree.innerHTML = '<div class="sources-placeholder">No active tab detected. Please navigate to a page.</div>';
    return;
  }
  elementsTree.innerHTML = '<div class="sources-placeholder">Loading DOM...</div>';

  if (domLoadTimeout) clearTimeout(domLoadTimeout);
  domLoadTimeout = setTimeout(() => {
    if (!state.elements.domTree && domLoadRetries < 2) {
      domLoadRetries++;
      sendMessage({ type: 'get-dom-tree', tabId: state.tabId! });
      domLoadTimeout = setTimeout(() => {
        if (!state.elements.domTree) {
          elementsTree.innerHTML = '<div class="sources-placeholder">Unable to load DOM — content script may not be injected. Try refreshing the page or clicking Refresh above.</div>';
        }
      }, 4000);
    }
  }, 4000);

  sendMessage({ type: 'get-dom-tree', tabId: state.tabId });
}

export function handleDomTree(tree: any): void {
  if (domLoadTimeout) { clearTimeout(domLoadTimeout); domLoadTimeout = null; }
  domLoadRetries = 0;
  state.elements.domTree = tree;
  elementsTree.innerHTML = '';
  if (!tree) {
    elementsTree.innerHTML = '<div class="sources-placeholder">Unable to load DOM — the page may have restricted content or CORS policy.</div>';
    return;
  }
  try {
    const fragment = document.createDocumentFragment();
    renderDomNode(tree, fragment, 0);
    elementsTree.appendChild(fragment);
    // Only scroll if an explicit element selection triggered this load
    if (pendingScrollOnLoad && state.elements.selectedSelector) {
      pendingScrollOnLoad = false;
      scrollToSelectedDomNode(state.elements.selectedSelector);
    }
  } catch (err: any) {
    elementsTree.innerHTML = '<div class="sources-placeholder">Error rendering DOM: ' + escapeHtml(err.message) + '</div>';
  }
}

export function handleElementStyles(data: any): void {
  if (!data) {
    elementsStyles.innerHTML = '<div class="sources-placeholder">No styles available</div>';
    elementsBoxModel.innerHTML = '<div class="sources-placeholder">No box model</div>';
    return;
  }

  // ── Element label ─────────────────────────────────────────────────────────
  let html = '';
  if (data.tagName) {
    html += '<div class="styles-element-label">';
    html += escapeHtml(data.tagName);
    if (data.id) html += '<span class="styles-el-id">#' + escapeHtml(data.id) + '</span>';
    if (data.className) {
      const classes = String(data.className).trim().split(/\s+/).filter(Boolean);
      classes.forEach((c) => { html += '<span class="styles-el-class">.' + escapeHtml(c) + '</span>'; });
    }
    html += '</div>';
  }

  // ── element.style {} block (editable inline styles) ───────────────────────
  html += '<div class="styles-rule-block">';
  html += '<div class="styles-rule-header"><span class="styles-selector">element.style</span></div>';
  html += '<div class="styles-rule-body">';
  const inlineEntries = data.inline ? Object.entries(data.inline as Record<string, string>) : [];
  if (inlineEntries.length > 0) {
    inlineEntries.forEach(([prop, val]) => {
      html += buildStyleRow(prop, val as string, true, true);
    });
  } else {
    html += '<div class="styles-empty-rule">{ }</div>';
  }
  html += '</div></div>';

  // ── Matching CSS rule blocks ───────────────────────────────────────────────
  const rules: any[] = data.rules || [];
  rules.forEach((rule: any) => {
    html += '<div class="styles-rule-block">';
    html += '<div class="styles-rule-header">';
    html += '<span class="styles-selector">' + escapeHtml(rule.selector) + '</span>';
    html += '<span class="styles-source">' + escapeHtml(rule.source) + '</span>';
    html += '</div>';
    html += '<div class="styles-rule-body">';
    const entries = Object.entries(rule.properties as Record<string, string>);
    if (entries.length > 0) {
      entries.forEach(([prop, val]) => {
        html += buildStyleRow(prop, val as string, false, false);
      });
    }
    html += '</div></div>';
  });

  // ── Computed styles section (collapsed by default) ────────────────────────
  const computedEntries = data.computed ? Object.entries(data.computed as Record<string, string>).sort() : [];
  if (computedEntries.length > 0) {
    html += '<details class="styles-computed-section">';
    html += '<summary class="styles-computed-toggle">Computed</summary>';
    computedEntries.forEach(([prop, val]) => {
      html += '<div class="style-property computed-prop">';
      html += '<span class="style-prop-name">' + escapeHtml(prop) + ': </span>';
      html += '<span class="style-prop-value computed-value">' + escapeHtml(val as string) + '</span>';
      html += '<span class="style-semicolon">;</span>';
      html += '</div>';
    });
    html += '</details>';
  }

  elementsStyles.innerHTML = html;

  // ── Wire inline style editing (element.style block only) ─────────────────
  const inlineBlock = elementsStyles.querySelector('.styles-rule-block');
  if (inlineBlock) {
    inlineBlock.querySelectorAll<HTMLInputElement>('.style-toggle').forEach((cb) => {
      cb.addEventListener('change', () => {
        if (state.elements.selectedSelector) {
          editDomStyle(state.elements.selectedSelector, cb.dataset.prop!, cb.dataset.value!, cb.checked);
          cb.closest('.style-property')?.classList.toggle('disabled', !cb.checked);
        }
      });
    });
    inlineBlock.querySelectorAll<HTMLElement>('.style-prop-value[data-prop]').forEach((valEl) => {
      valEl.addEventListener('dblclick', () => {
        const prop = valEl.dataset.prop!;
        makeEditable(valEl, valEl.textContent || '', (newVal) => {
          valEl.textContent = newVal;
          if (state.elements.selectedSelector) {
            editDomStyle(state.elements.selectedSelector, prop, newVal, true);
            const toggle = valEl.parentElement?.querySelector<HTMLInputElement>('.style-toggle');
            if (toggle) toggle.dataset.value = newVal;
          }
        }, () => { isEditingDom = true; }, () => { isEditingDom = false; });
      });
    });
  }

  // ── Box model ─────────────────────────────────────────────────────────────
  if (data.boxModel) {
    const bm = data.boxModel;
    const m = bm.margin, p = bm.padding, b = bm.border;
    const contentW = bm.width - p.left - p.right - b.left - b.right;
    const contentH = bm.height - p.top - p.bottom - b.top - b.bottom;

    elementsBoxModel.innerHTML =
      '<div class="box-model">'
      + '<div class="box-margin" style="position:relative">'
      + '<span class="box-label">margin</span>'
      + '<span class="box-val-top">' + m.top + '</span><span class="box-val-bottom">' + m.bottom + '</span>'
      + '<span class="box-val-left">' + m.left + '</span><span class="box-val-right">' + m.right + '</span>'
      + '<div class="box-border" style="position:relative">'
      + '<span class="box-label">border</span>'
      + '<span class="box-val-top">' + b.top + '</span><span class="box-val-bottom">' + b.bottom + '</span>'
      + '<span class="box-val-left">' + b.left + '</span><span class="box-val-right">' + b.right + '</span>'
      + '<div class="box-padding" style="position:relative">'
      + '<span class="box-label">padding</span>'
      + '<span class="box-val-top">' + p.top + '</span><span class="box-val-bottom">' + p.bottom + '</span>'
      + '<span class="box-val-left">' + p.left + '</span><span class="box-val-right">' + p.right + '</span>'
      + '<div class="box-content">' + Math.round(contentW) + ' × ' + Math.round(contentH) + '</div>'
      + '</div></div></div></div>';
  }
}

/** Build a single style-property row HTML string */
function buildStyleRow(prop: string, val: string, editable: boolean, showToggle: boolean): string {
  let row = '<div class="style-property">';
  if (showToggle) {
    row += '<input type="checkbox" class="style-toggle" data-prop="' + escapeHtml(prop)
      + '" data-value="' + escapeHtml(val) + '" checked>';
  }
  row += '<span class="style-prop-name">' + escapeHtml(prop) + ': </span>';
  row += '<span class="style-prop-value' + (editable ? '' : '') + '" data-prop="'
    + (editable ? escapeHtml(prop) : '') + '"'
    + (editable ? ' title="Double-click to edit"' : '') + '>' + escapeHtml(val) + '</span>';
  row += '<span class="style-semicolon">;</span>';
  row += '</div>';
  return row;
}

export function handleEventListeners(listeners: any[]): void {
  state.elements.eventListeners = listeners || [];
  const container = document.getElementById('elements-event-listeners');
  if (!container) return;
  if (!listeners || listeners.length === 0) {
    container.innerHTML = '<div class="sources-placeholder">No event listeners found</div>';
    return;
  }
  let html = '';
  listeners.forEach((l) => {
    html += '<div class="event-listener-item">';
    html += '<span class="event-type">' + escapeHtml(l.type) + '</span>';
    html += '<span class="event-source">' + escapeHtml(l.source) + '</span>';
    html += '<div class="event-handler">' + escapeHtml(l.handler) + '</div>';
    html += '</div>';
  });
  container.innerHTML = html;
}

export function handleInspectElementSelected(message: any): void {
  inspectModeOn = false;
  inspectBtn.classList.remove('active');

  if (message.selector) {
    state.elements.selectedSelector = message.selector;
    if (state.tabId) {
      sendMessage({ type: 'get-element-styles', tabId: state.tabId, selector: message.selector });
      sendMessage({ type: 'highlight-element', tabId: state.tabId, selector: message.selector });
    }

    const treeAlreadyLoaded = !!state.elements.domTree;
    pendingScrollOnLoad = true; // signal handleDomTree to scroll after load
    switchTabFn('elements');

    if (treeAlreadyLoaded) {
      // DOM already rendered — scroll to the node immediately
      pendingScrollOnLoad = false;
      scrollToSelectedDomNode(message.selector);
    }
    // If tree was null, switchTabFn → loadDomTree → handleDomTree → scrollToSelectedDomNode
  }
}

export function handleCopyHtmlResult(data: string | null): void {
  if (data) { navigator.clipboard.writeText(data).catch(() => {}); showToast('HTML copied to clipboard'); }
}

export function handleCopySelectorResult(data: string | null): void {
  if (data) { navigator.clipboard.writeText(data).catch(() => {}); showToast('Selector copied to clipboard'); }
}

export function handleDomMutation(mutations: any[]): void {
  if (!mutations || mutations.length === 0) return;
  if (isEditingDom) return;

  let badge = document.querySelector<HTMLElement>('.tab[data-tab="elements"] .mutation-badge');
  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'mutation-badge';
    document.querySelector('.tab[data-tab="elements"]')!.appendChild(badge);
  }
  badge.textContent = '•';
  badge.title = mutations.length + ' DOM mutation(s) detected';

  // Debounce the tree reload — only reload after mutations settle for 1.5 s
  if (state.activeTab === 'elements') {
    if (mutationDebounceTimer) clearTimeout(mutationDebounceTimer);
    mutationDebounceTimer = setTimeout(() => {
      mutationDebounceTimer = null;
      if (!isEditingDom) {
        loadDomTree();
        if (badge) badge.textContent = '';
      }
    }, 1500);
  }
}

export function cancelInspectMode(): void {
  inspectBtn?.classList.remove('active');
  inspectModeOn = false;
}

// ── Private helpers ──

function scrollToSelectedDomNode(selector: string): void {
  let targetLine: HTMLElement | null = elementsTree.querySelector('.dom-node-line[data-selector="' + CSS.escape(selector) + '"]');
  if (!targetLine) {
    elementsTree.querySelectorAll<HTMLElement>('.dom-node-line[data-selector]').forEach((el) => {
      if (el.dataset.selector === selector) targetLine = el;
    });
  }
  if (!targetLine) return;
  let parent = targetLine.parentElement;
  while (parent && parent !== elementsTree) {
    if (parent.classList?.contains('dom-children') && parent.classList.contains('collapsed')) {
      parent.classList.remove('collapsed');
      const prevLine = parent.previousElementSibling as HTMLElement | null;
      const toggle = prevLine?.querySelector('.dom-toggle');
      if (toggle) toggle.textContent = '▼';
    }
    parent = parent.parentElement;
  }
  elementsTree.querySelectorAll('.dom-node-line.selected').forEach((el) => el.classList.remove('selected'));
  targetLine.classList.add('selected');
  setTimeout(() => targetLine!.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
}

function renderDomNode(node: any, parent: DocumentFragment | HTMLElement, depth: number): void {
  if (!node) return;
  const container = document.createElement('div');
  container.className = 'dom-node';

  // Text node
  if (node.nodeType === 3 && node.textContent) {
    const line = document.createElement('div');
    line.className = 'dom-node-line';
    line.style.paddingLeft = (depth * 16 + 18) + 'px';
    const textSpan = document.createElement('span');
    textSpan.className = 'dom-text';
    textSpan.textContent = '"' + node.textContent + '"';
    textSpan.title = 'Double-click to edit';
    textSpan.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      makeEditable(textSpan, node.textContent, (newVal) => {
        textSpan.textContent = '"' + newVal + '"';
        if (node.selector || node.parentSelector) editDomText(node.selector || node.parentSelector, newVal);
      }, () => { isEditingDom = true; }, () => { isEditingDom = false; });
    });
    line.appendChild(textSpan);
    container.appendChild(line);
    parent.appendChild(container);
    return;
  }

  // Comment node
  if (node.nodeType === 8 && node.textContent) {
    const line = document.createElement('div');
    line.className = 'dom-node-line';
    line.style.paddingLeft = (depth * 16 + 18) + 'px';
    line.innerHTML = '<span class="dom-comment">' + escapeHtml(node.textContent) + '</span>';
    container.appendChild(line);
    parent.appendChild(container);
    return;
  }

  // Truncated
  if (node.nodeType === -1) {
    const line = document.createElement('div');
    line.className = 'dom-node-line';
    line.style.paddingLeft = (depth * 16 + 18) + 'px';
    line.innerHTML = '<span class="dom-text" style="color:var(--text-muted)">' + escapeHtml(node.textContent) + '</span>';
    container.appendChild(line);
    parent.appendChild(container);
    return;
  }

  if (!node.tagName) return;

  const hasChildren = node.children && node.children.length > 0;
  const line = document.createElement('div');
  line.className = 'dom-node-line';
  line.style.paddingLeft = (depth * 16) + 'px';
  if (node.selector) line.dataset.selector = node.selector;

  const toggle = document.createElement('span');
  toggle.className = 'dom-toggle';
  toggle.textContent = hasChildren ? '▼' : ' ';
  line.appendChild(toggle);

  const tagContent = document.createElement('span');
  let html = '<span class="dom-punctuation">&lt;</span><span class="dom-tag">' + escapeHtml(node.tagName) + '</span>';

  if (node.attributes) {
    const attrOrder = ['id', 'class'];
    const orderedAttrs: [string, string][] = [];
    attrOrder.forEach((a) => { if (node.attributes[a]) orderedAttrs.push([a, node.attributes[a]]); });
    Object.keys(node.attributes).forEach((a) => { if (!attrOrder.includes(a)) orderedAttrs.push([a, node.attributes[a]]); });
    orderedAttrs.slice(0, 4).forEach(([name, value]) => {
      html += ' <span class="dom-attr-name">' + escapeHtml(name) + '</span>';
      const val = value.length > 60 ? value.substring(0, 57) + '...' : value;
      html += '<span class="dom-punctuation">=</span><span class="dom-attr-value" data-attr="' + escapeHtml(name) + '" data-selector="' + escapeHtml(node.selector || '') + '">"' + escapeHtml(val) + '"</span>';
    });
    if (orderedAttrs.length > 4) html += ' <span class="dom-punctuation">...</span>';
  }

  html += '<span class="dom-punctuation">&gt;</span>';
  if (!hasChildren) html += '<span class="dom-punctuation">&lt;/</span><span class="dom-tag">' + escapeHtml(node.tagName) + '</span><span class="dom-punctuation">&gt;</span>';

  tagContent.innerHTML = html;
  line.appendChild(tagContent);

  // Double-click attribute editing
  tagContent.querySelectorAll<HTMLElement>('.dom-attr-value').forEach((attrEl) => {
    attrEl.style.cursor = 'text';
    attrEl.title = 'Double-click to edit';
    attrEl.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      const attrName = attrEl.dataset.attr!;
      const selector = attrEl.dataset.selector!;
      const currentVal = attrEl.textContent!.replace(/^"|"$/g, '');
      makeEditable(attrEl, currentVal, (newVal) => {
        attrEl.textContent = '"' + newVal + '"';
        editDomAttribute(selector, attrName, newVal);
      }, () => { isEditingDom = true; }, () => { isEditingDom = false; });
    });
  });

  // Click to select
  line.addEventListener('click', (e) => {
    if (e.target === toggle) return;
    elementsTree.querySelectorAll('.dom-node-line.selected').forEach((el) => el.classList.remove('selected'));
    line.classList.add('selected');
    if (node.selector) {
      state.elements.selectedSelector = node.selector;
      sendMessage({ type: 'highlight-element', tabId: state.tabId!, selector: node.selector });
      sendMessage({ type: 'get-element-styles', tabId: state.tabId!, selector: node.selector });
      sendMessage({ type: 'set-selected-element', tabId: state.tabId!, selector: node.selector });
      document.querySelectorAll<HTMLInputElement>('#elements-force-state input[type="checkbox"]').forEach((cb) => { cb.checked = false; });
    }
  });

  // Hover highlight
  line.addEventListener('mouseenter', () => { if (node.selector) sendMessage({ type: 'highlight-element', tabId: state.tabId!, selector: node.selector }); });
  line.addEventListener('mouseleave', () => { sendMessage({ type: 'unhighlight-element', tabId: state.tabId! }); });

  container.appendChild(line);

  if (hasChildren) {
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'dom-children';
    const collapsed = depth > 3;
    if (collapsed) childrenContainer.classList.add('collapsed');
    toggle.textContent = collapsed ? '▶' : '▼';
    toggle.addEventListener('click', () => {
      childrenContainer.classList.toggle('collapsed');
      toggle.textContent = childrenContainer.classList.contains('collapsed') ? '▶' : '▼';
    });
    node.children.forEach((child: any) => renderDomNode(child, childrenContainer, depth + 1));

    // Closing tag
    const closingLine = document.createElement('div');
    closingLine.className = 'dom-node-line';
    closingLine.style.paddingLeft = (depth * 16 + 18) + 'px';
    closingLine.innerHTML = '<span class="dom-punctuation">&lt;/</span><span class="dom-tag">' + escapeHtml(node.tagName) + '</span><span class="dom-punctuation">&gt;</span>';
    childrenContainer.appendChild(closingLine);
    container.appendChild(childrenContainer);
  }

  parent.appendChild(container);
}

function editDomText(selector: string, newText: string): void {
  if (!state.tabId || !selector) return;
  sendMessage({
    type: 'eval-in-page', tabId: state.tabId,
    expression: '(function(){ var el = document.querySelector(' + JSON.stringify(selector) + '); if(!el) return false; var tn = null; for(var i=0;i<el.childNodes.length;i++){ if(el.childNodes[i].nodeType===3){ tn=el.childNodes[i]; break; }} if(tn) tn.textContent=' + JSON.stringify(newText) + '; else el.textContent=' + JSON.stringify(newText) + '; return true; })()',
  });
}

function editDomAttribute(selector: string, attrName: string, attrValue: string): void {
  if (!state.tabId || !selector) return;
  sendMessage({
    type: 'eval-in-page', tabId: state.tabId,
    expression: '(function(){ var el = document.querySelector(' + JSON.stringify(selector) + '); if(el) el.setAttribute(' + JSON.stringify(attrName) + ', ' + JSON.stringify(attrValue) + '); return !!el; })()',
  });
}

function editDomStyle(selector: string, prop: string, value: string, enabled: boolean): void {
  if (!state.tabId || !selector) return;
  const expr = enabled
    ? '(function(){ var el = document.querySelector(' + JSON.stringify(selector) + '); if(el) el.style.setProperty(' + JSON.stringify(prop) + ', ' + JSON.stringify(value) + '); return !!el; })()'
    : '(function(){ var el = document.querySelector(' + JSON.stringify(selector) + '); if(el) el.style.removeProperty(' + JSON.stringify(prop) + '); return !!el; })()';
  sendMessage({ type: 'eval-in-page', tabId: state.tabId, expression: expr });
}
