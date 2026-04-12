import { useState, useRef, useEffect, useCallback, useId, useMemo, Fragment } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useAIMe, isToolPart, getToolName, TERMINAL_TOOL_STATES } from "./use-ai-me.js";
import type { ToolPartLike } from "./use-ai-me.js";
import { themeToVars, resolveBaseThemeVars } from "./styles.js";
import type { AIMeTheme } from "./styles.js";
import { renderMarkdown } from "./markdown.js";
import { AIMeConfirm } from "./confirm.js";

/** Tool execution result passed to onToolComplete */
export interface ToolCompleteEvent {
  /** Tool (function) name */
  name: string;
  /** HTTP method used, if available from the tool result */
  httpMethod?: string;
  /** API path called, if available from the tool result */
  path?: string;
  /** Raw result returned by the tool */
  result: unknown;
  /** Whether the tool required user confirmation */
  requiresConfirmation?: boolean;
}

/** Completed assistant message passed to onMessageComplete */
export interface MessageCompleteEvent {
  role: string;
  content: string;
  toolCalls?: unknown[];
}

/** Override UI strings for i18n or branding. All fields are optional with English defaults. */
export interface AIMeChatLabels {
  /** Chat header title. Default: "AI Assistant" */
  title?: string;
  /** Input placeholder text. Default: "Ask anything…" */
  placeholder?: string;
  /** Submit button text. Default: "Send" */
  send?: string;
  /** Loading indicator text. Default: "Thinking…" */
  thinking?: string;
  /** Default error message. Default: "Something went wrong. Please try again." */
  error?: string;
  /** Heading above suggested prompts. Default: "Suggested questions:" */
  suggestedHeading?: string;
  /** Trigger button aria-label. Default: "Open AI chat" */
  openChat?: string;
  /** Close button aria-label. Default: "Close chat" */
  closeChat?: string;
  /** Skip-to-input link text. Default: "Skip to message input" */
  skipToInput?: string;
  /** Input field accessible label. Default: "Message to AI Assistant" */
  inputLabel?: string;
}

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
  /**
   * Fired after each tool execution completes (after the API call returns).
   * Use this to trigger client-side data refreshes when the AI mutates data.
   */
  onToolComplete?: (tool: ToolCompleteEvent) => void;
  /**
   * Fired when the assistant finishes a full response (status transitions
   * from "streaming" to "ready").
   */
  onMessageComplete?: (message: MessageCompleteEvent) => void;
  /** Custom icon for the floating trigger button. Defaults to a sparkle/AI SVG. */
  triggerIcon?: ReactNode;
  /**
   * Shorthand for `labels.title` — the chat header title.
   * If both `title` and `labels.title` are provided, `title` wins.
   * Default: "AI Assistant"
   */
  title?: string;
  /**
   * Override any UI string for i18n or branding.
   * See `AIMeChatLabels` for available keys.
   *
   * @example
   * ```tsx
   * <AIMeChat
   *   labels={{
   *     title: "KI-Assistent",
   *     placeholder: "Frage stellen…",
   *     send: "Senden",
   *     thinking: "Denkt nach…",
   *   }}
   * />
   * ```
   */
  labels?: AIMeChatLabels;
  /**
   * Show a "Clear conversation" button in the header when messages exist.
   * Default: true
   */
  showClearButton?: boolean;
  /**
   * Use a `<textarea>` instead of a single-line `<input>`.
   * Auto-grows up to 5 rows. Submit with Enter (Shift+Enter for newline).
   * Default: false
   */
  multiline?: boolean;
  /**
   * Custom error renderer. Receives the Error object.
   * When not provided, the default styled error with `labels.error` text is shown.
   */
  renderError?: (error: Error) => ReactNode;
  /**
   * Custom renderer for the tool confirmation dialog.
   *
   * When provided, AI-Me will call this function instead of showing the
   * default confirmation UI. Return any React node — a modal, an inline
   * card, a drawer, etc.
   *
   * If not provided, the built-in `<AIMeConfirm>` dialog is used.
   *
   * @example
   * ```tsx
   * <AIMeChat
   *   renderConfirmation={({ tool, params, onConfirm, onCancel }) => (
   *     <MyCustomConfirmDialog
   *       title={`Run ${tool.name}?`}
   *       description={tool.description}
   *       params={params}
   *       onConfirm={onConfirm}
   *       onCancel={onCancel}
   *     />
   *   )}
   * />
   * ```
   */
  renderConfirmation?: (props: {
    /** Metadata about the tool that is about to be executed */
    tool: {
      /** Tool (function) name */
      name: string;
      /** HTTP method the tool maps to, e.g. "POST" */
      httpMethod: string;
      /** API path the tool will call, e.g. "/api/projects" */
      path: string;
      /** Human-readable description of what the tool does */
      description: string;
    };
    /** Resolved parameters the tool will be called with */
    params: Record<string, unknown>;
    /** Call to proceed with the tool execution */
    onConfirm: () => void;
    /** Call to abort without executing the tool */
    onCancel: () => void;
  }) => ReactNode;
}

/** Style for icon-only header buttons (clear, close). */
function iconButtonStyle(fontSize: number): CSSProperties {
  return {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize,
    color: "var(--ai-me-text-secondary)",
    padding: 4,
    borderRadius: 4,
    outline: "2px solid transparent",
    outlineOffset: 2,
  };
}

/** Shared base style for the chat input element (input or textarea). */
const baseInputStyle: CSSProperties = {
  flex: 1,
  padding: "8px 12px",
  border: "1px solid var(--ai-me-border)",
  borderRadius: 8,
  fontSize: 14,
  fontFamily: "var(--ai-me-font)",
  outline: "2px solid transparent",
  outlineOffset: 2,
  backgroundColor: "var(--ai-me-bg)",
  color: "var(--ai-me-text)",
};

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

/** Default sparkle/AI icon for the floating trigger button. */
function DefaultAIIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5Z" />
      <path d="M19 11l.75 2.25L22 14l-2.25.75L19 17l-.75-2.25L16 14l2.25-.75Z" />
    </svg>
  );
}

export function AIMeChat({
  position = "bottom-right",
  theme,
  welcomeMessage = "Hi! I can help you navigate and use this app. What would you like to do?",
  suggestedPrompts,
  defaultOpen = false,
  onToggle,
  onToolComplete,
  onMessageComplete,
  triggerIcon,
  title,
  labels: labelsProp,
  showClearButton = true,
  multiline = false,
  renderError,
  renderConfirmation,
}: AIMeChatProps) {
  const resolvedTitle = title ?? labelsProp?.title ?? "AI Assistant";
  const l = {
    title: resolvedTitle,
    placeholder: labelsProp?.placeholder ?? "Ask anything\u2026",
    send: labelsProp?.send ?? "Send",
    thinking: labelsProp?.thinking ?? "Thinking\u2026",
    error: labelsProp?.error ?? "Something went wrong. Please try again.",
    suggestedHeading: labelsProp?.suggestedHeading ?? "Suggested questions:",
    openChat: labelsProp?.openChat ?? "Open AI chat",
    closeChat: labelsProp?.closeChat ?? "Close chat",
    skipToInput: labelsProp?.skipToInput ?? "Skip to message input",
    inputLabel: labelsProp?.inputLabel ?? `Message to ${resolvedTitle}`,
  };

  // Stable focus/blur handlers for visible focus rings (avoids outline:none)
  const handleFocusOutline = useCallback((e: React.FocusEvent<HTMLElement>) => {
    e.currentTarget.style.outline = "2px solid var(--ai-me-primary)";
  }, []);
  const handleBlurOutline = useCallback((e: React.FocusEvent<HTMLElement>) => {
    e.currentTarget.style.outline = "2px solid transparent";
  }, []);

  const [open, setOpen] = useState(defaultOpen);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Track tool-result part IDs that have already fired onToolComplete
  const firedToolResults = useRef<Set<string>>(new Set());
  // Track the previous status to detect the streaming → ready transition
  const prevStatus = useRef<string | null>(null);
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    error,
    setInput,
    clearMessages,
    addToolApprovalResponse,
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

  // Fire onToolComplete for each tool part that reaches a terminal state.
  // We deduplicate by tracking the tool-call ID so the callback fires exactly
  // once per tool execution, even across re-renders during streaming.
  useEffect(() => {
    if (messages.length === 0) {
      firedToolResults.current.clear();
      return;
    }
    if (!onToolComplete) return;
    for (const message of messages) {
      for (const part of message.parts) {
        if (!isToolPart(part)) continue;
        const tp = part as ToolPartLike;
        if (!TERMINAL_TOOL_STATES.has(tp.state ?? "")) continue;
        const dedupeKey = tp.toolCallId ?? `${message.id}:${part.type}`;
        if (firedToolResults.current.has(dedupeKey)) continue;
        firedToolResults.current.add(dedupeKey);
        onToolComplete({
          name: getToolName(tp),
          result: tp.output,
        });
      }
    }
  }, [messages, onToolComplete]);

  // Fire onMessageComplete when status transitions from streaming → ready.
  // prevStatus tracks the last seen status so we only fire on the transition.
  useEffect(() => {
    const prev = prevStatus.current;
    prevStatus.current = status;

    if (!onMessageComplete) return;
    // Only fire on the transition away from an active streaming state
    if (status !== "ready") return;
    if (prev !== "streaming" && prev !== "submitted") return;

    // Find the last assistant message
    // Walk backwards to find the most recent assistant message without copying the array
    let lastAssistant: (typeof messages)[number] | undefined;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") { lastAssistant = messages[i]; break; }
    }
    if (!lastAssistant) return;

    const textContent = lastAssistant.parts
      .filter((p) => p.type === "text")
      .map((p) => (p as { text: string }).text)
      .join("");

    const toolCalls: unknown[] = lastAssistant.parts.filter((p) => isToolPart(p));

    onMessageComplete({
      role: lastAssistant.role,
      content: textContent,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    });
  }, [status, messages, onMessageComplete]);

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

  // Pending tool calls: tool parts with state "approval-requested" (awaiting user decision)
  const pendingToolCalls = useMemo(() => {
    const pending: Array<{
      toolCallId: string;
      toolName: string;
      args: Record<string, unknown>;
      approvalId: string;
    }> = [];

    for (const m of messages) {
      for (const p of m.parts) {
        if (!isToolPart(p)) continue;
        const tp = p as ToolPartLike;
        if (tp.state !== "approval-requested") continue;
        pending.push({
          toolCallId: tp.toolCallId!,
          toolName: getToolName(tp),
          args: (tp.input ?? {}) as Record<string, unknown>,
          approvalId: tp.approval?.id ?? tp.toolCallId!,
        });
      }
    }

    return pending;
  }, [messages]);

  // Dark mode: track prefers-color-scheme when colorScheme is "auto"
  const [prefersDark, setPrefersDark] = useState(false);
  useEffect(() => {
    if (theme?.colorScheme !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setPrefersDark(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setPrefersDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme?.colorScheme]);

  const themeVars: CSSProperties = {
    ...resolveBaseThemeVars(theme?.colorScheme, prefersDark),
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
        height: "70vh",
        maxHeight: 600,
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
        aria-label={l.openChat}
        aria-expanded={open}
        aria-controls={isInline ? undefined : "ai-me-chat-panel"}
        type="button"
      >
        {/* Icon is decorative; label is on the button */}
        <span aria-hidden="true">{triggerIcon ?? <DefaultAIIcon />}</span>
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
            {l.title}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {showClearButton && messages.length > 0 && (
              <button
                onClick={clearMessages}
                style={iconButtonStyle(14)}
                onFocus={handleFocusOutline}
                onBlur={handleBlurOutline}
                aria-label="Clear conversation"
                type="button"
              >
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                </svg>
              </button>
            )}
            {!isInline && (
              <button
                onClick={toggleOpen}
                style={iconButtonStyle(18)}
                onFocus={handleFocusOutline}
                onBlur={handleBlurOutline}
                aria-label={l.closeChat}
                type="button"
              >
                <span aria-hidden="true">✕</span>
              </button>
            )}
          </div>
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
          {l.skipToInput}
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
                    {l.suggestedHeading}
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
                      onFocus={handleFocusOutline}
                      onBlur={handleBlurOutline}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((m) => {
            // Skip assistant messages that have no renderable content (e.g.
            // reasoning-only messages from Groq), but keep messages that
            // contain tool parts — they're rendered via the confirmation UI.
            const hasTextContent = m.parts.some((p) => p.type === "text");
            const hasToolContent = m.parts.some((p) => isToolPart(p));
            if (!hasTextContent && !hasToolContent && m.role === "assistant") return null;

            return (
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
            );
          })}

          {/* "Thinking" indicator — announced by the live region above */}
          {status === "submitted" && (
            <div
              aria-label={l.thinking}
              style={{
                alignSelf: "flex-start",
                color: "var(--ai-me-text-secondary)",
                fontSize: 13,
              }}
            >
              <span aria-hidden="true">{l.thinking}</span>
            </div>
          )}

          {/* Error — role="alert" ensures immediate announcement */}
          {error && (
            <div role="alert">
              {renderError ? renderError(error) : (
                <div
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
                  {l.error}
                </div>
              )}
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
            {l.inputLabel}
          </label>
          {multiline ? (
            <textarea
              id="ai-me-chat-input"
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={input}
              onChange={(e) => {
                handleInputChange(e);
                const el = e.currentTarget;
                requestAnimationFrame(() => {
                  el.style.height = "auto";
                  el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={l.placeholder}
              disabled={status !== "ready"}
              aria-disabled={status !== "ready"}
              rows={1}
              style={{ ...baseInputStyle, resize: "none", overflow: "auto" }}
              onFocus={handleFocusOutline}
              onBlur={handleBlurOutline}
            />
          ) : (
            <input
              id="ai-me-chat-input"
              ref={inputRef as React.RefObject<HTMLInputElement>}
              value={input}
              onChange={handleInputChange}
              placeholder={l.placeholder}
              disabled={status !== "ready"}
              aria-disabled={status !== "ready"}
              style={baseInputStyle}
              onFocus={handleFocusOutline}
              onBlur={handleBlurOutline}
            />
          )}
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
            onFocus={handleFocusOutline}
            onBlur={handleBlurOutline}
            aria-label={l.send}
          >
            {l.send}
          </button>
        </form>
      </div>

      {/* Confirmation dialogs for pending tool calls */}
      {pendingToolCalls.map((tc) => {
        const onConfirm = () => addToolApprovalResponse({ id: tc.approvalId, approved: true });
        const onCancel = () => addToolApprovalResponse({ id: tc.approvalId, approved: false, reason: "User cancelled" });

        return renderConfirmation ? (
          <Fragment key={tc.toolCallId}>
            {renderConfirmation({
              tool: {
                name: tc.toolName,
                httpMethod: "",
                path: "",
                description: tc.toolName,
              },
              params: tc.args,
              onConfirm,
              onCancel,
            })}
          </Fragment>
        ) : (
          <AIMeConfirm
            key={tc.toolCallId}
            action={tc.toolName}
            description={`Execute ${tc.toolName}?`}
            parameters={tc.args}
            onConfirm={onConfirm}
            onReject={onCancel}
          />
        );
      })}
    </>
  );
}
