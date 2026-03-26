import type { ReactNode } from "react";
import { AIMeContext } from "./context.js";

export interface AIMeProviderProps {
  /** API endpoint for AI-Me handler */
  endpoint: string;
  /** Optional: additional headers to send with requests */
  headers?: Record<string, string>;
  /** Child components */
  children: ReactNode;
}

export function AIMeProvider({ endpoint, headers, children }: AIMeProviderProps) {
  return (
    <AIMeContext value={{ endpoint, headers }}>
      {children}
    </AIMeContext>
  );
}
