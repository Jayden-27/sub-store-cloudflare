/**
 * Design tokens v2 — neutral, minimal visual language.
 * Colours stay in src/themes/* (runtime-switched); semantic aliases below give
 * components a stable API. Generated output: src/styles/tokens.css.
 */

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  12: 48,
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 14,
} as const;

export const fontSize = {
  xs: 12,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 22,
} as const;

export const leading = {
  tight: 1.35,
  normal: 1.6,
} as const;

export const zIndex = {
  dropdown: 1000,
  sticky: 1200,
  dialog: 2000,
  toast: 3000,
} as const;

export const motion = {
  fast: '120ms',
  base: '200ms',
} as const;

export const field = {
  height: 38,
  width: 280,
} as const;

export const shadows = {
  1: '0 1px 2px rgba(16, 24, 40, 0.04)',
  2: '0 8px 24px rgba(16, 24, 40, 0.10)',
} as const;

/** Static variables generated into :root. */
export const staticVariables: Record<string, string> = {
  ...Object.fromEntries(Object.entries(spacing).map(([key, value]) => [`ui-space-${key}`, `${value}px`])),
  ...Object.fromEntries(Object.entries(radius).map(([key, value]) => [`ui-radius-${key}`, `${value}px`])),
  ...Object.fromEntries(Object.entries(fontSize).map(([key, value]) => [`ui-font-${key}`, `${value}px`])),
  ...Object.fromEntries(Object.entries(leading).map(([key, value]) => [`ui-leading-${key}`, String(value)])),
  ...Object.fromEntries(Object.entries(zIndex).map(([key, value]) => [`ui-z-${key}`, String(value)])),
  ...Object.fromEntries(Object.entries(motion).map(([key, value]) => [`ui-duration-${key}`, value])),
  ...Object.fromEntries(Object.entries(shadows).map(([key, value]) => [`ui-shadow-${key}`, value])),
  'ui-field-height': `${field.height}px`,
  'ui-field-width': `${field.width}px`,
  'ui-font-sans':
    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
};

/**
 * Semantic aliases. Values reference theme variables set at runtime by useThemes,
 * so switching themes keeps working without regenerating anything.
 */
export const semanticAliases: Record<string, string> = {
  'ui-surface-page': 'var(--background-color)',
  'ui-surface-card': 'var(--card-color)',
  'ui-surface-raised': 'var(--popup-color)',
  'ui-surface-field': 'var(--field-background-color, var(--card-color))',
  'ui-text-primary': 'var(--primary-text-color)',
  'ui-text-secondary': 'var(--second-text-color)',
  'ui-text-tertiary': 'var(--comment-text-color)',
  'ui-border': 'var(--border-color, var(--divider-color))',
  'ui-border-strong': 'var(--border-strong-color, var(--border-color, var(--divider-color)))',
  'ui-border-subtle': 'var(--divider-color)',
  'ui-border-field': 'var(--field-border-color, var(--border-color, var(--divider-color)))',
  'ui-accent': 'var(--primary-color)',
  'ui-danger': 'var(--danger-color)',
};
