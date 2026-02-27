# `debugger` Permission — Justification for Chrome Web Store Review

## Summary

ALT-DEV TOOLS requests the `debugger` permission to enable the **Device Emulation** panel, which allows developers to simulate how a webpage looks on different screen sizes and device types — the same feature available in Chrome DevTools under the "Toggle Device Toolbar" (Ctrl+Shift+M).

---

## What the `debugger` Permission Does

The Chrome `debugger` API allows extensions to attach to a tab and send commands using the [Chrome DevTools Protocol (CDP)](https://chromedevtools.github.io/devtools-protocol/). This is the same underlying protocol used by Chrome DevTools itself.

---

## Specific Usage in ALT-DEV TOOLS

### Feature: Device Emulation Panel

**File:** `src/background/service-worker.ts`

The extension uses exactly **two CDP commands**, both scoped to the `Emulation` domain:

### 1. Apply Device Emulation — `Emulation.setDeviceMetricsOverride`

When the user selects a device preset (e.g. "iPhone 14", "iPad") or enters custom dimensions in the Device Panel:

```typescript
chrome.debugger.attach({ tabId }, '1.3', () => {
  chrome.debugger.sendCommand({ tabId }, 'Emulation.setDeviceMetricsOverride', {
    width,           // e.g. 390
    height,          // e.g. 844
    deviceScaleFactor, // e.g. 3 (for Retina)
    mobile,          // true for mobile devices
  });
});
```

**Why:** The only way to programmatically change the viewport dimensions and simulate a mobile device from a Chrome extension is through the CDP `Emulation.setDeviceMetricsOverride` command. This is not achievable via any other extension API.

### 2. Reset Device Emulation — `Emulation.clearDeviceMetricsOverride`

When the user clicks "Reset" to restore normal desktop viewport:

```typescript
chrome.debugger.sendCommand({ tabId }, 'Emulation.clearDeviceMetricsOverride', {});
chrome.debugger.detach({ tabId });
```

**Why:** This restores the page to its original viewport and cleanly detaches the debugger session so no background connection remains.

---

## User Experience

- The `debugger` is only attached when the user **explicitly activates** device emulation from the Device Panel.
- The `debugger` is **immediately detached** when the user resets the emulation.
- A yellow Chrome banner ("ALT-DEV TOOLS has started debugging this browser") is shown to the user as required by Chrome — this is expected and intentional.
- No breakpoints, script execution, or network interception is performed. Only viewport metrics are changed.

---

## What This Permission Does NOT Do

| ❌ Not Used | ✅ Actually Used |
|---|---|
| Script injection/evaluation | Viewport size override only |
| Breakpoint setting | `Emulation.setDeviceMetricsOverride` only |
| Network interception | `Emulation.clearDeviceMetricsOverride` only |
| DOM manipulation | — |
| Cookie or storage access via CDP | — |
| Accessing other extensions or tabs | Only the current active tab |

---

## Why This is the Minimum Necessary Permission

There is no alternative API to simulate device viewport changes:

- `chrome.tabs` API: Cannot change viewport dimensions.
- `chrome.scripting` API: `window.innerWidth` is read-only and cannot be set by scripts.
- CSS `@viewport` injection: Only changes CSS viewport, not the actual browser viewport used by media queries.
- `chrome.debugger` with `Emulation.setDeviceMetricsOverride`: The **only** method that correctly simulates device viewport, device pixel ratio, and touch emulation — exactly as Chrome DevTools does it.

---

## Reviewer Testing Instructions

1. Install the extension from the Chrome Web Store.
2. Open the ALT-DEV TOOLS sidebar (click the extension icon → open sidebar).
3. Navigate to the **Device** tab (Pro feature — use license key `ALTDEV-REVIEW-2025-CHROME-STORE`).
4. Select any device preset from the dropdown (e.g. "iPhone 14").
5. Observe: Chrome will show the "ALT-DEV TOOLS has started debugging..." banner, and the page will resize to match the selected device.
6. Click "Reset" to restore the original viewport. The debugger session is detached.

---

## Code Reference

- **Permission declaration:** `src/manifest.ts` → `permissions: [..., 'debugger', ...]`
- **Attach & emulate:** `src/background/service-worker.ts` → `case 'apply-device-emulation'` (lines ~286–305)
- **Reset & detach:** `src/background/service-worker.ts` → `case 'reset-device-emulation'` (lines ~307–313)
