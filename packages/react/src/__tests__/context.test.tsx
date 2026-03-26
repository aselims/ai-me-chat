import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAIMeContext } from "../context.js";
import { AIMeProvider } from "../provider.js";
import type { ReactNode } from "react";

describe("useAIMeContext", () => {
  it("throws when used outside AIMeProvider", () => {
    expect(() => {
      renderHook(() => useAIMeContext());
    }).toThrow("useAIMe must be used within an <AIMeProvider>");
  });

  it("returns context value when inside AIMeProvider", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AIMeProvider endpoint="/api/ai-me">{children}</AIMeProvider>
    );

    const { result } = renderHook(() => useAIMeContext(), { wrapper });
    expect(result.current.endpoint).toBe("/api/ai-me");
  });

  it("passes through custom headers", () => {
    const headers = { "x-custom": "value" };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AIMeProvider endpoint="/api/ai-me" headers={headers}>
        {children}
      </AIMeProvider>
    );

    const { result } = renderHook(() => useAIMeContext(), { wrapper });
    expect(result.current.headers).toEqual(headers);
  });
});
