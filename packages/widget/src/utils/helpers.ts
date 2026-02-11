/** Generate a short unique ID */
export function uid(): string {
  return Math.random().toString(36).substring(2, 10);
}

/** Preset annotation colors */
export const COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#000000', // black
  '#ffffff', // white
] as const;

export const DEFAULT_COLOR = COLORS[0]!;
export const DEFAULT_STROKE_WIDTH = 3;

export const DEFAULT_ACCENT_COLOR = '#6366f1'; // indigo

export const WIDGET_HOST_ID = 'kan-widget-host';

/** Sanitize a filename for S3 upload */
export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 200);
}
