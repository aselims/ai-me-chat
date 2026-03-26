import { useState, useRef, useEffect, useCallback, useId } from "react";
import type { CSSProperties } from "react";
import { useAIMe } from "./use-ai-me.js";
import { defaultThemeVars, themeToVars } from "./styles.js";
import type { AIMeTheme } from "./styles.js";
import { renderMarkdown } from "./markdown.js";

export interface AIMeChatProps {
  /** Position of chat panel */
  position?: "bottom-right" | "bottom-left" | "inline";
  /** Theme overrides */
  theme?: AIMeTheme;
  /** Welcome message shown on empty chat */
  welcomeMessage?: string;
  /** Suggested prompts shown on empty chat */
  suggestedPrompts?: string[];
  /** Whether chat starts open */
  defaultOpen?: boolean;
  /** Callback when chat opens/closes */
  onToggle?: (open: boolean) => void;
}

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

export function AIMeChat({
  position = "bottom-right",
  theme,
  welcomeMessage = "Hi! I can help you navigate and use this app. What would you like to do?",
  suggestedPrompts,
  defaultOpen = false,
  onToggle,
}: AIMeChatProps) {
  const [open, setOpen] = useState(defaultOpen);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    error,
    setInput,
  } = useAIMe();

  // Stable IDs for aria-labelledby / aria-describedby
  const titleId = useId();
  const messagesId = useId();

  const isInline = position === "inline";

  const toggleOpen = useCallback(() => {
    const next = !open;
    setOpen(next);
    onToggle?.(next);
  }, [open, onToggle]);

  // Keyboard shortcut: Cmd+. to toggle
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === ".") {
        e.preventDefault();
        toggleOpen();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus panel when opened; return focus to trigger when closed
  useEffect(() => {
    if (open) {
      // Shift focus into the panel so screen readers announce the dialog
      panelRef.current?.focus();
      // Then move focus to the input after a tick so the panel focus is set first
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      // Return focus to the trigger that opened the panel
      triggerRef.current?.focus();
    }
  }, [open]);

  // Focus trap: keep Tab/Shift+Tab inside the panel while open
  useEffect(() => {
    if (!open || isInline) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        toggleOpen();
        return;
      }

      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;

      const focusable = panel.querySelectorAll<HTMLElement>(
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

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isInline, toggleOpen]);

  const themeVars: CSSProperties = {
    ...defaultThemeVars,
    ...themeToVars(theme),
  } as CSSProperties;

  const panelStyle: CSSProperties = isInline
    ? {
        ...themeVars,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--ai-me-font)",
        color: "var(--ai-me-text)",
        backgroundColor: "var(--ai-me-bg)",
        borderRadius: "var(--ai-me-radius)",
        border: "1px solid var(--ai-me-border)",
        overflow: "hidden",
      }
    : {
        ...themeVars,
        position: "fixed",
        bottom: 24,
        ...(position === "bottom-right" ? { right: 24 } : { left: 24 }),
        width: 380,
        maxHeight: "70vh",
        display: open ? "flex" : "none",
        flexDirection: "column",
        fontFamily: "var(--ai-me-font)",
        color: "var(--ai-me-text)",
        backgroundColor: "var(--ai-me-bg)",
        borderRadius: "var(--ai-me-radius)",
        boxShadow: "var(--ai-me-shadow)",
        border: "1px solid var(--ai-me-border)",
        overflow: "hidden",
        zIndex: 9999,
      };

  const triggerStyle: CSSProperties = {
    ...themeVars,
    position: "fixed",
    bottom: 24,
    ...(position === "bottom-right" ? { right: 24 } : { left: 24 }),
    width: 56,
    height: 56,
    borderRadius: "50%",
    backgroundColor: "var(--ai-me-primary)",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    display: isInline || open ? "none" : "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "var(--ai-me-shadow)",
    fontSize: 24,
    zIndex: 9999,
  };

  const isStreaming = status === "submitted" || status === "streaming";

  return (
    <>
      {/* Floating trigger button */}
      <button
        ref={triggerRef}
        onClick={toggleOpen}
        style={triggerStyle}
        aria-label="Open AI chat"
        aria-expanded={open}
        aria-controls={isInline ? undefined : "ai-me-chat-panel"}
        type="button"
      >
        {/* Icon is decorative; label is on the button */}
        <span aria-hidden="true">💬</span>
      </button>

      {/* Chat panel */}
      <div
        id="ai-me-chat-panel"
        ref={panelRef}
        style={panelStyle}
        role="dialog"
        aria-modal={isInline ? undefined : "true"}
        aria-labelledby={titleId}
        aria-busy={isStreaming}
        // tabIndex={-1} allows programmatic focus on the panel element itself
        tabIndex={-1}
      >
        {/* Header */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--ai-me-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "var(--ai-me-bg-secondary)",
          }}
        >
          <span id={titleId} style={{ fontWeight: 600, fontSize: 14 }}>
            AI Assistant
          </span>
          {!isInline && (
            <button
              onClick={toggleOpen}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 18,
                color: "var(--ai-me-text-secondary)",
                padding: 4,
                borderRadius: 4,
                // Visible focus indicator without outline:none
                outline: "2px solid transparent",
                outlineOffset: 2,
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLButtonElement).style.outline =
                  "2px solid var(--ai-me-primary)";
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLButtonElement).style.outline =
                  "2px solid transparent";
              }}
              aria-label="Close chat"
              type="button"
            >
              <span aria-hidden="true">✕</span>
            </button>
          )}
        </div>

        {/* Skip link: jump straight to the input */}
        <a
          href="#ai-me-chat-input"
          style={{
            ...srOnly,
            // Reveal on focus so keyboard users can see it
          }}
          onFocus={(e) => {
            Object.assign((e.currentTarget as HTMLAnchorElement).style, {
              position: "static",
              width: "auto",
              height: "auto",
              padding: "4px 8px",
              margin: 0,
              overflow: "visible",
              clip: "auto",
              whiteSpace: "normal",
              backgroundColor: "var(--ai-me-primary)",
              color: "#fff",
              fontSize: 12,
              borderRadius: 4,
            });
          }}
          onBlur={(e) => {
            Object.assign((e.currentTarget as HTMLAnchorElement).style, srOnly);
          }}
        >
          Skip to message input
        </a>

        {/* Messages — live region so screen readers announce new content */}
        <div
          id={messagesId}
          aria-live="polite"
          aria-label="Conversation"
          aria-relevant="additions"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {messages.length === 0 && (
            <div style={{ color: "var(--ai-me-text-secondary)", fontSize: 14 }}>
              <p>{welcomeMessage}</p>
              {suggestedPrompts && suggestedPrompts.length > 0 && (
                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 500 }}>
                    Suggested questions:
                  </p>
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => {
                        setInput(prompt);
                        inputRef.current?.focus();
                      }}
                      style={{
                        padding: "8px 12px",
                        border: "1px solid var(--ai-me-border)",
                        borderRadius: 8,
                        background: "var(--ai-me-bg)",
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: 13,
                        color: "var(--ai-me-text)",
                        outline: "2px solid transparent",
                        outlineOffset: 2,
                      }}
                      onFocus={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.outline =
                          "2px solid var(--ai-me-primary)";
                      }}
                      onBlur={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.outline =
                          "2px solid transparent";
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
                padding: "8px 12px",
                borderRadius: 8,
                backgroundColor:
                  m.role === "user"
                    ? "var(--ai-me-primary)"
                    : "var(--ai-me-bg-secondary)",
                color: m.role === "user" ? "#fff" : "var(--ai-me-text)",
                fontSize: 14,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {/* Screen reader role prefix */}
              <span style={srOnly}>
                {m.role === "user" ? "You: " : "Assistant: "}
              </span>
              {m.parts.map((p, i) =>
                p.type === "text" ? (
                  <span key={i}>
                    {m.role === "assistant"
                      ? renderMarkdown(p.text)
                      : p.text}
                  </span>
                ) : null,
              )}
            </div>
          ))}

          {/* "Thinking" indicator — announced by the live region above */}
          {status === "submitted" && (
            <div
              aria-label="Assistant is thinking"
              style={{
                alignSelf: "flex-start",
                color: "var(--ai-me-text-secondary)",
                fontSize: 13,
              }}
            >
              <span aria-hidden="true">Thinking…</span>
            </div>
          )}

          {/* Error — role="alert" ensures immediate announcement */}
          {error && (
            <div
              role="alert"
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                backgroundColor: "#fef2f2",
                // #dc2626 on #fef2f2 ≈ 5.1:1 — passes AA for normal text
                color: "#dc2626",
                fontSize: 13,
                border: "1px solid #fca5a5",
              }}
            >
              Something went wrong. Please try again.
            </div>
          )}

          <div ref={messagesEndRef} aria-hidden="true" />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--ai-me-border)",
            display: "flex",
            gap: 8,
          }}
        >
          {/* Visible label for the input (positioned absolutely so only visible on focus for compact layout) */}
          <label
            htmlFor="ai-me-chat-input"
            style={srOnly}
          >
            Message to AI Assistant
          </label>
          <input
            id="ai-me-chat-input"
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            placeholder="Ask anything…"
            disabled={status !== "ready"}
            aria-disabled={status !== "ready"}
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "1px solid var(--ai-me-border)",
              borderRadius: 8,
              fontSize: 14,
              fontFamily: "var(--ai-me-font)",
              // Do NOT use outline:none — use outline with transparent color + focus handler
              outline: "2px solid transparent",
              outlineOffset: 2,
              backgroundColor: "var(--ai-me-bg)",
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
          />
          <button
            type="submit"
            disabled={status !== "ready" || !input.trim()}
            aria-disabled={status !== "ready" || !input.trim()}
            style={{
              padding: "8px 16px",
              backgroundColor: "var(--ai-me-primary)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: status === "ready" && input.trim() ? "pointer" : "not-allowed",
              fontSize: 14,
              fontFamily: "var(--ai-me-font)",
              opacity: status === "ready" && input.trim() ? 1 : 0.5,
              outline: "2px solid transparent",
              outlineOffset: 2,
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLButtonElement).style.outline =
                "2px solid var(--ai-me-primary)";
              (e.currentTarget as HTMLButtonElement).style.outlineOffset = "2px";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLButtonElement).style.outline =
                "2px solid transparent";
            }}
            aria-label="Send message"
          >
            Send
          </button>
        </form>
      </div>
    </>
  );
}
