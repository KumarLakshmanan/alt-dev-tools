/**
 * TabBar.tsx — Seven-tab navigation strip rendered as a Preact JSX component.
 */
import {
  IconElements,
  IconConsole,
  IconSources,
  IconNetwork,
  IconApplication,
  IconPerformance,
  IconDevice,
  IconLicense,
  IconSecurity,
} from './widgets/Icons';

export function TabBar() {
  return (
    <div class="tab-bar">
      <div class="tab active" data-tab="elements" title="Inspect and edit DOM elements">
        <span class="tab-icon"><IconElements /></span>
        Elements
      </div>
      <div class="tab" data-tab="console" title="View console logs and evaluate expressions">
        <span class="tab-icon"><IconConsole /></span>
        Console
      </div>
      <div class="tab" data-tab="sources" title="Browse page resources and source files">
        <span class="tab-icon"><IconSources /></span>
        Sources
      </div>
      <div class="tab" data-tab="network" title="Monitor network requests">
        <span class="tab-icon"><IconNetwork /></span>
        Network
      </div>
      <div class="tab" data-tab="application" title="Inspect storage, cookies, service workers and manifest">
        <span class="tab-icon"><IconApplication /></span>
        Application
      </div>
      <div class="tab" data-tab="performance" title="Measure page performance metrics">
        <span class="tab-icon"><IconPerformance /></span>
        Performance
      </div>
      <div class="tab" data-tab="security" title="Check security settings and mixed content">
        <span class="tab-icon"><IconSecurity /></span>
        Security
      </div>
      <div class="tab" data-tab="device" title="Emulate different device viewports">
        <span class="tab-icon"><IconDevice /></span>
        Device
      </div>
      <div class="tab tab-license" data-tab="license" title="Manage your Alt DevTools license">
        <span class="tab-icon"><IconLicense /></span>
        License
      </div>
    </div>
  );
}
