import { createContext, useContext } from "react";

export interface AIMeContextValue {
  /** API endpoint for AI-Me handler */
  endpoint: string;
  /** Additional headers to send with requests */
  headers?: Record<string, string>;
}

export const AIMeContext = createContext<AIMeContextValue | null>(null);

export function useAIMeContext(): AIMeContextValue {
  const ctx = useContext(AIMeContext);
  if (!ctx) {
    throw new Error("useAIMe must be used within an <AIMeProvider>");
  }
  return ctx;
}
