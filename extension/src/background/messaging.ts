/**
 * Safely send a message to a content script tab, re-injecting if necessary.
 */
export function safeSendToTab(
  tabId: number,
  message: unknown,
  callback?: (response: unknown) => void
): void {
  chrome.tabs.sendMessage(tabId, message, undefined as any, (response: any) => {
    const err = (chrome.runtime as any).lastError;
    if (err) {
      // Content script not available — try injecting it
      chrome.scripting
        .executeScript({
          target: { tabId },
          files: ['src/content/content-script.ts'],
        })
        .then(() =>
          chrome.scripting.executeScript({
            target: { tabId },
            files: ['src/content/page-hooks.ts'],
            world: 'MAIN' as chrome.scripting.ExecutionWorld,
          })
        )
        .then(() => {
          setTimeout(() => {
            chrome.tabs.sendMessage(tabId, message, undefined as any, (retryResponse: any) => {
              const retryErr = (chrome.runtime as any).lastError;
              if (retryErr) {
                callback?.(null);
              } else {
                callback?.(retryResponse);
              }
            });
          }, 200);
        })
        .catch(() => callback?.(null));
    } else {
      callback?.(response);
    }
  });
}
