import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useAIMeContext } from "./context.js";

const STORAGE_KEY = "ai-me-messages";

/**
 * Strip malformed tool-call XML that some open-source models emit as plain
 * text instead of using the structured tool-calling protocol.
 */
export function cleanAssistantText(text: string): string {
  return text.replace(/<tools>[\s\S]*?<\/tools>/g, "").trim();
}

/**
 * Remove trailing assistant messages that have tool-call parts without
 * matching tool-result parts. These represent interrupted tool executions
 * that would cause the chat to start in a stuck state.
 */
function trimIncompleteToolCalls<T extends { role: string; parts: Array<{ type: string }> }>(messages: T[]): T[] {
  if (messages.length === 0) return messages;

  const last = messages[messages.length - 1];
  if (last.role !== "assistant") return messages;

  const hasToolCall = last.parts.some((p) => p.type === "tool-call");
  const hasToolResult = last.parts.some((p) => p.type === "tool-result");

  if (hasToolCall && !hasToolResult) {
    return messages.slice(0, -1);
  }

  return messages;
}

/**
 * Hook wrapping AI SDK's useChat with AI-Me configuration.
 * Provides chat state, message handling, confirmation support,
 * and session persistence (survives page navigation within the same tab).
 */
export function useAIMe() {
  const { endpoint, headers, stuckTimeout: configuredTimeout } = useAIMeContext();
  const stuckTimeout = configuredTimeout ?? 30_000;
  const [input, setInput] = useState("");
  const initialized = useRef(false);

  const chat = useChat({
    transport: new DefaultChatTransport({
      api: endpoint,
      headers,
    }),
  });

  // Some open-source models emit <tools>...</tools> as plain text instead of
  // structured tool calls; strip them so they don't render in the UI.
  const messages = useMemo(() => {
    return chat.messages.map((m) => {
      if (m.role !== "assistant") return m;
      let changed = false;
      const cleanedParts = m.parts.map((p) => {
        if (p.type !== "text") return p;
        const cleaned = cleanAssistantText((p as { text: string }).text);
        if (cleaned === (p as { text: string }).text) return p;
        changed = true;
        return { ...p, text: cleaned };
      });
      if (!changed) return m;
      const nonEmptyParts = cleanedParts.filter(
        (p) => p.type !== "text" || (p as { text: string }).text.length > 0,
      );
      return { ...m, parts: nonEmptyParts };
    });
  }, [chat.messages]);

  // Restore messages from sessionStorage on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = trimIncompleteToolCalls(parsed);
          if (cleaned.length > 0) {
            chat.setMessages(cleaned);
          }
        }
      }
    } catch {
      // ignore — sessionStorage may be unavailable or corrupted
    }
  }, []);

  // Persist messages to sessionStorage on change
  useEffect(() => {
    if (!initialized.current) return;
    try {
      if (chat.messages.length > 0) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(chat.messages));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [chat.messages]);

  // Auto-recover from stuck "submitted" state
  useEffect(() => {
    if (stuckTimeout <= 0) return;
    if (chat.status !== "submitted") return;
    const timer = setTimeout(() => {
      chat.stop();
    }, stuckTimeout);
    return () => clearTimeout(timer);
  }, [chat.status, stuckTimeout, chat.stop]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setInput(e.target.value);
    },
    [],
  );

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!input.trim()) return;
      chat.sendMessage({ text: input });
      setInput("");
    },
    [input, chat],
  );

  const clearMessages = useCallback(() => {
    chat.setMessages([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, [chat]);

  return {
    /** Conversation messages */
    messages,
    /** Current input value */
    input,
    /** Set input value */
    setInput,
    /** Handle input change */
    handleInputChange,
    /** Submit the current message */
    handleSubmit,
    /** Send a message directly */
    sendMessage: chat.sendMessage,
    /** Chat status: "ready" | "submitted" | "streaming" */
    status: chat.status,
    /** Error if any */
    error: chat.error,
    /** Stop streaming */
    stop: chat.stop,
    /** Set messages */
    setMessages: chat.setMessages,
    /** Clear all messages and session storage */
    clearMessages,
    /** Approve or reject a pending tool call (for confirmation flow) */
    addToolApprovalResponse: chat.addToolApprovalResponse,
  };
}
