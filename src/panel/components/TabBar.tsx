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
} from './widgets/Icons';

export function TabBar() {
  return (
    <div class="tab-bar">
      <div class="tab active" data-tab="elements">
        <span class="tab-icon"><IconElements /></span>
        Elements
      </div>
      <div class="tab" data-tab="console">
        <span class="tab-icon"><IconConsole /></span>
        Console
      </div>
      <div class="tab" data-tab="sources">
        <span class="tab-icon"><IconSources /></span>
        Sources
      </div>
      <div class="tab" data-tab="network">
        <span class="tab-icon"><IconNetwork /></span>
        Network
      </div>
      <div class="tab" data-tab="application">
        <span class="tab-icon"><IconApplication /></span>
        Application
      </div>
      <div class="tab" data-tab="performance">
        <span class="tab-icon"><IconPerformance /></span>
        Performance
      </div>
      <div class="tab" data-tab="device">
        <span class="tab-icon"><IconDevice /></span>
        Device
      </div>
    </div>
  );
}
