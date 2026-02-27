/**
 * Argument serializer for console hooks.
 * Converts any JS value into a transferable object description.
 */

import type { SerializedArg } from '@/shared/types';

export function serializeArg(arg: unknown, depth = 0): SerializedArg {
  if (arg === null) return { type: 'null', value: 'null' };
  if (arg === undefined) return { type: 'undefined', value: 'undefined' };
  if (typeof arg === 'string') return { type: 'string', value: arg };
  if (typeof arg === 'number') return { type: 'number', value: String(arg) };
  if (typeof arg === 'boolean') return { type: 'boolean', value: String(arg) };
  if (typeof arg === 'symbol') return { type: 'symbol', value: String(arg) };
  if (typeof arg === 'function')
    return { type: 'function', value: `f ${(arg as { name?: string }).name || 'anonymous'}()` };
  if (arg instanceof Error)
    return { type: 'error', value: arg.stack || arg.message || String(arg) };
  if (arg instanceof HTMLElement)
    return { type: 'html', value: arg.outerHTML.substring(0, 500) };
  if (arg instanceof RegExp) return { type: 'regexp', value: String(arg) };
  if (arg instanceof Date) return { type: 'date', value: arg.toISOString() };

  if (arg instanceof Map) {
    const mapObj: Record<string, SerializedArg> = {};
    try {
      arg.forEach((v, k) => {
        mapObj[String(k)] = serializeArg(v, depth + 1);
      });
    } catch { /* ignore */ }
    return {
      type: 'map',
      value: `Map(${arg.size})`,
      preview: `Map(${arg.size})`,
      children: mapObj,
      expandable: depth < 3,
    };
  }

  if (arg instanceof Set) {
    const setArr: SerializedArg[] = [];
    try {
      arg.forEach((v) => setArr.push(serializeArg(v, depth + 1)));
    } catch { /* ignore */ }
    return {
      type: 'set',
      value: `Set(${arg.size})`,
      preview: `Set(${arg.size})`,
      items: setArr,
      expandable: depth < 3,
    };
  }

  if (Array.isArray(arg)) {
    if (depth < 3) {
      const arrItems: SerializedArg[] = [];
      try {
        for (let i = 0; i < Math.min(arg.length, 50); i++) {
          arrItems.push(serializeArg(arg[i], depth + 1));
        }
      } catch { /* ignore */ }
      const preview =
        `(${arg.length}) [` +
        arg
          .slice(0, 5)
          .map((v) => {
            try {
              return typeof v === 'string'
                ? `"${v.substring(0, 30)}"`
                : String(v).substring(0, 30);
            } catch {
              return '?';
            }
          })
          .join(', ') +
        (arg.length > 5 ? ', ...' : '') +
        ']';
      return {
        type: 'array',
        value: preview,
        preview,
        items: arrItems,
        length: arg.length,
        expandable: true,
      };
    }
    try {
      return { type: 'array', value: JSON.stringify(arg, null, 2).substring(0, 5000) };
    } catch {
      return { type: 'array', value: String(arg) };
    }
  }

  if (typeof arg === 'object') {
    if (depth < 3) {
      const children: Record<string, SerializedArg> = {};
      let keys: string[] = [];
      try {
        keys = Object.keys(arg as object);
      } catch { /* ignore */ }

      const preview =
        '{' +
        keys
          .slice(0, 5)
          .map((k) => {
            try {
              const v = (arg as Record<string, unknown>)[k];
              const vs =
                typeof v === 'string'
                  ? `"${v.substring(0, 20)}"`
                  : typeof v === 'object' && v !== null
                    ? Array.isArray(v)
                      ? `Array(${v.length})`
                      : '{...}'
                    : String(v).substring(0, 30);
              return `${k}: ${vs}`;
            } catch {
              return `${k}: ?`;
            }
          })
          .join(', ') +
        (keys.length > 5 ? ', ...' : '') +
        '}';

      try {
        for (let j = 0; j < Math.min(keys.length, 100); j++) {
          children[keys[j]] = serializeArg(
            (arg as Record<string, unknown>)[keys[j]],
            depth + 1
          );
        }
      } catch { /* ignore */ }

      let ctorName = '';
      try {
        ctorName =
          (arg as object).constructor?.name !== 'Object'
            ? (arg as object).constructor.name + ' '
            : '';
      } catch { /* ignore */ }

      return {
        type: 'object',
        value: ctorName + preview,
        preview: ctorName + preview,
        children,
        expandable: keys.length > 0,
      };
    }
    try {
      return { type: 'object', value: JSON.stringify(arg, null, 2).substring(0, 5000) };
    } catch {
      return { type: 'object', value: String(arg) };
    }
  }

  return { type: 'string', value: String(arg) };
}
