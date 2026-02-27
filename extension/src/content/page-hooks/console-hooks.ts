/**
 * Console method hooks — intercept all console calls
 * and forward structured data to the devtools panel.
 */

import { MARKER } from '@/shared/constants';
import { serializeArg } from './serializer';

type ConsoleMethods =
  | 'log' | 'warn' | 'error' | 'info' | 'debug' | 'clear' | 'table' | 'dir'
  | 'count' | 'assert' | 'trace' | 'group' | 'groupCollapsed' | 'groupEnd'
  | 'time' | 'timeEnd' | 'timeLog';

const METHODS: ConsoleMethods[] = [
  'log', 'warn', 'error', 'info', 'debug', 'clear', 'table', 'dir',
  'count', 'assert', 'trace', 'group', 'groupCollapsed', 'groupEnd',
  'time', 'timeEnd', 'timeLog',
];

const originalConsole: Record<string, (...args: unknown[]) => void> = {};
const timers: Record<string, number> = {};
const counters: Record<string, number> = {};
let groupDepth = 0;

function getCallStack(): string {
  try {
    throw new Error();
  } catch (e) {
    const lines = ((e as Error).stack || '').split('\n');
    for (let i = 4; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.includes('page-hooks')) return line;
    }
    return lines[4]?.trim() || '';
  }
}

export function hookConsole(): void {
  METHODS.forEach((method) => {
    originalConsole[method] = (console as unknown as Record<string, (...args: unknown[]) => void>)[method]
      ? (console as unknown as Record<string, (...args: unknown[]) => void>)[method].bind(console)
      : () => {};
  });

  // Clear
  console.clear = () => {
    originalConsole['clear']();
    window.postMessage({ [MARKER]: true, type: 'console', method: 'clear' }, '*');
  };

  // Group / GroupCollapsed
  (['group', 'groupCollapsed'] as const).forEach((method) => {
    (console as unknown as Record<string, (...args: unknown[]) => void>)[method] = (...args: unknown[]) => {
      originalConsole[method]?.(...args);
      groupDepth++;
      window.postMessage(
        {
          [MARKER]: true,
          type: 'console',
          method,
          args: args.length > 0 ? args.map((a) => serializeArg(a)) : [{ type: 'string', value: 'console.group' }],
          source: getCallStack(),
          timestamp: Date.now(),
          groupDepth,
        },
        '*'
      );
    };
  });

  // GroupEnd
  console.groupEnd = () => {
    originalConsole['groupEnd']?.();
    window.postMessage(
      {
        [MARKER]: true,
        type: 'console',
        method: 'groupEnd',
        args: [],
        source: '',
        timestamp: Date.now(),
        groupDepth,
      },
      '*'
    );
    groupDepth = Math.max(0, groupDepth - 1);
  };

  // Time
  console.time = (label = 'default') => {
    originalConsole['time']?.(label);
    timers[label] = performance.now();
  };

  // TimeEnd
  console.timeEnd = (label = 'default') => {
    originalConsole['timeEnd']?.(label);
    const start = timers[label];
    if (start !== undefined) {
      const elapsed = performance.now() - start;
      delete timers[label];
      window.postMessage(
        {
          [MARKER]: true,
          type: 'console',
          method: 'timeEnd',
          args: [{ type: 'string', value: `${label}: ${elapsed.toFixed(3)}ms` }],
          source: getCallStack(),
          timestamp: Date.now(),
        },
        '*'
      );
    }
  };

  // TimeLog
  console.timeLog = (label = 'default') => {
    originalConsole['timeLog']?.(label);
    const start = timers[label];
    if (start !== undefined) {
      const elapsed = performance.now() - start;
      window.postMessage(
        {
          [MARKER]: true,
          type: 'console',
          method: 'log',
          args: [{ type: 'string', value: `${label}: ${elapsed.toFixed(3)}ms` }],
          source: getCallStack(),
          timestamp: Date.now(),
        },
        '*'
      );
    }
  };

  // Count
  (console as unknown as Record<string, (...args: unknown[]) => void>)['count'] = (label = 'default') => {
    counters[label as string] = (counters[label as string] || 0) + 1;
    originalConsole['count']?.(label);
    window.postMessage(
      {
        [MARKER]: true,
        type: 'console',
        method: 'log',
        args: [{ type: 'string', value: `${label}: ${counters[label as string]}` }],
        source: getCallStack(),
        timestamp: Date.now(),
      },
      '*'
    );
  };

  // General methods: log, warn, error, info, debug, table, dir, assert, trace
  const generalMethods: ConsoleMethods[] = [
    'log', 'warn', 'error', 'info', 'debug', 'table', 'dir', 'assert', 'trace',
  ];
  generalMethods.forEach((method) => {
    (console as unknown as Record<string, (...args: unknown[]) => void>)[method] = (...args: unknown[]) => {
      originalConsole[method]?.(...args);
      window.postMessage(
        {
          [MARKER]: true,
          type: 'console',
          method,
          args: args.map((a) => serializeArg(a)),
          source: getCallStack(),
          timestamp: Date.now(),
          groupDepth,
        },
        '*'
      );
    };
  });
}
