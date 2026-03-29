import type { ReactNode } from "react";
import { AIMeContext } from "./context.js";
import type { AIMeAction } from "./context.js";

export interface AIMeProviderProps {
  /** API endpoint for AI-Me handler */
  endpoint: string;
  /** Optional: additional headers to send with requests */
  headers?: Record<string, string>;
  /**
   * Optional callback for client-side action intents emitted by the AI.
   *
   * The AI can emit structured actions (e.g. "navigate", "prefill",
   * "open-modal") that your app handles without making an API call.
   * Wire the corresponding `__navigate` / `__prefill` tools in your
   * AI-Me handler to produce these actions, then consume them here.
   *
   * @example
   * ```tsx
   * <AIMeProvider
   *   endpoint="/api/ai-me"
   *   onAction={(action) => {
   *     if (action.type === "navigate") {
   *       router.push(action.href as string);
   *     }
   *   }}
   * >
   *   {children}
   * </AIMeProvider>
   * ```
   */
  onAction?: (action: AIMeAction) => void;
  /** Child components */
  children: ReactNode;
}

export function AIMeProvider({ endpoint, headers, onAction, children }: AIMeProviderProps) {
  return (
    <AIMeContext value={{ endpoint, headers, onAction }}>
      {children}
    </AIMeContext>
  );
}
