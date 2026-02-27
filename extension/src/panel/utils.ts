/**
 * Shared utility functions used across panel modules.
 */

export function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' kB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function formatTime(ms: number): string {
  if (ms < 1000) return ms + ' ms';
  return (ms / 1000).toFixed(2) + ' s';
}

export function getFileName(url: string): string {
  try {
    const u = new URL(url, window.location.href);
    return u.pathname.split('/').pop() || u.hostname;
  } catch {
    return url.length > 60 ? '...' + url.slice(-57) : url;
  }
}

/** Show a brief toast notification */
export function showToast(msg: string): void {
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

/** Show a custom context menu */
export function showContextMenu(
  x: number,
  y: number,
  items: { label: string; action: () => void }[]
): void {
  const existing = document.querySelector('.custom-context-menu');
  if (existing) existing.remove();

  const menu = document.createElement('div');
  menu.className = 'custom-context-menu';
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  items.forEach((item) => {
    const el = document.createElement('div');
    el.className = 'context-menu-item';
    el.textContent = item.label;
    el.addEventListener('click', () => {
      menu.remove();
      item.action();
    });
    menu.appendChild(el);
  });
  document.body.appendChild(menu);
  setTimeout(() => {
    document.addEventListener(
      'click',
      function closeMenu() {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    );
  }, 0);
}

/** Inline editing helper */
export function makeEditable(
  element: HTMLElement,
  currentValue: string,
  onSave: (newVal: string) => void,
  onEditStart?: () => void,
  onEditEnd?: () => void
): void {
  onEditStart?.();
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'inline-edit-input';
  input.value = currentValue;
  const originalText = element.textContent || '';
  element.textContent = '';
  element.appendChild(input);
  input.focus();
  input.select();

  function save(): void {
    const newVal = input.value;
    if (element.contains(input)) element.removeChild(input);
    onEditEnd?.();
    if (newVal !== currentValue) {
      onSave(newVal);
    } else {
      element.textContent = originalText;
    }
  }

  input.addEventListener('blur', save);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      save();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onEditEnd?.();
      element.textContent = originalText;
    }
  });
}
