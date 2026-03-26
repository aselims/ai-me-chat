import { describe, it, expect, vi } from "vitest";
import { executeTool } from "../executor.js";
import type { AIMeToolDefinition } from "../types.js";

const baseContext = {
  baseUrl: "http://localhost:3000",
  headers: { cookie: "", authorization: "" },
};

describe("executeTool", () => {
  it("calls execute function when tool has one", async () => {
    const tool: AIMeToolDefinition = {
      name: "test_tool",
      description: "A test tool",
      parameters: {} as AIMeToolDefinition["parameters"],
      requiresConfirmation: false,
      execute: vi.fn().mockResolvedValue({ result: "ok" }),
    };

    const result = await executeTool(tool, { foo: "bar" }, baseContext);

    expect(tool.execute).toHaveBeenCalledWith({ foo: "bar" });
    expect(result.statusCode).toBe(200);
    expect(result.response).toEqual({ result: "ok" });
    expect(result.toolName).toBe("test_tool");
    expect(result.confirmed).toBe(true);
  });

  it("sets confirmed=false when tool requires confirmation", async () => {
    const tool: AIMeToolDefinition = {
      name: "write_tool",
      description: "A write tool",
      parameters: {} as AIMeToolDefinition["parameters"],
      requiresConfirmation: true,
      execute: vi.fn().mockResolvedValue({ result: "created" }),
    };

    const result = await executeTool(tool, {}, baseContext);

    expect(result.confirmed).toBe(false);
  });

  it("returns 500 on execute error", async () => {
    const tool: AIMeToolDefinition = {
      name: "failing_tool",
      description: "A failing tool",
      parameters: {} as AIMeToolDefinition["parameters"],
      requiresConfirmation: false,
      execute: vi.fn().mockRejectedValue(new Error("boom")),
    };

    const result = await executeTool(tool, {}, baseContext);

    expect(result.statusCode).toBe(500);
    expect(result.response).toEqual({ error: "boom" });
  });

  it("fails when tool has no execute or HTTP path", async () => {
    const tool: AIMeToolDefinition = {
      name: "broken_tool",
      description: "No execute or path",
      parameters: {} as AIMeToolDefinition["parameters"],
      requiresConfirmation: false,
    };

    const result = await executeTool(tool, {}, baseContext);

    expect(result.statusCode).toBe(500);
    expect(result.response).toEqual({
      error: 'Tool "broken_tool" has no execute function or HTTP path',
    });
  });

  it("includes execution metadata", async () => {
    const tool: AIMeToolDefinition = {
      name: "meta_tool",
      description: "test",
      parameters: {} as AIMeToolDefinition["parameters"],
      requiresConfirmation: false,
      execute: vi.fn().mockResolvedValue("done"),
    };

    const result = await executeTool(tool, { key: "val" }, baseContext);

    expect(result.id).toBeDefined();
    expect(result.executedAt).toBeInstanceOf(Date);
    expect(result.parameters).toEqual({ key: "val" });
  });
});
