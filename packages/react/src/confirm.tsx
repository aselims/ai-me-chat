import { useRef, useEffect, useId, useCallback } from "react";
import type { CSSProperties } from "react";
import { defaultThemeVars } from "./styles.js";

export interface AIMeConfirmProps {
  /** Tool/action name */
  action: string;
  /** Description of what will happen */
  description: string;
  /** Parameters being sent */
  parameters?: Record<string, unknown>;
  /** Callback when user confirms */
  onConfirm: () => void;
  /** Callback when user rejects */
  onReject: () => void;
}

export function AIMeConfirm({
  action,
  description,
  parameters,
  onConfirm,
  onReject,
}: AIMeConfirmProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Stable IDs for ARIA associations
  const titleId = useId();
  const descriptionId = useId();

  // Close on Escape and focus-trap within the dialog
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onReject();
        return;
      }

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
    },
    [onReject],
  );

  // Auto-focus the Cancel button when the dialog mounts (safe default for
  // destructive confirmations — avoids accidental confirmation on Enter).
  // Also wire up Escape / focus-trap and restore focus on unmount.
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;

    cancelButtonRef.current?.focus();
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      // Restore focus to whatever triggered the dialog
      previousFocus?.focus();
    };
  }, [handleKeyDown]);

  const overlayStyle: CSSProperties = {
    ...defaultThemeVars,
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
    fontFamily: "var(--ai-me-font)",
  } as CSSProperties;

  const dialogStyle: CSSProperties = {
    backgroundColor: "var(--ai-me-bg)",
    borderRadius: "var(--ai-me-radius)",
    padding: 24,
    maxWidth: 420,
    width: "90%",
    boxShadow: "var(--ai-me-shadow)",
    color: "var(--ai-me-text)",
  };

  const focusStyle: CSSProperties = {
    outline: "2px solid transparent",
    outlineOffset: 2,
  };

  function applyFocusRing(el: HTMLElement) {
    el.style.outline = "2px solid var(--ai-me-primary)";
    el.style.outlineOffset = "2px";
  }

  function removeFocusRing(el: HTMLElement) {
    el.style.outline = "2px solid transparent";
    el.style.outlineOffset = "2px";
  }

  return (
    // Overlay is presentational — role and aria go on the inner dialog
    <div
      style={overlayStyle}
      // Clicking outside the dialog rejects (same as pressing Escape)
      onClick={(e) => {
        if (e.target === e.currentTarget) onReject();
      }}
      aria-hidden="false"
    >
      <div
        ref={dialogRef}
        style={dialogStyle}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        // tabIndex={-1} allows programmatic focus on the dialog element itself
        tabIndex={-1}
        // Prevent clicks inside the dialog from bubbling to the overlay
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id={titleId} style={{ margin: "0 0 8px", fontSize: 16 }}>
          Confirm Action
        </h3>
        <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600 }}>
          {action}
        </p>
        <p
          id={descriptionId}
          style={{
            margin: "0 0 16px",
            fontSize: 13,
            color: "var(--ai-me-text-secondary)",
          }}
        >
          {description}
        </p>

        {parameters && Object.keys(parameters).length > 0 && (
          <pre
            style={{
              margin: "0 0 16px",
              padding: 12,
              backgroundColor: "var(--ai-me-bg-secondary)",
              borderRadius: 8,
              fontSize: 12,
              overflow: "auto",
              maxHeight: 200,
              border: "1px solid var(--ai-me-border)",
            }}
          >
            {JSON.stringify(parameters, null, 2)}
          </pre>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          {/* Cancel is focused first — avoids accidental confirmation */}
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onReject}
            style={{
              padding: "8px 16px",
              border: "1px solid var(--ai-me-border)",
              borderRadius: 8,
              backgroundColor: "var(--ai-me-bg)",
              color: "var(--ai-me-text)",
              cursor: "pointer",
              fontSize: 14,
              ...focusStyle,
            }}
            onFocus={(e) => applyFocusRing(e.currentTarget)}
            onBlur={(e) => removeFocusRing(e.currentTarget)}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: 8,
              // #fff on var(--ai-me-primary) = #6366f1 → contrast ≈ 4.6:1 (passes AA)
              backgroundColor: "var(--ai-me-primary)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 14,
              ...focusStyle,
            }}
            onFocus={(e) => applyFocusRing(e.currentTarget)}
            onBlur={(e) => removeFocusRing(e.currentTarget)}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
