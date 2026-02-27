/**
 * Shared constants used across background, content, and panel.
 */

export const PORT_NAME = 'devtools-sidebar';
export const MARKER = '__devtools_sidebar__';
export const EVAL_REQUEST_KEY = '__devtools_eval_request__';
export const EVAL_RESPONSE_KEY = '__devtools_eval_response__';
export const HIGHLIGHT_ID = '__devtools_highlight__';
export const INSPECT_OVERLAY_ID = '__devtools_inspect_overlay__';
export const INSPECT_TOOLTIP_ID = '__devtools_inspect_tooltip__';
export const SET_BLOCKED_URLS_KEY = '__devtools_set_blocked_urls__';
export const SET_SELECTED_ELEMENT_KEY = '__devtools_set_selected_element__';

/** Max recursion depth for DOM serialization */
export const MAX_DOM_DEPTH = 15;

/** Max children per node when serializing */
export const MAX_CHILDREN_PER_NODE = 100;

/** Max serializable string lengths */
export const MAX_RESPONSE_BODY_LENGTH = 10000;
export const MAX_REQUEST_BODY_LENGTH = 2000;
export const MAX_ATTRIBUTE_LENGTH = 200;
