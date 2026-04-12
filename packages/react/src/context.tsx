import { createContext, useContext } from "react";

/** Payload passed to the `onAction` callback */
export interface AIMeAction {
  /** Action type — e.g. "navigate", "prefill", "open-modal" */
  type: string;
  /** Flexible additional payload supplied by the AI tool */
  [key: string]: unknown;
}

export interface AIMeContextValue {
  /** API endpoint for AI-Me handler */
  endpoint: string;
  /** Additional headers to send with requests */
  headers?: Record<string, string>;
  /**
   * Optional callback for client-side action intents emitted by the AI.
   * Use this to handle navigation, form pre-fill, modal opening, etc.
   * without the AI making an API call directly.
   */
  onAction?: (action: AIMeAction) => void;
  /**
   * Timeout in milliseconds before auto-recovering from a stuck "submitted"
   * state. Set to 0 to disable. Default: 30000 (30 seconds).
   */
  stuckTimeout?: number;
  /**
   * Session storage key for conversation persistence.
   * Default: derived from endpoint as `"ai-me-messages:{endpoint}"`.
   */
  storageKey?: string;
}

export const AIMeContext = createContext<AIMeContextValue | null>(null);

export function useAIMeContext(): AIMeContextValue {
  const ctx = useContext(AIMeContext);
  if (!ctx) {
    throw new Error("useAIMe must be used within an <AIMeProvider>");
  }
  return ctx;
}
