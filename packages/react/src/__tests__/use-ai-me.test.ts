import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock useChat before importing useAIMe
const mockChat = {
  messages: [] as Array<{ role: string; parts: Array<{ type: string; [key: string]: unknown }> }>,
  sendMessage: vi.fn(),
  setMessages: vi.fn(),
  stop: vi.fn(),
  status: "ready" as string,
  error: undefined as Error | undefined,
  addToolApprovalResponse: vi.fn(),
};

vi.mock("@ai-sdk/react", () => ({
  useChat: () => mockChat,
}));

vi.mock("ai", () => ({
  DefaultChatTransport: vi.fn(),
  lastAssistantMessageIsCompleteWithApprovalResponses: vi.fn(),
}));

vi.mock("../context.js", () => ({
  useAIMeContext: () => ({ endpoint: "/api/ai-me", stuckTimeout: 5000 }),
}));

const { useAIMe, cleanAssistantText } = await import("../use-ai-me.js");

describe("cleanAssistantText", () => {
  it("strips <tools> blocks from text", () => {
    const input = 'Let me search for that.\n<tools>\n{"tool": "list_documents"}\n</tools>';
    const result = cleanAssistantText(input);
    expect(result).toBe("Let me search for that.");
  });

  it("strips multiple <tools> blocks", () => {
    const input = "First <tools>a</tools> then <tools>b</tools> done.";
    const result = cleanAssistantText(input);
    expect(result).toBe("First  then  done.");
  });

  it("returns text unchanged when no <tools> blocks present", () => {
    const input = "Hello, how can I help you?";
    const result = cleanAssistantText(input);
    expect(result).toBe("Hello, how can I help you?");
  });

  it("handles empty string", () => {
    expect(cleanAssistantText("")).toBe("");
  });

  it("handles multiline <tools> blocks", () => {
    const input = "Here:\n<tools>\n  line1\n  line2\n</tools>\nDone";
    const result = cleanAssistantText(input);
    expect(result).toBe("Here:\n\nDone");
  });
});

describe("stuck state timeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockChat.status = "ready";
    mockChat.stop.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls stop() after stuckTimeout when status is stuck on submitted", () => {
    mockChat.status = "submitted";
    renderHook(() => useAIMe());

    expect(mockChat.stop).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(mockChat.stop).toHaveBeenCalledOnce();
  });

  it("does not call stop() if status changes before timeout", () => {
    mockChat.status = "submitted";
    const { rerender } = renderHook(() => useAIMe());

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    mockChat.status = "streaming";
    rerender();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(mockChat.stop).not.toHaveBeenCalled();
  });

  it("does not fire when status is ready", () => {
    mockChat.status = "ready";
    renderHook(() => useAIMe());

    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(mockChat.stop).not.toHaveBeenCalled();
  });
});

describe("session restore resilience", () => {
  beforeEach(() => {
    mockChat.setMessages.mockClear();
    mockChat.messages = [];
  });

  it("trims incomplete assistant message with non-terminal tool part on restore", () => {
    const incompleteMessages = [
      { id: "m1", role: "user", parts: [{ type: "text", text: "Delete it" }] },
      {
        id: "m2",
        role: "assistant",
        parts: [
          { type: "tool-delete_item", toolCallId: "tc1", toolName: "delete_item", state: "approval-requested", input: { id: "123" }, approval: { id: "appr1" } },
        ],
      },
    ];
    sessionStorage.setItem("ai-me-messages", JSON.stringify(incompleteMessages));

    renderHook(() => useAIMe());

    expect(mockChat.setMessages).toHaveBeenCalledWith([incompleteMessages[0]]);
  });

  it("keeps complete messages with terminal tool parts on restore", () => {
    const completeMessages = [
      { id: "m1", role: "user", parts: [{ type: "text", text: "List items" }] },
      {
        id: "m2",
        role: "assistant",
        parts: [
          { type: "tool-list_items", toolCallId: "tc1", toolName: "list_items", state: "output-available", input: {}, output: [] },
          { type: "text", text: "Here are your items." },
        ],
      },
    ];
    sessionStorage.setItem("ai-me-messages", JSON.stringify(completeMessages));

    renderHook(() => useAIMe());

    expect(mockChat.setMessages).toHaveBeenCalledWith(completeMessages);
  });

  it("keeps assistant messages that have only text parts", () => {
    const textOnlyMessages = [
      { id: "m1", role: "user", parts: [{ type: "text", text: "Hi" }] },
      { id: "m2", role: "assistant", parts: [{ type: "text", text: "Hello!" }] },
    ];
    sessionStorage.setItem("ai-me-messages", JSON.stringify(textOnlyMessages));

    renderHook(() => useAIMe());

    expect(mockChat.setMessages).toHaveBeenCalledWith(textOnlyMessages);
  });
});
