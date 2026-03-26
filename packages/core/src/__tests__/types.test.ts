import { describe, it, expect } from "vitest";
import type { AIMeConfig, AIMeToolDefinition, AIMeMessage, PendingAction } from "../types.js";

describe("types", () => {
  it("AIMeConfig shape is importable", () => {
    const config: Partial<AIMeConfig> = {
      systemPrompt: "test",
      maxHistoryMessages: 10,
    };
    expect(config.systemPrompt).toBe("test");
  });

  it("AIMeToolDefinition shape is importable", () => {
    const tool: AIMeToolDefinition = {
      name: "test_tool",
      description: "A test tool",
      parameters: {},
      requiresConfirmation: false,
    };
    expect(tool.name).toBe("test_tool");
  });

  it("AIMeMessage shape is importable", () => {
    const msg: AIMeMessage = {
      id: "1",
      role: "user",
      content: "hello",
      createdAt: new Date(),
    };
    expect(msg.role).toBe("user");
  });

  it("PendingAction shape is importable", () => {
    const action: PendingAction = {
      id: "1",
      toolName: "test",
      parameters: { key: "value" },
      description: "Test action",
    };
    expect(action.toolName).toBe("test");
  });
});
