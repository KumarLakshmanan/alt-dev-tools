/**
 * ElementsPanel.tsx — DOM inspector panel with tree view, styles pane,
 * force-state controls, box model, and element action buttons.
 */
import {
  IconInspect,
  IconRefresh,
  IconTarget,
  IconCopy,
  IconCrosshair,
  IconTrash,
  IconPlusSquare,
  IconArrowUp,
  IconArrowDown,
} from '../widgets/Icons';

export function ElementsPanel() {
  return (
    <div id="elements-panel" class="panel active">
      <div class="elements-layout">

        {/* ── DOM Tree column ── */}
        <div class="elements-dom">
          <div class="toolbar">
            <div class="toolbar-left">
              <button
                id="elements-inspect"
                class="toolbar-btn"
                title="Select an element in the page to inspect it (Ctrl+Shift+C)"
              >
                <IconInspect />
              </button>
              <button id="elements-refresh" class="toolbar-btn" title="Refresh DOM tree">
                <IconRefresh />
              </button>
            </div>
            <div class="toolbar-center">
              <input
                type="text"
                id="elements-search"
                class="filter-input"
                placeholder="Search by tag, class, or id..."
              />
            </div>
          </div>
          <div id="elements-tree" class="elements-tree-content" />
        </div>

        {/* ── Styles / properties pane ── */}
        <div class="elements-styles-pane">
          <div class="styles-tabs">
            <button class="styles-tab-btn active" data-styles-tab="styles">Styles</button>
            <button class="styles-tab-btn" data-styles-tab="event-listeners">Event Listeners</button>
          </div>

          <div id="styles-tab-styles" class="styles-tab-content active">
            <div id="elements-styles" class="elements-styles-content">
              <div class="sources-placeholder">Select an element to view its styles</div>
            </div>
          </div>

          <div id="styles-tab-event-listeners" class="styles-tab-content">
            <div id="elements-event-listeners" class="elements-styles-content">
              <div class="sources-placeholder">Select an element to view event listeners</div>
            </div>
          </div>

          <div class="styles-header">Force State</div>
          <div id="elements-force-state" class="force-state-container">
            <label class="force-state-label"><input type="checkbox" data-pseudo=":hover" /> :hover</label>
            <label class="force-state-label"><input type="checkbox" data-pseudo=":active" /> :active</label>
            <label class="force-state-label"><input type="checkbox" data-pseudo=":focus" /> :focus</label>
            <label class="force-state-label"><input type="checkbox" data-pseudo=":visited" /> :visited</label>
            <label class="force-state-label"><input type="checkbox" data-pseudo=":focus-within" /> :focus-within</label>
          </div>

          <div class="styles-header">Box Model</div>
          <div id="elements-box-model" class="box-model-container">
            <div class="sources-placeholder">Select an element to view box model</div>
          </div>

          <div class="styles-header">Actions</div>
          <div class="element-actions">
            <button id="elem-scroll-into-view" class="action-btn" title="Scroll into view">
              <IconTarget /> Scroll
            </button>
            <button id="elem-copy-html" class="action-btn" title="Copy outerHTML">
              <IconCopy /> HTML
            </button>
            <button id="elem-copy-selector" class="action-btn" title="Copy CSS selector">
              <IconCrosshair /> Selector
            </button>
            <button id="elem-delete" class="action-btn action-btn-danger" title="Delete element">
              <IconTrash size={12} /> Delete
            </button>
            <button id="elem-add-child" class="action-btn" title="Add child element">
              <IconPlusSquare /> Child
            </button>
            <button id="elem-add-before" class="action-btn" title="Insert element before">
              <IconArrowUp /> Before
            </button>
            <button id="elem-add-after" class="action-btn" title="Insert element after">
              <IconArrowDown /> After
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
