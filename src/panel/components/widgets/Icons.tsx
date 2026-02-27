/**
 * Icons.tsx — Preact JSX SVG icon components used across all panel widgets.
 *
 * Each exported component accepts an optional `size` prop (px) and renders
 * a pure inline SVG — no external fonts or image requests required.
 *
 * Icon groups:
 *   Tab bar icons     — default 12 px
 *   Toolbar icons     — default 14 px  (Inspect = 16 px)
 *   Action buttons    — default 12 px
 *   Sidebar nav       — default 14 px
 */
import type { ComponentChildren } from 'preact';

// ── Internal SVG wrapper ────────────────────────────────────────────────────

interface SvgProps {
  size: number;
  round?: boolean;
  children: ComponentChildren;
}

function SvgIcon({ size, round = true, children }: SvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap={round ? 'round' : undefined}
      strokeLinejoin={round ? 'round' : undefined}
    >
      {children}
    </svg>
  );
}

// ── Tab bar icons (default 12 px) ───────────────────────────────────────────

export function IconElements({ size = 12 }: { size?: number }) {
  return (
    <SvgIcon size={size}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </SvgIcon>
  );
}

export function IconConsole({ size = 12 }: { size?: number }) {
  return (
    <SvgIcon size={size}>
      <polyline points="4 17 10 11 4 5" />
      <line x1={12} y1={19} x2={20} y2={19} />
    </SvgIcon>
  );
}

export function IconSources({ size = 12 }: { size?: number }) {
  return (
    <SvgIcon size={size}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1={10} y1={13} x2={8} y2={13} />
      <line x1={16} y1={17} x2={8} y2={17} />
    </SvgIcon>
  );
}

export function IconNetwork({ size = 12 }: { size?: number }) {
  return (
    <SvgIcon size={size}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </SvgIcon>
  );
}

export function IconApplication({ size = 12 }: { size?: number }) {
  return (
    <SvgIcon size={size}>
      <ellipse cx={12} cy={5} rx={9} ry={3} />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </SvgIcon>
  );
}

// ── Toolbar icons (default 14–16 px) ────────────────────────────────────────

export function IconInspect({ size = 16 }: { size?: number }) {
  return (
    <SvgIcon size={size} round={false}>
      <rect x={3} y={3} width={7} height={7} />
      <line x1={21} y1={3} x2={14} y2={10} />
      <line x1={3} y1={21} x2={10} y2={14} />
    </SvgIcon>
  );
}

export function IconRefresh({ size = 14 }: { size?: number }) {
  return (
    <SvgIcon size={size} round={false}>
      <path d="M1 4v6h6M23 20v-6h-6" />
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
    </SvgIcon>
  );
}

export function IconClear({ size = 14 }: { size?: number }) {
  return (
    <SvgIcon size={size} round={false}>
      <circle cx={12} cy={12} r={10} />
      <line x1={15} y1={9} x2={9} y2={15} />
      <line x1={9} y1={9} x2={15} y2={15} />
    </SvgIcon>
  );
}

export function IconDownload({ size = 14 }: { size?: number }) {
  return (
    <SvgIcon size={size}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1={12} y1={15} x2={12} y2={3} />
    </SvgIcon>
  );
}

export function IconBlock({ size = 14 }: { size?: number }) {
  return (
    <SvgIcon size={size}>
      <circle cx={12} cy={12} r={10} />
      <line x1={4.93} y1={4.93} x2={19.07} y2={19.07} />
    </SvgIcon>
  );
}

export function IconSearch({ size = 14 }: { size?: number }) {
  return (
    <SvgIcon size={size}>
      <circle cx={11} cy={11} r={8} />
      <line x1={21} y1={21} x2={16.65} y2={16.65} />
    </SvgIcon>
  );
}

export function IconTrash({ size = 14 }: { size?: number }) {
  return (
    <SvgIcon size={size}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </SvgIcon>
  );
}

// ── Element action button icons (default 12 px) ──────────────────────────────

export function IconTarget({ size = 12 }: { size?: number }) {
  return (
    <SvgIcon size={size}>
      <circle cx={12} cy={12} r={10} />
      <circle cx={12} cy={12} r={3} />
    </SvgIcon>
  );
}

export function IconCopy({ size = 12 }: { size?: number }) {
  return (
    <SvgIcon size={size}>
      <rect x={9} y={9} width={13} height={13} rx={2} ry={2} />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </SvgIcon>
  );
}

export function IconCrosshair({ size = 12 }: { size?: number }) {
  return (
    <SvgIcon size={size}>
      <circle cx={12} cy={12} r={10} />
      <line x1={22} y1={12} x2={18} y2={12} />
      <line x1={6} y1={12} x2={2} y2={12} />
      <line x1={12} y1={2} x2={12} y2={6} />
      <line x1={12} y1={18} x2={12} y2={22} />
    </SvgIcon>
  );
}

export function IconPlusSquare({ size = 12 }: { size?: number }) {
  return (
    <SvgIcon size={size}>
      <rect x={3} y={3} width={18} height={18} rx={2} ry={2} />
      <line x1={12} y1={8} x2={12} y2={16} />
      <line x1={8} y1={12} x2={16} y2={12} />
    </SvgIcon>
  );
}

export function IconArrowUp({ size = 12 }: { size?: number }) {
  return (
    <SvgIcon size={size}>
      <line x1={12} y1={19} x2={12} y2={5} />
      <polyline points="5 12 12 5 19 12" />
    </SvgIcon>
  );
}

export function IconArrowDown({ size = 12 }: { size?: number }) {
  return (
    <SvgIcon size={size}>
      <line x1={12} y1={5} x2={12} y2={19} />
      <polyline points="19 12 12 19 5 12" />
    </SvgIcon>
  );
}

// ── Application sidebar nav icons (default 14 px) ────────────────────────────

export function IconCookies({ size = 14 }: { size?: number }) {
  return (
    <SvgIcon size={size}>
      <circle cx={12} cy={12} r={10} />
      <circle cx={8} cy={9} r={1} fill="currentColor" />
      <circle cx={15} cy={14} r={1} fill="currentColor" />
      <circle cx={11} cy={16} r={1} fill="currentColor" />
    </SvgIcon>
  );
}

export function IconStorage({ size = 14 }: { size?: number }) {
  return (
    <SvgIcon size={size}>
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x={1} y={3} width={22} height={5} />
      <line x1={10} y1={12} x2={14} y2={12} />
    </SvgIcon>
  );
}

export function IconClipboard({ size = 14 }: { size?: number }) {
  return (
    <SvgIcon size={size}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x={8} y={2} width={8} height={4} rx={1} ry={1} />
    </SvgIcon>
  );
}

export function IconPerformance({ size = 12 }: { size?: number }) {
  return (
    <SvgIcon size={size}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </SvgIcon>
  );
}

export function IconDevice({ size = 12 }: { size?: number }) {
  return (
    <SvgIcon size={size}>
      <rect x={5} y={2} width={14} height={20} rx={2} ry={2} />
      <line x1={12} y1={18} x2={12.01} y2={18} />
    </SvgIcon>
  );
}
