# @ai-me-chat/nextjs

Next.js integration for AI-Me — route handler factory with auto-discovery, filtering, and auth forwarding.

## Installation

```bash
npm install @ai-me-chat/nextjs
```

## Quick Start

Create `app/api/ai-me/route.ts`:

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
    // your auth logic
    return { user: { id: "user-1", role: "admin" } };
  },

  systemPrompt: "You are a helpful AI assistant for this app.",
});

export { handler as GET, handler as POST };
```

## Features

- **Filesystem discovery** — auto-scans `app/api/` routes at startup
- **OpenAPI discovery** — generate tools from an OpenAPI 3.x spec (inline or remote URL)
- **Route filtering** — include/exclude patterns with glob support
- **Auth forwarding** — forwards cookies and authorization headers to your routes
- **Write confirmation** — POST/PUT/PATCH/DELETE require user confirmation by default

## Endpoints

| Path | Method | Purpose |
|------|--------|---------|
| `/api/ai-me` | POST | Chat endpoint |
| `/api/ai-me/tools` | GET | List discovered tools |
| `/api/ai-me/health` | GET | Health check |

## Peer Dependencies

| Package | Version |
|---------|---------|
| `ai` | ^6.0.0 |
| `next` | ^16.0.0 |
| `react` | ^19.0.0 |

## Documentation

Full setup guide and API reference: [github.com/aselims/ai-me-chat](https://github.com/aselims/ai-me-chat)

## License

MIT
