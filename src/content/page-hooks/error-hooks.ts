/**
 * Error hooks — capture uncaught errors and unhandled promise rejections.
 */

import { MARKER } from '@/shared/constants';

export function hookErrors(): void {
  window.addEventListener('error', (event: ErrorEvent) => {
    window.postMessage(
      {
        [MARKER]: true,
        type: 'console',
        method: 'error',
        args: [
          {
            type: 'error',
            value:
              'Uncaught ' +
              (event.error
                ? event.error.stack || event.error.message
                : event.message),
          },
        ],
        source: `${event.filename}:${event.lineno}:${event.colno}`,
        timestamp: Date.now(),
      },
      '*'
    );
  });

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    let value: string;
    if (reason instanceof Error) {
      value = 'Uncaught (in promise) ' + (reason.stack || reason.message);
    } else {
      try {
        value = 'Uncaught (in promise) ' + JSON.stringify(reason);
      } catch {
        value = 'Uncaught (in promise) ' + String(reason);
      }
    }
    window.postMessage(
      {
        [MARKER]: true,
        type: 'console',
        method: 'error',
        args: [{ type: 'error', value }],
        source: '',
        timestamp: Date.now(),
      },
      '*'
    );
  });
}
