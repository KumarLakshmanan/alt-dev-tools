// =============================================
// Shared message types between background, content, and panel
// =============================================

/** Serialized argument from console hooks */
export interface SerializedArg {
  type: string;
  value: string;
  preview?: string;
  children?: Record<string, SerializedArg>;
  items?: SerializedArg[];
  length?: number;
  expandable?: boolean;
}

/** Console entry forwarded from page hooks */
export interface ConsoleMessage {
  __devtools_sidebar__?: boolean;
  type: 'console';
  method: string;
  args?: SerializedArg[];
  source?: string;
  timestamp?: number;
  groupDepth?: number;
}

/** Network request data */
export interface NetworkRequestData {
  url: string;
  method: string;
  status: number;
  statusText: string;
  requestHeaders: Record<string, string>;
  requestBody: string | null;
  responseHeaders: Record<string, string>;
  responseBody: string | null;
  resourceType: string;
  size: number;
  time: number;
  initiator: string;
  timestamp: number;
  timing?: NetworkTiming | null;
  error?: boolean;
  blocked?: boolean;
  wsId?: string;
}

/** Network timing breakdown */
export interface NetworkTiming {
  blocked?: number;
  dns?: number;
  connect?: number;
  ssl?: number;
  send?: number;
  wait?: number;
  ttfb?: number;
  receive?: number;
  download?: number;
  total?: number;
  transferSize?: number;
  encodedBodySize?: number;
  decodedBodySize?: number;
}

/** Network message forwarded from page hooks */
export interface NetworkMessage {
  __devtools_sidebar__?: boolean;
  type: 'network';
  data: NetworkRequestData;
}

/** WebSocket lifecycle events */
export interface WebSocketMessage {
  __devtools_sidebar__?: boolean;
  type: 'websocket';
  action: 'open' | 'message' | 'close' | 'error';
  data: {
    id: string;
    url: string;
    direction?: 'sent' | 'received';
    data?: string;
    protocols?: string;
    code?: number;
    reason?: string;
    timestamp: number;
  };
}

/** DOM tree node */
export interface DomTreeNode {
  nodeType: number;
  tagName: string | null;
  id: string | null;
  className: string | null;
  attributes: Record<string, string>;
  textContent: string | null;
  children: DomTreeNode[];
  selector: string;
  parentSelector?: string;
}

/** A single CSS rule matching an element */
export interface CSSRuleInfo {
  /** Full selector text, e.g. ".btn:hover" */
  selector: string;
  /** Filename or "<style>" for inline sheets */
  source: string;
  /** Property → value map for properties declared in this rule */
  properties: Record<string, string>;
}

/** Element styles data — Chrome DevTools style (inline + CSS rules + computed) */
export interface ElementStylesData {
  /** Inline styles set directly on element.style */
  inline: Record<string, string>;
  /** Matching CSS rules from stylesheets, highest specificity first */
  rules: CSSRuleInfo[];
  /** Filtered getComputedStyle() result */
  computed: Record<string, string>;
  boxModel: BoxModelData;
  tagName: string;
  id: string;
  className: string;
}

/** Box model data */
export interface BoxModelData {
  width: number;
  height: number;
  margin: BoxSides;
  padding: BoxSides;
  border: BoxSides;
}

export interface BoxSides {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Event listener info */
export interface EventListenerInfo {
  type: string;
  source: string;
  handler: string;
  useCapture: boolean;
}

/** Source file info */
export interface SourceFile {
  url: string;
  type: string;
  content: string | null;
  _origContent?: string;
}

/** DOM mutation summary */
export interface DomMutationSummary {
  type: 'childList' | 'attributes' | 'characterData';
  target: string;
  added?: number;
  removed?: number;
  attr?: string;
}

/** Eval request sent to page context */
export interface EvalRequest {
  __devtools_eval_request__: true;
  expression: string;
  id: string;
}

/** Eval response from page context */
export interface EvalResponse {
  __devtools_eval_response__: true;
  id: string;
  result: SerializedArg;
  isError: boolean;
}

// =============================================
// Messages sent from panel → background → content
// =============================================

export type PanelToBackgroundMessage =
  | { type: 'init'; tabId: number }
  | { type: 'eval-in-page'; tabId: number; expression: string }
  | { type: 'get-page-sources'; tabId: number }
  | { type: 'get-dom-tree'; tabId: number }
  | { type: 'highlight-element'; tabId: number; selector: string }
  | { type: 'unhighlight-element'; tabId: number }
  | { type: 'get-element-styles'; tabId: number; selector: string }
  | { type: 'start-inspect-mode'; tabId: number }
  | { type: 'stop-inspect-mode'; tabId: number }
  | { type: 'get-event-listeners'; tabId: number; selector: string }
  | {
      type: 'force-element-state';
      tabId: number;
      selector: string;
      pseudoClass: string;
      enable: boolean;
    }
  | { type: 'copy-element-html'; tabId: number; selector: string }
  | { type: 'copy-element-selector'; tabId: number; selector: string }
  | { type: 'scroll-into-view'; tabId: number; selector: string }
  | { type: 'delete-element'; tabId: number; selector: string }
  | {
      type: 'add-html-adjacent';
      tabId: number;
      selector: string;
      position: string;
      html: string;
    }
  | { type: 'edit-outer-html'; tabId: number; selector: string; html: string }
  | { type: 'start-dom-observer'; tabId: number }
  | { type: 'stop-dom-observer'; tabId: number }
  | { type: 'get-cookies'; tabId: number }
  | { type: 'delete-cookie'; tabId: number; url: string; name: string }
  | { type: 'get-storage'; tabId: number; storageType: string }
  | { type: 'set-blocked-urls'; tabId: number; urls: string[] }
  | { type: 'set-selected-element'; tabId: number; selector: string }
  | { type: 'apply-device-emulation'; tabId: number; width: number; height: number; deviceScaleFactor: number; mobile: boolean }
  | { type: 'reset-device-emulation'; tabId: number };

// =============================================
// Messages sent from background → panel
// =============================================

export type BackgroundToPanelMessage =
  | ConsoleMessage
  | { type: 'network'; data: NetworkRequestData }
  | { type: 'dom-tree'; data: DomTreeNode | null }
  | { type: 'page-sources'; data: SourceFile[] }
  | { type: 'element-styles'; data: ElementStylesData | null }
  | { type: 'eval-result'; result: EvalResponse }
  | { type: 'event-listeners'; data: EventListenerInfo[] }
  | { type: 'dom-mutation'; mutations: DomMutationSummary[] }
  | { type: 'copy-html-result'; data: string | null }
  | { type: 'copy-selector-result'; data: string | null }
  | { type: 'delete-element-result'; data: boolean }
  | { type: 'add-html-result'; data: boolean }
  | { type: 'edit-html-result'; data: boolean }
  | { type: 'cookies-data'; data: chrome.cookies.Cookie[] }
  | { type: 'cookie-deleted'; name: string }
  | { type: 'storage-data'; storageType: string; data: { key: string; value: string }[] }
  | { type: 'force-state-result'; data: boolean }
  | WebSocketMessage
  | { type: 'inspect-element-selected'; selector: string; tagName: string; id: string; className: string }
  | { type: 'inspect-mode-cancelled' }
  | { type: 'device-emulation-applied'; success: boolean; error?: string }
  | { type: 'device-emulation-reset'; success: boolean; error?: string };
