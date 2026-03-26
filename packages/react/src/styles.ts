/**
 * CSS custom properties for AI-Me theming.
 * All prefixed with --ai-me- to avoid conflicts with host app styles.
 */
export const defaultThemeVars = {
  "--ai-me-primary": "#6366f1",
  "--ai-me-primary-hover": "#4f46e5",
  "--ai-me-bg": "#ffffff",
  "--ai-me-bg-secondary": "#f9fafb",
  "--ai-me-text": "#111827",
  "--ai-me-text-secondary": "#6b7280",
  "--ai-me-border": "#e5e7eb",
  "--ai-me-radius": "12px",
  "--ai-me-font": "system-ui, -apple-system, sans-serif",
  "--ai-me-shadow": "0 4px 24px rgba(0, 0, 0, 0.12)",
} as const;

export interface AIMeTheme {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  fontFamily?: string;
}

export function themeToVars(theme?: AIMeTheme): Record<string, string> {
  if (!theme) return {};
  const vars: Record<string, string> = {};
  if (theme.primaryColor) vars["--ai-me-primary"] = theme.primaryColor;
  if (theme.backgroundColor) vars["--ai-me-bg"] = theme.backgroundColor;
  if (theme.textColor) vars["--ai-me-text"] = theme.textColor;
  if (theme.borderRadius) vars["--ai-me-radius"] = theme.borderRadius;
  if (theme.fontFamily) vars["--ai-me-font"] = theme.fontFamily;
  return vars;
}
