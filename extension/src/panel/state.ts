/**
 * Panel application state.
 */

import type {
  DomTreeNode,
  EventListenerInfo,
  NetworkRequestData,
  SourceFile,
  IndexedDBDatabase,
  CacheStorageData,
  ServiceWorkerData,
  WebManifestData,
} from '@/shared/types';

export interface PanelState {
  activeTab: string;
  tabId: number | null;
  elements: {
    domTree: DomTreeNode | null;
    selectedSelector: string | null;
    eventListeners: EventListenerInfo[];
    forcedStates: Record<string, boolean>;
  };
  console: {
    entries: ConsoleEntry[];
    filter: string;
    levels: Record<string, boolean>;
    commandHistory: string[];
    historyIndex: number;
    groupDepth: number;
    showTimestamps: boolean;
  };
  network: {
    entries: NetworkRequestData[];
    filter: string;
    typeFilter: string;
    preserveLog: boolean;
    selectedEntry: NetworkRequestData | null;
    detailTab: string;
    sortColumn: string | null;
    sortDirection: 'asc' | 'desc';
    searchQuery: string;
    blockedUrls: string[];
    websockets: Record<string, { url: string; status: string; timestamp: number }>;
    wsFrames: WsFrame[];
  };
  sources: {
    files: SourceFile[];
    selectedFile: SourceFile | null;
    searchQuery: string;
    prettyPrinted: boolean;
  };
  application: {
    activeSection: string;
    cookies: chrome.cookies.Cookie[];
    localStorage: StorageItem[];
    sessionStorage: StorageItem[];
    indexedDB: IndexedDBDatabase[];
    caches: CacheStorageData[];
    serviceWorkers: ServiceWorkerData[];
    manifest: WebManifestData | null;
    filter: string;
  };
}

export interface ConsoleEntry {
  method: string;
  args: { type: string; value: string; [key: string]: unknown }[];
  source: string;
  timestamp: number;
  groupDepth: number;
}

export interface WsFrame {
  id: string;
  url: string;
  direction: string;
  data: string;
  timestamp: number;
}

export interface StorageItem {
  key: string;
  value: string;
}

export function createInitialState(): PanelState {
  return {
    activeTab: 'elements',
    tabId: null,
    elements: {
      domTree: null,
      selectedSelector: null,
      eventListeners: [],
      forcedStates: {},
    },
    console: {
      entries: [],
      filter: '',
      levels: { verbose: true, info: true, warn: true, error: true },
      commandHistory: [],
      historyIndex: -1,
      groupDepth: 0,
      showTimestamps: false,
    },
    network: {
      entries: [],
      filter: '',
      typeFilter: 'all',
      preserveLog: false,
      selectedEntry: null,
      detailTab: 'headers',
      sortColumn: null,
      sortDirection: 'asc',
      searchQuery: '',
      blockedUrls: [],
      websockets: {},
      wsFrames: [],
    },
    sources: {
      files: [],
      selectedFile: null,
      searchQuery: '',
      prettyPrinted: false,
    },
    application: {
      activeSection: 'cookies',
      cookies: [],
      localStorage: [],
      sessionStorage: [],
      indexedDB: [],
      caches: [],
      serviceWorkers: [],
      manifest: null,
      filter: '',
    },
  };
}
