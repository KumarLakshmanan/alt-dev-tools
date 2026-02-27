/**
 * App.tsx — Root Preact component that assembles all panel widgets.
 *
 * Rendered once into `#app` by panel.ts via `preact/render`.
 * All child components produce static DOM — the existing tabs/*.ts modules
 * then attach event listeners by querying element IDs as usual.
 */
import { TabBar } from './TabBar';
import { ElementsPanel } from './panels/ElementsPanel';
import { ConsolePanel } from './panels/ConsolePanel';
import { NetworkPanel } from './panels/NetworkPanel';
import { SourcesPanel } from './panels/SourcesPanel';
import { ApplicationPanel } from './panels/ApplicationPanel';
import { PerformancePanel } from './panels/PerformancePanel';
import { DevicePanel } from './panels/DevicePanel';
import { LicensePanel } from './panels/LicensePanel';

export function App() {
  return (
    <>
      <TabBar />
      <ElementsPanel />
      <ConsolePanel />
      <NetworkPanel />
      <SourcesPanel />
      <ApplicationPanel />
      <PerformancePanel />
      <DevicePanel />
      <LicensePanel />
    </>
  );
}
