# @ai-me-chat/react

Drop-in React UI components for AI-Me — chat panel, command palette, confirmation dialog, and hooks.

## Installation

```bash
npm install @ai-me-chat/react
```

## Quick Start

```tsx
"use client";

import { AIMeProvider, AIMeChat } from "@ai-me-chat/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AIMeProvider endpoint="/api/ai-me">
      {children}
      <AIMeChat
        suggestedPrompts={[
          "Show me all projects",
          "Create a new project",
        ]}
      />
    </AIMeProvider>
  );
}
```

## Components

- **`<AIMeProvider>`** — context provider, connects to your AI-Me backend
- **`<AIMeChat>`** — floating chat panel with toggle (Cmd+.)
- **`<AIMeCommandPalette>`** — Cmd+K command palette
- **`<AIMeConfirm>`** — confirmation dialog for destructive actions

## Hooks

- **`useAIMe()`** — full chat state (messages, input, submit) for custom UIs
- **`useAIMeContext()`** — access provider context

## Syncing Client State After Tool Execution

When the AI executes a tool that mutates data (POST/PUT/DELETE), your client-side
state may be stale. Use `onToolComplete` to trigger a refresh and `onMessageComplete`
to know when the full response is done:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { AIMeProvider, AIMeChat } from "@ai-me-chat/react";

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <AIMeProvider endpoint="/api/ai-me">
      {children}
      <AIMeChat
        onToolComplete={(tool) => {
          // Refresh the page whenever the AI calls a mutating tool.
          // You can narrow by tool.name or tool.httpMethod for finer control.
          router.refresh();
        }}
        onMessageComplete={(message) => {
          // The assistant finished its full response — all tool calls are done.
          console.log("Assistant reply:", message.content);
        }}
      />
    </AIMeProvider>
  );
}
```

`onToolComplete` fires once per tool execution, immediately after the result
is available in the message stream. Fields:

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Tool (function) name |
| `httpMethod` | `string \| undefined` | HTTP method, if surfaced |
| `path` | `string \| undefined` | API path called, if surfaced |
| `result` | `unknown` | Raw tool result |
| `requiresConfirmation` | `boolean \| undefined` | Whether confirmation was required |

`onMessageComplete` fires once when the assistant finishes a full response
(status transitions from `"streaming"` to `"ready"`). Fields:

| Field | Type | Description |
|---|---|---|
| `role` | `string` | Always `"assistant"` |
| `content` | `string` | Concatenated text content |
| `toolCalls` | `unknown[] \| undefined` | Tool-call parts, if any |

## Custom Confirmation Rendering

By default, AI-Me shows its built-in `<AIMeConfirm>` dialog before executing
any tool that requires user confirmation (destructive actions, etc.).

Use `renderConfirmation` on `<AIMeChat>` to replace the default dialog with
your own UI — a branded modal, a slide-over panel, an inline card, whatever
fits your design system:

```tsx
"use client";

import { AIMeProvider, AIMeChat } from "@ai-me-chat/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AIMeProvider endpoint="/api/ai-me">
      {children}
      <AIMeChat
        renderConfirmation={({ tool, params, onConfirm, onCancel }) => (
          <MyConfirmModal
            title={`Run "${tool.name}"?`}
            description={tool.description}
            details={`${tool.httpMethod} ${tool.path}`}
            params={params}
            onConfirm={onConfirm}
            onCancel={onCancel}
          />
        )}
      />
    </AIMeProvider>
  );
}
```

The `renderConfirmation` callback receives:

| Prop | Type | Description |
|---|---|---|
| `tool.name` | `string` | Tool (function) name |
| `tool.httpMethod` | `string` | HTTP method, e.g. `"POST"` |
| `tool.path` | `string` | API path, e.g. `"/api/projects"` |
| `tool.description` | `string` | Human-readable description |
| `params` | `Record<string, unknown>` | Resolved call parameters |
| `onConfirm` | `() => void` | Call to proceed with execution |
| `onCancel` | `() => void` | Call to abort |

If `renderConfirmation` is omitted, the default dialog is used.

## Navigation Intents (Action Callbacks)

Sometimes the AI should guide the UI — navigate to a route, pre-fill a form,
open a modal — rather than making an API call directly. Use the `onAction`
prop on `<AIMeProvider>` to handle these client-side intents:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { AIMeProvider, AIMeChat } from "@ai-me-chat/react";

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <AIMeProvider
      endpoint="/api/ai-me"
      onAction={(action) => {
        switch (action.type) {
          case "navigate":
            router.push(action.href as string);
            break;
          case "prefill":
            // Broadcast to a form using a custom event, context, or state manager
            window.dispatchEvent(
              new CustomEvent("ai-me:prefill", { detail: action.fields }),
            );
            break;
          case "open-modal":
            // Open whichever modal the AI identified
            openModal(action.modalId as string);
            break;
        }
      }}
    >
      {children}
      <AIMeChat />
    </AIMeProvider>
  );
}
```

The `onAction` callback receives an object with at least a `type` field plus
any additional payload the tool provides:

| Field | Type | Description |
|---|---|---|
| `type` | `string` | Action kind — `"navigate"`, `"prefill"`, `"open-modal"`, etc. |
| `...rest` | `unknown` | Flexible payload defined per action type |

The `onAction` callback is stored in context and available to any component
via `useAIMeContext().onAction`. The actual tool registrations that emit these
actions live in your AI-Me handler (server-side), so client and server
concerns stay separated.

## Theming

```tsx
<AIMeChat
  theme={{
    primaryColor: "#e11d48",
    backgroundColor: "#0f172a",
    textColor: "#f8fafc",
    borderRadius: "8px",
    fontFamily: "'Inter', sans-serif",
  }}
/>
```

## Peer Dependencies

| Package | Version |
|---------|---------|
| `@ai-sdk/react` | ^3.0.0 |
| `ai` | ^6.0.0 |
| `react` | ^19.0.0 |
| `react-dom` | ^19.0.0 |

## Documentation

Full setup guide and API reference: [github.com/aselims/ai-me-chat](https://github.com/aselims/ai-me-chat)

## License

MIT
