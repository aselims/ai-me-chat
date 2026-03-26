import { useState, useEffect, useRef, useCallback, useId } from "react";
import type { CSSProperties } from "react";
import { defaultThemeVars, themeToVars } from "./styles.js";
import type { AIMeTheme } from "./styles.js";
import { useAIMe } from "./use-ai-me.js";

export interface AIMeCommandPaletteProps {
  /** List of available commands/actions */
  commands?: CommandItem[];
  /** Theme overrides */
  theme?: AIMeTheme;
  /** Custom keyboard shortcut (default: Cmd+K / Ctrl+K) */
  shortcut?: { key: string; meta?: boolean; ctrl?: boolean };
  /** Callback when palette opens/closes */
  onToggle?: (open: boolean) => void;
}

export interface CommandItem {
  /** Unique command ID */
  id: string;
  /** Display label */
  label: string;
  /** Description shown below label */
  description?: string;
  /** Category for grouping */
  category?: string;
  /** Icon (emoji or text) */
  icon?: string;
  /** Action to run — either a callback or a prompt to send to AI */
  action: (() => void) | string;
}

const defaultCommands: CommandItem[] = [
  {
    id: "help",
    label: "Ask AI for help",
    description: "Get assistance with any task",
    category: "AI",
    icon: "💡",
    action: "What can you help me with?",
  },
  {
    id: "list-actions",
    label: "List available actions",
    description: "Show all API actions the AI can perform",
    category: "AI",
    icon: "📋",
    action: "What actions can you perform? List them all.",
  },
  {
    id: "recent-activity",
    label: "Show recent activity",
    description: "Summarize recent actions and changes",
    category: "AI",
    icon: "🕐",
    action: "What has happened recently? Summarize recent activity.",
  },
];

/** Visually hidden but accessible to screen readers */
const srOnly: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  borderWidth: 0,
};

export function AIMeCommandPalette({
  commands = defaultCommands,
  theme,
  shortcut = { key: "k", meta: true },
  onToggle,
}: AIMeCommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  // Remember what had focus before the palette opened so we can restore it
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const { sendMessage } = useAIMe();

  // Stable IDs
  const titleId = useId();
  const inputId = useId();

  const toggle = useCallback(
    (next: boolean) => {
      setOpen(next);
      setQuery("");
      setSelectedIndex(0);
      onToggle?.(next);
    },
    [onToggle],
  );

  // Keyboard shortcut to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const metaMatch = shortcut.meta ? e.metaKey : true;
      const ctrlMatch = shortcut.ctrl ? e.ctrlKey : !shortcut.meta ? e.ctrlKey : true;
      if ((metaMatch || ctrlMatch) && e.key === shortcut.key) {
        e.preventDefault();
        // Capture current focus before opening
        if (!open) {
          previousFocusRef.current = document.activeElement as HTMLElement;
        }
        toggle(!open);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, shortcut, toggle]);

  // Focus the search input when opened; restore focus when closed
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      // Return focus to whatever had it before the palette opened
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    }
  }, [open]);

  // Focus trap: keep Tab/Shift+Tab inside the palette while open
  useEffect(() => {
    if (!open) return;

    function handleFocusTrap(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", handleFocusTrap);
    return () => window.removeEventListener("keydown", handleFocusTrap);
  }, [open]);

  // Filter commands by query
  const filtered = query.trim()
    ? commands.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(query.toLowerCase()) ||
          cmd.description?.toLowerCase().includes(query.toLowerCase()) ||
          cmd.category?.toLowerCase().includes(query.toLowerCase()),
      )
    : commands;

  // Clamp selected index
  useEffect(() => {
    if (selectedIndex >= filtered.length) {
      setSelectedIndex(Math.max(0, filtered.length - 1));
    }
  }, [filtered.length, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const selected = list.children[selectedIndex] as HTMLElement | undefined;
    selected?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  function executeCommand(cmd: CommandItem) {
    toggle(false);
    if (typeof cmd.action === "string") {
      sendMessage({ text: cmd.action });
    } else {
      cmd.action();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        executeCommand(filtered[selectedIndex]);
      } else if (query.trim()) {
        // Send raw query as AI prompt
        toggle(false);
        sendMessage({ text: query });
      }
    } else if (e.key === "Escape") {
      toggle(false);
    }
  }

  if (!open) return null;

  const themeVars: CSSProperties = {
    ...defaultThemeVars,
    ...themeToVars(theme),
  } as CSSProperties;

  // Group by category
  const grouped = new Map<string, CommandItem[]>();
  for (const cmd of filtered) {
    const cat = cmd.category ?? "Actions";
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(cmd);
  }

  let flatIndex = 0;

  return (
    <>
      {/* Backdrop — keyboard-dismissable via Escape (handled in handleKeyDown) */}
      <div
        onClick={() => toggle(false)}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 99998,
        }}
        // aria-hidden so screen readers go straight to the dialog
        aria-hidden="true"
      />

      {/* Palette dialog */}
      <div
        ref={dialogRef}
        style={{
          ...themeVars,
          position: "fixed",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(520px, 90vw)",
          maxHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--ai-me-bg)",
          borderRadius: "var(--ai-me-radius)",
          border: "1px solid var(--ai-me-border)",
          boxShadow: "0 24px 48px rgba(0,0,0,0.3)",
          overflow: "hidden",
          zIndex: 99999,
          fontFamily: "var(--ai-me-font)",
          color: "var(--ai-me-text)",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        // tabIndex={-1} so the dialog element itself can receive programmatic focus
        tabIndex={-1}
      >
        {/* Visually hidden dialog title for screen readers */}
        <h2 id={titleId} style={srOnly}>
          Command Palette
        </h2>

        {/* Search input */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--ai-me-border)" }}>
          <label htmlFor={inputId} style={srOnly}>
            Search commands or ask AI
          </label>
          <input
            id={inputId}
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or ask AI..."
            style={{
              width: "100%",
              padding: "8px 0",
              border: "none",
              // Do NOT suppress the outline entirely — use transparent + focus handler
              outline: "2px solid transparent",
              outlineOffset: 2,
              fontSize: 15,
              fontFamily: "var(--ai-me-font)",
              backgroundColor: "transparent",
              color: "var(--ai-me-text)",
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLInputElement).style.outline =
                "2px solid var(--ai-me-primary)";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLInputElement).style.outline =
                "2px solid transparent";
            }}
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
            aria-controls="ai-me-cmd-listbox"
            aria-activedescendant={
              filtered[selectedIndex]
                ? `cmd-${filtered[selectedIndex].id}`
                : undefined
            }
          />
        </div>

        {/* Results listbox */}
        <div
          id="ai-me-cmd-listbox"
          ref={listRef}
          style={{ overflowY: "auto", padding: "8px 0" }}
          role="listbox"
          aria-label="Commands"
        >
          {filtered.length === 0 && query.trim() && (
            <div
              role="option"
              aria-selected="false"
              style={{
                padding: "16px",
                textAlign: "center",
                fontSize: 13,
                color: "var(--ai-me-text-secondary)",
              }}
            >
              Press Enter to ask AI: &ldquo;{query}&rdquo;
            </div>
          )}

          {Array.from(grouped.entries()).map(([category, items]) => (
            // role="group" with aria-label for the category heading
            <div key={category} role="group" aria-label={category}>
              {/* Category heading — aria-hidden because role="group" aria-label carries the name */}
              <div
                aria-hidden="true"
                style={{
                  padding: "6px 16px 4px",
                  fontSize: 11,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--ai-me-text-secondary)",
                }}
              >
                {category}
              </div>
              {items.map((cmd) => {
                const idx = flatIndex++;
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={cmd.id}
                    id={`cmd-${cmd.id}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => executeCommand(cmd)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    // Allow keyboard activation of each option when it has focus
                    tabIndex={isSelected ? 0 : -1}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        executeCommand(cmd);
                      }
                    }}
                    style={{
                      padding: "8px 16px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      backgroundColor: isSelected
                        ? "var(--ai-me-bg-secondary)"
                        : "transparent",
                      outline: "2px solid transparent",
                      outlineOffset: -2,
                    }}
                    onFocus={(e) => {
                      (e.currentTarget as HTMLDivElement).style.outline =
                        "2px solid var(--ai-me-primary)";
                    }}
                    onBlur={(e) => {
                      (e.currentTarget as HTMLDivElement).style.outline =
                        "2px solid transparent";
                    }}
                  >
                    {cmd.icon && (
                      // Icon is decorative — label comes from cmd.label
                      <span aria-hidden="true" style={{ fontSize: 16, flexShrink: 0 }}>
                        {cmd.icon}
                      </span>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>
                        {cmd.label}
                      </div>
                      {cmd.description && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--ai-me-text-secondary)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {cmd.description}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer keyboard hints — aria-hidden because these are redundant for screen readers
            (keyboard shortcuts are announced via aria-keyshortcuts on the input) */}
        <div
          aria-hidden="true"
          style={{
            padding: "8px 16px",
            borderTop: "1px solid var(--ai-me-border)",
            fontSize: 11,
            color: "var(--ai-me-text-secondary)",
            display: "flex",
            gap: 16,
          }}
        >
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Close</span>
        </div>
      </div>
    </>
  );
}
