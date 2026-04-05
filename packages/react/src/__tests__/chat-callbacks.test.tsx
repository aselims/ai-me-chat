/**
 * Tests for AIMeChat callback props: onToolComplete and onMessageComplete.
 *
 * We mock useAIMe so the component is testable without a real AI SDK transport.
 * The mock returns controllable messages and status values.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import type { ToolCompleteEvent, MessageCompleteEvent } from "../chat.js";

// ---------------------------------------------------------------------------
// Mock useAIMe before importing the component that consumes it
// ---------------------------------------------------------------------------
const mockUseAIMe = vi.fn();

vi.mock("../use-ai-me.js", async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importOriginal<typeof import("../use-ai-me.js")>();
  return {
    ...actual,
    useAIMe: () => mockUseAIMe(),
  };
});

// Import AFTER mock is established
const { AIMeChat } = await import("../chat.js");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeUseAIMeReturn(overrides: Partial<ReturnType<typeof mockUseAIMe>> = {}) {
  return {
    messages: [],
    input: "",
    setInput: vi.fn(),
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    sendMessage: vi.fn(),
    status: "ready",
    error: undefined,
    stop: vi.fn(),
    setMessages: vi.fn(),
    clearMessages: vi.fn(),
    addToolApprovalResponse: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------
describe("AIMeChat callbacks", () => {
  beforeEach(() => {
    mockUseAIMe.mockReturnValue(makeUseAIMeReturn());
  });

  // ------------------------------------------------------------------
  // onToolComplete
  // ------------------------------------------------------------------
  describe("onToolComplete", () => {
    it("is not called when there are no tool-result parts", () => {
      const onToolComplete = vi.fn();
      mockUseAIMe.mockReturnValue(
        makeUseAIMeReturn({
          messages: [
            {
              id: "m1",
              role: "assistant",
              parts: [{ type: "text", text: "Hello" }],
            },
          ],
        }),
      );

      render(
        <AIMeChat position="inline" onToolComplete={onToolComplete} />,
      );

      expect(onToolComplete).not.toHaveBeenCalled();
    });

    it("fires once per completed tool part", () => {
      const onToolComplete = vi.fn();
      const messages = [
        {
          id: "m1",
          role: "assistant",
          parts: [
            {
              type: "tool-createProject",
              toolCallId: "tc1",
              toolName: "createProject",
              state: "output-available",
              input: {},
              output: { id: 42 },
            },
          ],
        },
      ];
      mockUseAIMe.mockReturnValue(makeUseAIMeReturn({ messages }));

      render(
        <AIMeChat position="inline" onToolComplete={onToolComplete} />,
      );

      expect(onToolComplete).toHaveBeenCalledOnce();
      expect(onToolComplete).toHaveBeenCalledWith({
        name: "createProject",
        result: { id: 42 },
      });
    });

    it("fires for each distinct completed tool when multiple tools are called", () => {
      const onToolComplete = vi.fn();
      const messages = [
        {
          id: "m1",
          role: "assistant",
          parts: [
            {
              type: "tool-listProjects",
              toolCallId: "tc1",
              toolName: "listProjects",
              state: "output-available",
              input: {},
              output: [],
            },
            {
              type: "tool-createProject",
              toolCallId: "tc2",
              toolName: "createProject",
              state: "output-available",
              input: {},
              output: { id: 1 },
            },
          ],
        },
      ];
      mockUseAIMe.mockReturnValue(makeUseAIMeReturn({ messages }));

      render(
        <AIMeChat position="inline" onToolComplete={onToolComplete} />,
      );

      expect(onToolComplete).toHaveBeenCalledTimes(2);
    });

    it("does not fire again on re-render with the same messages", () => {
      const onToolComplete = vi.fn();
      const messages = [
        {
          id: "m1",
          role: "assistant",
          parts: [
            {
              type: "tool-getUser",
              toolCallId: "tc1",
              toolName: "getUser",
              state: "output-available",
              input: {},
              output: { name: "Alice" },
            },
          ],
        },
      ];
      mockUseAIMe.mockReturnValue(makeUseAIMeReturn({ messages }));

      const { rerender } = render(
        <AIMeChat position="inline" onToolComplete={onToolComplete} />,
      );

      // Re-render with identical messages (simulates streaming re-renders)
      rerender(
        <AIMeChat position="inline" onToolComplete={onToolComplete} />,
      );

      expect(onToolComplete).toHaveBeenCalledOnce();
    });

    it("fires for a new completed tool added in a subsequent message", () => {
      const onToolComplete = vi.fn();

      // Initial render — one completed tool
      const initialMessages = [
        {
          id: "m1",
          role: "assistant",
          parts: [
            {
              type: "tool-tool1",
              toolCallId: "tc1",
              toolName: "tool1",
              state: "output-available",
              input: {},
              output: "r1",
            },
          ],
        },
      ];
      mockUseAIMe.mockReturnValue(makeUseAIMeReturn({ messages: initialMessages }));

      const { rerender } = render(
        <AIMeChat position="inline" onToolComplete={onToolComplete} />,
      );

      expect(onToolComplete).toHaveBeenCalledOnce();

      // Second render — new completed tool added
      const updatedMessages = [
        ...initialMessages,
        {
          id: "m2",
          role: "assistant",
          parts: [
            {
              type: "tool-tool2",
              toolCallId: "tc2",
              toolName: "tool2",
              state: "output-available",
              input: {},
              output: "r2",
            },
          ],
        },
      ];
      mockUseAIMe.mockReturnValue(makeUseAIMeReturn({ messages: updatedMessages }));

      act(() => {
        rerender(
          <AIMeChat position="inline" onToolComplete={onToolComplete} />,
        );
      });

      expect(onToolComplete).toHaveBeenCalledTimes(2);
      expect(onToolComplete).toHaveBeenLastCalledWith({
        name: "tool2",
        result: "r2",
      });
    });
  });

  // ------------------------------------------------------------------
  // onMessageComplete
  // ------------------------------------------------------------------
  describe("onMessageComplete", () => {
    it("is not called on initial render with ready status", () => {
      const onMessageComplete = vi.fn();
      mockUseAIMe.mockReturnValue(makeUseAIMeReturn({ status: "ready" }));

      render(
        <AIMeChat position="inline" onMessageComplete={onMessageComplete} />,
      );

      expect(onMessageComplete).not.toHaveBeenCalled();
    });

    it("fires when status transitions from streaming to ready", () => {
      const onMessageComplete = vi.fn();
      const messages = [
        {
          id: "m1",
          role: "assistant",
          parts: [{ type: "text", text: "Done!" }],
        },
      ];

      // Start in streaming state
      mockUseAIMe.mockReturnValue(
        makeUseAIMeReturn({ status: "streaming", messages }),
      );
      const { rerender } = render(
        <AIMeChat position="inline" onMessageComplete={onMessageComplete} />,
      );

      expect(onMessageComplete).not.toHaveBeenCalled();

      // Transition to ready
      mockUseAIMe.mockReturnValue(
        makeUseAIMeReturn({ status: "ready", messages }),
      );
      act(() => {
        rerender(
          <AIMeChat position="inline" onMessageComplete={onMessageComplete} />,
        );
      });

      expect(onMessageComplete).toHaveBeenCalledOnce();
      expect(onMessageComplete).toHaveBeenCalledWith({
        role: "assistant",
        content: "Done!",
        toolCalls: undefined,
      });
    });

    it("fires when status transitions from submitted to ready", () => {
      const onMessageComplete = vi.fn();
      const messages = [
        {
          id: "m1",
          role: "assistant",
          parts: [{ type: "text", text: "Here you go." }],
        },
      ];

      mockUseAIMe.mockReturnValue(
        makeUseAIMeReturn({ status: "submitted", messages }),
      );
      const { rerender } = render(
        <AIMeChat position="inline" onMessageComplete={onMessageComplete} />,
      );

      mockUseAIMe.mockReturnValue(
        makeUseAIMeReturn({ status: "ready", messages }),
      );
      act(() => {
        rerender(
          <AIMeChat position="inline" onMessageComplete={onMessageComplete} />,
        );
      });

      expect(onMessageComplete).toHaveBeenCalledOnce();
    });

    it("includes toolCalls when the message has tool parts", () => {
      const onMessageComplete = vi.fn();
      const toolCallPart = {
        type: "tool-createProject",
        toolCallId: "tc1",
        toolName: "createProject",
        state: "output-available",
        input: { name: "Acme" },
        output: { id: 1 },
      };
      const messages = [
        {
          id: "m1",
          role: "assistant",
          parts: [
            toolCallPart,
            { type: "text", text: "Created!" },
          ],
        },
      ];

      mockUseAIMe.mockReturnValue(
        makeUseAIMeReturn({ status: "streaming", messages }),
      );
      const { rerender } = render(
        <AIMeChat position="inline" onMessageComplete={onMessageComplete} />,
      );

      mockUseAIMe.mockReturnValue(
        makeUseAIMeReturn({ status: "ready", messages }),
      );
      act(() => {
        rerender(
          <AIMeChat position="inline" onMessageComplete={onMessageComplete} />,
        );
      });

      const call = onMessageComplete.mock.calls[0][0] as MessageCompleteEvent;
      expect(call.toolCalls).toHaveLength(1);
      expect(call.toolCalls?.[0]).toEqual(toolCallPart);
    });

    it("is not called when status goes ready → ready without streaming", () => {
      const onMessageComplete = vi.fn();
      mockUseAIMe.mockReturnValue(makeUseAIMeReturn({ status: "ready" }));

      const { rerender } = render(
        <AIMeChat position="inline" onMessageComplete={onMessageComplete} />,
      );

      act(() => {
        rerender(
          <AIMeChat position="inline" onMessageComplete={onMessageComplete} />,
        );
      });

      expect(onMessageComplete).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------------------
  // confirmation rendering
  // ------------------------------------------------------------------
  describe("confirmation rendering", () => {
    it("renders AIMeConfirm for tool part with approval-requested state", () => {
      const messages = [
        {
          id: "m1",
          role: "assistant",
          parts: [
            {
              type: "tool-delete_item",
              toolCallId: "tc1",
              toolName: "delete_item",
              state: "approval-requested",
              input: { id: "123" },
              approval: { id: "appr1" },
            },
          ],
        },
      ];
      mockUseAIMe.mockReturnValue(
        makeUseAIMeReturn({
          messages,
          addToolApprovalResponse: vi.fn(),
        }),
      );

      const { container } = render(<AIMeChat position="inline" />);

      const dialog = container.querySelector('[role="alertdialog"]');
      expect(dialog).not.toBeNull();
    });

    it("does not render confirmation when tool part has terminal state", () => {
      const messages = [
        {
          id: "m1",
          role: "assistant",
          parts: [
            {
              type: "tool-list_items",
              toolCallId: "tc1",
              toolName: "list_items",
              state: "output-available",
              input: {},
              output: [],
            },
          ],
        },
      ];
      mockUseAIMe.mockReturnValue(
        makeUseAIMeReturn({
          messages,
          addToolApprovalResponse: vi.fn(),
        }),
      );

      const { container } = render(<AIMeChat position="inline" />);

      const dialog = container.querySelector('[role="alertdialog"]');
      expect(dialog).toBeNull();
    });

    it("uses renderConfirmation prop when provided", () => {
      const messages = [
        {
          id: "m1",
          role: "assistant",
          parts: [
            {
              type: "tool-delete_item",
              toolCallId: "tc1",
              toolName: "delete_item",
              state: "approval-requested",
              input: { id: "456" },
              approval: { id: "appr1" },
            },
          ],
        },
      ];
      mockUseAIMe.mockReturnValue(
        makeUseAIMeReturn({
          messages,
          addToolApprovalResponse: vi.fn(),
        }),
      );

      const renderConfirmation = vi.fn().mockReturnValue(
        <div data-testid="custom-confirm">Custom</div>,
      );

      const { getByTestId } = render(
        <AIMeChat position="inline" renderConfirmation={renderConfirmation} />,
      );

      expect(renderConfirmation).toHaveBeenCalledOnce();
      expect(getByTestId("custom-confirm")).toBeDefined();

      const call = renderConfirmation.mock.calls[0][0];
      expect(call.tool.name).toBe("delete_item");
      expect(call.params).toEqual({ id: "456" });
      expect(typeof call.onConfirm).toBe("function");
      expect(typeof call.onCancel).toBe("function");
    });
  });

  // ------------------------------------------------------------------
  // Type-level assertions for exported types
  // ------------------------------------------------------------------
  describe("exported types", () => {
    it("ToolCompleteEvent has the expected shape", () => {
      const event: ToolCompleteEvent = {
        name: "myTool",
        result: { ok: true },
      };
      expect(event.name).toBe("myTool");
      // Optional fields
      const full: ToolCompleteEvent = {
        name: "t",
        httpMethod: "POST",
        path: "/api/items",
        result: null,
        requiresConfirmation: true,
      };
      expect(full.httpMethod).toBe("POST");
    });

    it("MessageCompleteEvent has the expected shape", () => {
      const event: MessageCompleteEvent = {
        role: "assistant",
        content: "Hello",
      };
      expect(event.role).toBe("assistant");
      const withTools: MessageCompleteEvent = {
        role: "assistant",
        content: "",
        toolCalls: [{ type: "tool-createProject", toolCallId: "tc1", state: "output-available" }],
      };
      expect(withTools.toolCalls).toHaveLength(1);
    });
  });
});
