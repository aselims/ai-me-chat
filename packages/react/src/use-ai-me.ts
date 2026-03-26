import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useCallback, useEffect, useRef } from "react";
import { useAIMeContext } from "./context.js";

const STORAGE_KEY = "ai-me-messages";

/**
 * Hook wrapping AI SDK's useChat with AI-Me configuration.
 * Provides chat state, message handling, confirmation support,
 * and session persistence (survives page navigation within the same tab).
 */
export function useAIMe() {
  const { endpoint, headers } = useAIMeContext();
  const [input, setInput] = useState("");
  const initialized = useRef(false);

  const chat = useChat({
    transport: new DefaultChatTransport({
      api: endpoint,
      headers,
    }),
  });

  // Restore messages from sessionStorage on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          chat.setMessages(parsed);
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
    messages: chat.messages,
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
  };
}
