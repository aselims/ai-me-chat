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

/** Dark mode defaults — used when `colorScheme` is "dark" or "auto" (prefers-color-scheme). */
export const darkThemeVars = {
  "--ai-me-primary": "#818cf8",
  "--ai-me-primary-hover": "#6366f1",
  "--ai-me-bg": "#1a1a2e",
  "--ai-me-bg-secondary": "#16213e",
  "--ai-me-text": "#e5e5e5",
  "--ai-me-text-secondary": "#9ca3af",
  "--ai-me-border": "#374151",
  "--ai-me-radius": "12px",
  "--ai-me-font": "system-ui, -apple-system, sans-serif",
  "--ai-me-shadow": "0 4px 24px rgba(0, 0, 0, 0.3)",
} as const;

export interface AIMeTheme {
  primaryColor?: string;
  backgroundColor?: string;
  secondaryBackgroundColor?: string;
  textColor?: string;
  secondaryTextColor?: string;
  borderColor?: string;
  borderRadius?: string;
  fontFamily?: string;
  /**
   * Color scheme preference.
   * - "light": always use light theme (default)
   * - "dark": always use dark theme
   * - "auto": follow the user's OS / browser `prefers-color-scheme` setting
   */
  colorScheme?: "light" | "dark" | "auto";
}

export function themeToVars(theme?: AIMeTheme): Record<string, string> {
  if (!theme) return {};
  const vars: Record<string, string> = {};
  if (theme.primaryColor) vars["--ai-me-primary"] = theme.primaryColor;
  if (theme.backgroundColor) vars["--ai-me-bg"] = theme.backgroundColor;
  if (theme.secondaryBackgroundColor) vars["--ai-me-bg-secondary"] = theme.secondaryBackgroundColor;
  if (theme.textColor) vars["--ai-me-text"] = theme.textColor;
  if (theme.secondaryTextColor) vars["--ai-me-text-secondary"] = theme.secondaryTextColor;
  if (theme.borderColor) vars["--ai-me-border"] = theme.borderColor;
  if (theme.borderRadius) vars["--ai-me-radius"] = theme.borderRadius;
  if (theme.fontFamily) vars["--ai-me-font"] = theme.fontFamily;
  return vars;
}

/**
 * Resolve the effective base theme vars for the given color scheme.
 * When "auto", the caller must detect the user's preference at runtime.
 */
export function resolveBaseThemeVars(
  colorScheme: AIMeTheme["colorScheme"],
  prefersDark: boolean,
): Record<string, string> {
  if (colorScheme === "dark") return { ...darkThemeVars };
  if (colorScheme === "auto" && prefersDark) return { ...darkThemeVars };
  return { ...defaultThemeVars };
}
