# AI-Me

Open-source AI copilot plugin for SaaS applications. Install as an npm package, connect to your API routes, and give your users an AI assistant that can read and write data in your app.

[![CI](https://github.com/aselims/ai-me-chat/actions/workflows/ci.yml/badge.svg)](https://github.com/aselims/ai-me-chat/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@ai-me-chat/core)](https://www.npmjs.com/package/@ai-me-chat/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Install

```bash
npm install @ai-me-chat/nextjs @ai-me-chat/react
```

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| [`@ai-me-chat/core`](packages/core) | Tool discovery, schema extraction, OpenAPI support | [![npm](https://img.shields.io/npm/v/@ai-me-chat/core)](https://www.npmjs.com/package/@ai-me-chat/core) |
| [`@ai-me-chat/react`](packages/react) | Chat panel, command palette, confirmation dialog | [![npm](https://img.shields.io/npm/v/@ai-me-chat/react)](https://www.npmjs.com/package/@ai-me-chat/react) |
| [`@ai-me-chat/nextjs`](packages/nextjs) | Next.js route handler, auto-discovery, proxy | [![npm](https://img.shields.io/npm/v/@ai-me-chat/nextjs)](https://www.npmjs.com/package/@ai-me-chat/nextjs) |

## Quick Start

See the full [Setup Guide](docs/setup-guide.md) for detailed instructions.

**1. Create the handler** — `app/api/ai-me/route.ts`:

```typescript
import { createAIMeHandler } from "@ai-me-chat/nextjs";
import { openai } from "@ai-sdk/openai";

const handler = createAIMeHandler({
  model: openai("gpt-4o"),
  discovery: {
    mode: "filesystem",
    include: ["/api/**"],
    exclude: ["/api/ai-me/**"],
  },
  getSession: async (req) => {
    return { user: { id: "user-1", role: "admin" } };
  },
  systemPrompt: "You are a helpful AI assistant for this app.",
});

export { handler as GET, handler as POST };
```

**2. Add the chat UI** — `app/providers.tsx`:

```tsx
"use client";

import { AIMeProvider, AIMeChat } from "@ai-me-chat/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AIMeProvider endpoint="/api/ai-me">
      {children}
      <AIMeChat />
    </AIMeProvider>
  );
}
```

**3. Wrap your layout** and you're done. A chat bubble appears in the bottom-right corner.

## Features

- **Auto-discovery** — scans your `app/api/` routes and generates LLM tools automatically
- **OpenAPI support** — generate tools from any OpenAPI 3.x spec
- **Auth forwarding** — forwards cookies/headers to your routes so handlers see the real user
- **Write confirmation** — POST/PUT/PATCH/DELETE require user confirmation by default
- **Theming** — CSS custom properties, no external CSS required
- **Keyboard shortcuts** — Cmd+. toggle chat, Cmd+K command palette

## Example

See [`examples/basic-nextjs`](examples/basic-nextjs) for a complete working integration.

## Tech Stack

- **Runtime:** Node 20+, TypeScript 5.9, React 19, Next.js 16
- **AI:** Vercel AI SDK v6
- **Build:** Turborepo, pnpm workspaces, tsup
- **Test:** Vitest, Testing Library

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup.

```bash
pnpm install
pnpm build
pnpm test
```

## License

[MIT](LICENSE)
