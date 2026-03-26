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
