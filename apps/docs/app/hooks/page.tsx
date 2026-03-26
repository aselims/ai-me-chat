// Hooks reference page

import type React from "react";

const s = {
  h1: {
    fontSize: 36,
    fontWeight: 700,
    color: "#e8e8f0",
    letterSpacing: "-0.03em",
    marginBottom: 12,
    lineHeight: 1.2,
  } as React.CSSProperties,
  lead: {
    fontSize: 17,
    color: "#9090b0",
    marginBottom: 48,
    lineHeight: 1.7,
  } as React.CSSProperties,
  h2: {
    fontSize: 22,
    fontWeight: 600,
    color: "#e8e8f0",
    letterSpacing: "-0.02em",
    marginBottom: 16,
    marginTop: 52,
    paddingBottom: 10,
    borderBottom: "1px solid #1a1a2e",
  } as React.CSSProperties,
  h3: {
    fontSize: 15,
    fontWeight: 600,
    color: "#c8c8e0",
    marginBottom: 12,
    marginTop: 28,
  } as React.CSSProperties,
  p: {
    color: "#9090b0",
    marginBottom: 16,
    lineHeight: 1.75,
    fontSize: 15,
  } as React.CSSProperties,
  pre: {
    background: "#0d0d18",
    border: "1px solid #1e1e32",
    borderRadius: 10,
    padding: "20px 24px",
    overflowX: "auto",
    marginBottom: 28,
    fontSize: 13.5,
    lineHeight: 1.65,
  } as React.CSSProperties,
  code: {
    color: "#c4b5fd",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  } as React.CSSProperties,
  inlineCode: {
    background: "#16162a",
    color: "#a78bfa",
    padding: "2px 6px",
    borderRadius: 4,
    fontSize: "0.88em",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  } as React.CSSProperties,
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    marginBottom: 32,
    fontSize: 14,
  } as React.CSSProperties,
  th: {
    textAlign: "left" as const,
    padding: "10px 14px",
    background: "#0d0d18",
    color: "#6b6b8a",
    fontWeight: 600,
    fontSize: 12,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    borderBottom: "1px solid #1e1e32",
  } as React.CSSProperties,
  td: {
    padding: "11px 14px",
    borderBottom: "1px solid #14142a",
    color: "#a0a0c0",
    verticalAlign: "top" as const,
  } as React.CSSProperties,
  tdCode: {
    padding: "11px 14px",
    borderBottom: "1px solid #14142a",
    color: "#a78bfa",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: 13,
    verticalAlign: "top" as const,
  } as React.CSSProperties,
  callout: {
    background: "#0f0f20",
    border: "1px solid #2a2060",
    borderLeft: "3px solid #7c6aff",
    borderRadius: 8,
    padding: "16px 20px",
    marginBottom: 24,
    fontSize: 14,
    color: "#a0a0c0",
  } as React.CSSProperties,
  tag: {
    display: "inline-block",
    background: "#12122a",
    border: "1px solid #2a2a45",
    borderRadius: 4,
    padding: "1px 8px",
    fontSize: 11,
    color: "#7c6aff",
    fontWeight: 600,
    marginRight: 6,
    letterSpacing: "0.02em",
  } as React.CSSProperties,
};

interface ReturnRow {
  field: string;
  type: string;
  description: string;
}

function ReturnTable({ rows }: { rows: ReturnRow[] }) {
  return (
    <table style={s.table}>
      <thead>
        <tr>
          <th style={s.th}>Field</th>
          <th style={s.th}>Type</th>
          <th style={s.th}>Description</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.field}>
            <td style={{ ...s.tdCode, color: "#e8e8f0" }}>{row.field}</td>
            <td style={s.tdCode}>{row.type}</td>
            <td style={s.td}>{row.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function HooksPage() {
  return (
    <div>
      <h1 style={s.h1}>Hooks</h1>
      <p style={s.lead}>
        AI-Me exports two hooks for building custom UI. Both must be called inside a component
        that is a descendant of{" "}
        <span style={s.inlineCode}>{"<AIMeProvider>"}</span>.
      </p>

      <div style={s.callout}>
        <strong style={{ color: "#c4b5fd" }}>Client components only.</strong> These hooks use React
        context and browser APIs. Add <span style={s.inlineCode}>"use client"</span> to any file
        that imports them.
      </div>

      {/* ── useAIMe ── */}
      <h2 style={s.h2}>
        <span style={s.inlineCode}>useAIMe()</span>
      </h2>
      <div
        style={{
          background: "#0d0d18",
          border: "1px solid #1e1e32",
          borderRadius: 10,
          padding: "20px 24px",
          marginBottom: 32,
        }}
      >
        <span style={s.tag}>Primary hook</span>
        <p style={{ ...s.p, marginTop: 12, marginBottom: 0 }}>
          The main hook for building a custom chat UI. Returns all state and callbacks needed to
          manage conversation flow, send messages, and react to streaming responses. Built on top
          of the Vercel AI SDK&apos;s <span style={s.inlineCode}>useChat</span>.
        </p>
      </div>

      <h3 style={s.h3}>Signature</h3>
      <pre style={s.pre}>
        <code style={s.code}>{`import { useAIMe } from "@ai-me-chat/react";

function MyChat() {
  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    sendMessage,
    status,
    error,
    stop,
    setMessages,
    clearMessages,
  } = useAIMe();

  // ...
}`}</code>
      </pre>

      <h3 style={s.h3}>Return value</h3>
      <ReturnTable
        rows={[
          {
            field: "messages",
            type: "Message[]",
            description:
              "Array of all messages in the current conversation, including user messages, assistant responses, and tool calls.",
          },
          {
            field: "input",
            type: "string",
            description: "Current value of the text input field.",
          },
          {
            field: "setInput",
            type: "(value: string) => void",
            description: "Programmatically update the input field value.",
          },
          {
            field: "handleInputChange",
            type: "(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void",
            description:
              "onChange handler to attach directly to an input or textarea element.",
          },
          {
            field: "handleSubmit",
            type: "(e?: React.FormEvent) => void",
            description:
              "onSubmit handler to attach to a form. Sends the current input as a user message.",
          },
          {
            field: "sendMessage",
            type: "(content: string) => void",
            description:
              "Programmatically send a message without a form event. Useful for suggested prompts.",
          },
          {
            field: "status",
            type: '"idle" | "loading" | "streaming" | "error"',
            description: "Current state of the assistant response pipeline.",
          },
          {
            field: "error",
            type: "Error | null",
            description: "The last error, if any. Cleared when a new message is sent.",
          },
          {
            field: "stop",
            type: "() => void",
            description: "Abort the current streaming response.",
          },
          {
            field: "setMessages",
            type: "(messages: Message[]) => void",
            description:
              "Replace the entire message array. Use sparingly — prefer clearMessages for resets.",
          },
          {
            field: "clearMessages",
            type: "() => void",
            description:
              "Reset the conversation to an empty state. Also clears session storage if persistence is enabled.",
          },
        ]}
      />

      <h3 style={s.h3}>Full example — custom chat UI</h3>
      <pre style={s.pre}>
        <code style={s.code}>{`"use client";
import { useAIMe } from "@ai-me-chat/react";

export function CustomChat() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    stop,
    clearMessages,
  } = useAIMe();

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} data-role={msg.role}>
            {msg.content}
          </div>
        ))}
        {status === "loading" && <div>Thinking…</div>}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask anything…"
          disabled={status === "loading" || status === "streaming"}
        />
        {status === "streaming" ? (
          <button type="button" onClick={stop}>Stop</button>
        ) : (
          <button type="submit">Send</button>
        )}
      </form>

      <button onClick={clearMessages}>New conversation</button>
    </div>
  );
}`}</code>
      </pre>

      <h3 style={s.h3}>Message shape</h3>
      <pre style={s.pre}>
        <code style={s.code}>{`interface Message {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  createdAt?: Date;
  toolName?: string;      // present when role === "tool"
  toolCallId?: string;
  toolResult?: unknown;
}`}</code>
      </pre>

      {/* ── useAIMeContext ── */}
      <h2 style={s.h2}>
        <span style={s.inlineCode}>useAIMeContext()</span>
      </h2>
      <div
        style={{
          background: "#0d0d18",
          border: "1px solid #1e1e32",
          borderRadius: 10,
          padding: "20px 24px",
          marginBottom: 32,
        }}
      >
        <span style={s.tag}>Context accessor</span>
        <p style={{ ...s.p, marginTop: 12, marginBottom: 0 }}>
          Returns the raw AI-Me context values set on the nearest{" "}
          <span style={s.inlineCode}>{"<AIMeProvider>"}</span>. Useful when building lower-level
          integrations or custom fetch logic.
        </p>
      </div>

      <h3 style={s.h3}>Signature</h3>
      <pre style={s.pre}>
        <code style={s.code}>{`import { useAIMeContext } from "@ai-me-chat/react";

function MyComponent() {
  const { endpoint, headers } = useAIMeContext();
  // endpoint: string — e.g. "/api/ai-me"
  // headers: Record<string, string>
}`}</code>
      </pre>

      <h3 style={s.h3}>Return value</h3>
      <ReturnTable
        rows={[
          {
            field: "endpoint",
            type: "string",
            description:
              "The endpoint URL configured on the provider. Use this when making custom fetch calls to the AI-Me handler.",
          },
          {
            field: "headers",
            type: "Record<string, string>",
            description:
              "Additional headers configured on the provider (e.g., auth tokens). Include these when making manual requests.",
          },
        ]}
      />

      <h3 style={s.h3}>Example — custom fetch</h3>
      <pre style={s.pre}>
        <code style={s.code}>{`"use client";
import { useAIMeContext } from "@ai-me-chat/react";

export function CustomFetchButton() {
  const { endpoint, headers } = useAIMeContext();

  async function handleClick() {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello!" }],
      }),
    });
    // handle streaming response...
  }

  return <button onClick={handleClick}>Send custom request</button>;
}`}</code>
      </pre>

      {/* Errors */}
      <h2 style={s.h2}>Error handling</h2>
      <p style={s.p}>
        Both hooks surface errors through the{" "}
        <span style={s.inlineCode}>error</span> field returned by{" "}
        <span style={s.inlineCode}>useAIMe()</span>. Network errors, model API errors, and tool
        execution errors are all normalised into a standard{" "}
        <span style={s.inlineCode}>Error</span> object.
      </p>
      <pre style={s.pre}>
        <code style={s.code}>{`const { error, status } = useAIMe();

if (status === "error") {
  return (
    <div role="alert">
      <p>Something went wrong: {error?.message}</p>
    </div>
  );
}`}</code>
      </pre>
    </div>
  );
}
