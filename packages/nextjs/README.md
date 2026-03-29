# @ai-me-chat/nextjs

Next.js integration for AI-Me — route handler factory with auto-discovery, filtering, and auth forwarding.

## Installation

```bash
npm install @ai-me-chat/nextjs
```

## Quick Start

**Important:** Use an optional catch-all route so sub-paths (`/tools`, `/health`) are handled:

```
app/api/ai-me/[[...path]]/route.ts    <-- correct
app/api/ai-me/route.ts                <-- won't handle /tools or /health
```

Create `app/api/ai-me/[[...path]]/route.ts`:

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

- **Filesystem discovery** — auto-scans `app/api/` routes at startup, with `src/app` auto-detection
- **OpenAPI discovery** — generate tools from an OpenAPI 3.x spec (inline or remote URL)
- **Route filtering** — include/exclude patterns with glob support
- **Auth forwarding** — forwards cookies and authorization headers to your routes
- **Write confirmation** — POST/PUT/PATCH/DELETE require user confirmation by default
- **Dynamic system prompt** — inject user-specific context via a function

## Endpoints

| Path | Method | Purpose | Auth |
|------|--------|---------|------|
| `/api/ai-me` | POST | Chat endpoint | Required |
| `/api/ai-me/tools` | GET | List discovered tools | Required |
| `/api/ai-me/health` | GET | Health check | **No** |

The health endpoint does NOT require authentication — use it for liveness probes and monitoring.

## App Directory Detection

When using `mode: "filesystem"`, the handler automatically locates your Next.js app directory:

1. `src/app` — checked first (default for `npx create-next-app`)
2. `app` — fallback for projects without a `src/` layout

You can override this by setting `appDir` in the discovery config:

```typescript
discovery: {
  mode: "filesystem",
  appDir: "src/app",       // relative to project root, or absolute
}
```

## OpenAPI Discovery Mode

Instead of scanning the filesystem, provide an OpenAPI 3.x spec (inline or remote):

```typescript
createAIMeHandler({
  discovery: {
    mode: "openapi",
    spec: {
      openapi: "3.0.3",
      info: { title: "My API", version: "1.0.0" },
      paths: {
        "/api/users": {
          get: {
            operationId: "listUsers",
            summary: "List all users",
            parameters: [
              { name: "q", in: "query", schema: { type: "string" }, description: "Search by name" }
            ],
            responses: { "200": { description: "User list" } }
          }
        }
      }
    }
  },
  ...
})
```

Or fetch from a remote URL:

```typescript
discovery: {
  mode: "openapi",
  specUrl: "http://localhost:3000/api/openapi.json"
}
```

**When to use OpenAPI mode:**
- Your app uses `src/app` and filesystem detection fails
- You want custom tool names via `operationId`
- You want rich parameter descriptions for better AI understanding
- You want to expose only specific endpoints (include/exclude still work)

## Dynamic System Prompt

Inject user-specific context by passing a function:

```typescript
createAIMeHandler({
  systemPrompt: async (session) => {
    const settings = await db.settings.findUnique({ where: { userId: session.user.id } });
    return `You are an assistant for ${settings.companyName}. The user is ${session.user.name}.`;
  },
})
```

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
