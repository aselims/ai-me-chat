# AI-Me Auto-Discovery System

AI-Me automatically discovers your app's API routes and converts them into LLM-callable tools — no manual registration required.

## Overview

The auto-discovery pipeline has four phases:

```
Source (filesystem or OpenAPI spec)
    ↓
1. Scan/Parse    — find routes + HTTP methods + path params
    ↓
2. Filter        — apply include/exclude glob patterns
    ↓
3. Generate      — create tool definitions (name, schema, description)
    ↓
4. Execute       — LLM calls tool → direct function or HTTP request
```

## Discovery Modes

### Filesystem Mode (Next.js App Router)

Walks your `app/api/` directory, reads each `route.ts` file, and extracts exported HTTP handlers using regex pattern matching.

**Detected export patterns:**
- `export async function GET(req: Request) { ... }`
- `export const POST = async (req: Request) => { ... }`
- `export { handler as DELETE }`

**Path handling:**
- Dynamic routes: `app/api/projects/[id]/route.ts` → `/api/projects/:id`
- Route groups stripped: `app/api/(admin)/users/route.ts` → `/api/users`
- Catch-all routes: `app/api/docs/[...slug]/route.ts` → `/api/docs/:slug*`

**Optional schema extraction:** If your route file exports Zod schemas, the schema extractor parses them statically (no runtime imports) to give the LLM richer parameter info:

```typescript
// app/api/projects/route.ts
export const bodySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});
```

Schema names are mapped to HTTP methods by convention:
- `bodySchema`, `requestSchema` → POST/PUT/PATCH
- `querySchema`, `searchSchema` → GET

### OpenAPI Mode

For apps with an OpenAPI 3.x spec (JSON or YAML), AI-Me parses the spec and generates tool definitions with rich parameter schemas derived from the spec's type information.

**Supported features:**
- Path + query parameters (`in: "path"` / `in: "query"`)
- Request body with `application/json` content schema
- `operationId` → tool name (falls back to auto-generated `method_path` name)
- `summary` / `description` → tool description
- `$ref` resolution for same-file component references (`#/components/schemas/...`)
- Required flags on parameters and request body properties
- Enum, anyOf/oneOf, array, and nested object types

**Spec sources:**
- **Inline object:** Pass the spec directly in config
- **Remote URL:** Fetched once at handler initialization

## Tool Naming

Tools are named using a `method_path` convention in snake_case:

| Route | Method | Tool Name |
|-------|--------|-----------|
| `/api/projects` | GET | `get_projects` |
| `/api/projects` | POST | `post_projects` |
| `/api/projects/:id` | GET | `get_projects_id` |
| `/api/projects/:id/tasks` | POST | `post_projects_id_tasks` |

In OpenAPI mode, `operationId` is used as the tool name when present (e.g., `listProjects`, `createTask`), normalized to snake_case.

## Confirmation & Safety

Write operations (POST, PUT, PATCH, DELETE) require user confirmation before execution by default. This is configurable:

```typescript
confirmation: {
  methods: ["DELETE"],  // Only require confirmation for DELETE
}
```

## Tool Execution

When the LLM calls a tool, it executes via one of two paths:

1. **Direct function** (preferred): If a `tool.execute` function is defined, it's called directly — no HTTP overhead, no cookie propagation issues.
2. **HTTP fallback**: Makes a `fetch()` call to the route with forwarded auth headers (cookie, authorization). Path params are interpolated, query params appended for GET, body sent as JSON for write methods.

Auth headers are forwarded to route calls but **never exposed to the LLM**.

## Integration Guide

### Filesystem Mode (Next.js)

Create a single API route for the AI-Me handler:

```typescript
// app/api/ai-me/route.ts
import { createAIMeHandler } from "@ai-me-chat/nextjs";
import { createOpenAI } from "@ai-sdk/openai";

const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY!,
});

const handler = createAIMeHandler({
  model: groq.chat("mixtral-8x7b-32768"),
  discovery: {
    mode: "filesystem",
    include: ["/api/**"],
    exclude: ["/api/ai-me/**"],
  },
  getSession: async (req) => {
    // Your auth logic here
    return { user: { id: "user-123", role: "admin" } };
  },
  systemPrompt: "You are an AI assistant for a project management app.",
});

export { handler as GET, handler as POST };
```

Every route under `app/api/` automatically becomes a tool the AI can call.

### OpenAPI Mode — Inline Spec

```typescript
import { createAIMeHandler } from "@ai-me-chat/nextjs";

const handler = createAIMeHandler({
  model: myModel,
  discovery: {
    mode: "openapi",
    spec: {
      openapi: "3.0.3",
      info: { title: "My API", version: "1.0.0" },
      paths: {
        "/api/items": {
          get: { operationId: "listItems", summary: "List all items" },
          post: {
            operationId: "createItem",
            summary: "Create an item",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      price: { type: "number" },
                    },
                    required: ["name"],
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  getSession: async () => ({ user: { id: "demo" } }),
});

export { handler as GET, handler as POST };
```

### OpenAPI Mode — Remote URL

```typescript
const handler = createAIMeHandler({
  model: myModel,
  discovery: {
    mode: "openapi",
    specUrl: "https://api.example.com/openapi.json",
    exclude: ["/internal/**"],  // Optional: filter out internal routes
  },
  getSession: async () => ({ user: { id: "demo" } }),
});
```

The spec is fetched once at handler initialization and cached.

## Architecture

### Key Files

| File | Purpose |
|------|---------|
| `packages/core/src/types.ts` | `DiscoveredRoute`, `AIMeToolDefinition`, `DiscoveryConfig` |
| `packages/nextjs/src/scanner.ts` | Filesystem route scanning |
| `packages/nextjs/src/filter.ts` | Route filtering via glob patterns |
| `packages/core/src/tools/schema-extractor.ts` | Static Zod schema parsing from route files |
| `packages/core/src/tools/generate-tools.ts` | Tool definition generation from discovered routes |
| `packages/core/src/tools/openapi-parser.ts` | OpenAPI spec parsing and tool generation |
| `packages/core/src/executor.ts` | Tool execution (direct function / HTTP) |
| `packages/nextjs/src/handler.ts` | Handler orchestration (`createAIMeHandler`) |

### Data Flow

```
Next.js App Router / OpenAPI Spec
    ↓
scanRoutes() / parseOpenAPISpec()  →  DiscoveredRoute[]
    ↓
filterRoutes()                     →  DiscoveredRoute[]
    ↓
generateToolDefinitions() /        →  AIMeToolDefinition[]
generateToolsFromOpenAPI()
    ↓
Convert to AI SDK v6 tool()        →  Record<name, tool>
    ↓
streamText({ tools })              →  LLM can call tools
    ↓
executeTool()                      →  Direct function or HTTP call
    ↓
Route handler / service function   →  Response
```

### Design Decisions

| Decision | Rationale |
|----------|-----------|
| DEC-008: Direct function execution over HTTP | Avoids cookie propagation issues and latency |
| DEC-006: AI SDK v6 `tool()` format | Modern tool definition with `strict: false` for provider compat |
| Confirmation on writes by default | Safety — destructive ops require user approval |
| Lazy + cached discovery | Tools discovered once at init, not per-request |
| Static schema extraction | Avoids runtime import side effects |
