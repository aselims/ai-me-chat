# @ai-me-chat/core

Framework-agnostic AI copilot engine. Provides tool discovery, schema extraction, OpenAPI parsing, and execution for building AI assistants that interact with your app's API.

## Installation

```bash
npm install @ai-me-chat/core
```

## What it does

- **Tool discovery** — scans API routes and generates LLM-compatible tool definitions
- **Schema extraction** — reads Zod schemas from route files for rich parameter types
- **OpenAPI support** — parses OpenAPI 3.x specs into tool definitions
- **Execution engine** — proxies tool calls to your API with auth forwarding

## Usage

```typescript
import { generateToolDefinitions, executeToolCall } from "@ai-me-chat/core";
```

This is the foundation package — typically used via `@ai-me-chat/nextjs` (server) and `@ai-me-chat/react` (client) rather than directly.

## Peer Dependencies

| Package | Version |
|---------|---------|
| `ai` | ^6.0.0 |
| `zod` | ^4.0.0 |

## Documentation

Full setup guide and API reference: [github.com/aselims/ai-me-chat](https://github.com/aselims/ai-me-chat)

## License

MIT
