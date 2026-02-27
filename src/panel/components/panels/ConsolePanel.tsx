/**
 * ConsolePanel.tsx — Log output area, level filters, and expression evaluator.
 */
import { IconClear } from '../widgets/Icons';

export function ConsolePanel() {
  return (
    <div id="console-panel" class="panel">
      <div class="toolbar">
        <div class="toolbar-left">
          <button id="console-clear" class="toolbar-btn" title="Clear console">
            <IconClear />
          </button>
        </div>
        <div class="toolbar-center">
          <input type="text" id="console-filter" class="filter-input" placeholder="Filter" />
        </div>
        <div class="toolbar-right">
          <div class="level-filters">
            <label class="level-filter">
              <input type="checkbox" data-level="verbose" checked />
              <span class="level-badge verbose">Verbose</span>
            </label>
            <label class="level-filter">
              <input type="checkbox" data-level="info" checked />
              <span class="level-badge info">Info</span>
            </label>
            <label class="level-filter">
              <input type="checkbox" data-level="warn" checked />
              <span class="level-badge warn">Warnings</span>
            </label>
            <label class="level-filter">
              <input type="checkbox" data-level="error" checked />
              <span class="level-badge error">Errors</span>
            </label>
          </div>
        </div>
      </div>

      <div id="console-output" class="console-output" />

      <div class="console-input-area">
        <span class="prompt">&gt;</span>
        <input
          type="text"
          id="console-input"
          class="console-input"
          placeholder="Expression to evaluate..."
          spellcheck={false}
        />
      </div>
    </div>
  );
}
