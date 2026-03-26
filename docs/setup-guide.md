# AI-Me Setup Guide

Add an AI copilot to your Next.js app in 4 files. AI-Me auto-discovers your API routes and lets users interact with them through natural language.

## Prerequisites

- Next.js 16+ (App Router)
- React 19+
- Node.js 20+
- An LLM API key (OpenAI, Groq, Anthropic, or any OpenAI-compatible provider)

## 1. Install Dependencies

```bash
npm install @ai-me-chat/core @ai-me-chat/nextjs @ai-me-chat/react ai @ai-sdk/react @ai-sdk/openai
```

| Package | Purpose |
|---------|---------|
| `@ai-me-chat/core` | Engine: types, tool generation, execution |
| `@ai-me-chat/nextjs` | Next.js handler, route scanner, filtering |
| `@ai-me-chat/react` | Chat UI, command palette, confirmation dialog |
| `ai` | Vercel AI SDK v6 (streaming, tool calling) |
| `@ai-sdk/react` | React hooks for AI SDK (`useChat`) |
| `@ai-sdk/openai` | OpenAI-compatible provider adapter |

**Peer dependency versions:**

| Peer | Required |
|------|----------|
| `ai` | ^6.0.0 |
| `zod` | ^4.0.0 |
| `next` | ^16.0.0 |
| `react` / `react-dom` | ^19.0.0 |
| `@ai-sdk/react` | ^3.0.0 |

> **Using a different LLM provider?** Replace `@ai-sdk/openai` with the appropriate adapter: `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/mistral`, etc. See [Vercel AI SDK providers](https://ai-sdk.dev/providers).

## 2. Set Environment Variables

Create `.env.local` in your project root:

```bash
# Pick your provider:

# Option A: OpenAI
OPENAI_API_KEY=sk-...

# Option B: Groq (OpenAI-compatible, free tier available)
GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-120b    # optional: override default model
```

## 3. Create the AI-Me Handler

This is the backend — a single API route that discovers your routes and connects them to the LLM.

Create `app/api/ai-me/route.ts`:

```typescript
import { createAIMeHandler } from "@ai-me-chat/nextjs";
import { createOpenAI } from "@ai-sdk/openai";

// --- Configure your LLM provider ---

// OpenAI
// import { openai } from "@ai-sdk/openai";
// const model = openai("gpt-4o");

// Groq (OpenAI-compatible)
const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY!,
});
const model = groq.chat(process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile");

// --- Create the handler ---

const handler = createAIMeHandler({
  model,

  discovery: {
    mode: "filesystem",
    include: ["/api/**"],        // expose all API routes to the AI
    exclude: ["/api/ai-me/**"],  // but not the AI handler itself
  },

  getSession: async (req) => {
    // Replace with your auth logic:
    // const session = await auth(); // NextAuth, Clerk, etc.
    // if (!session?.user) return null;
    // return { user: { id: session.user.id, role: session.user.role } };

    return { user: { id: "demo-user", role: "admin" } };
  },

  systemPrompt:
    "You are an AI assistant for this application. Help users query data and perform actions. Be helpful and concise.",

  // Optional: needed for some OpenAI-compatible providers (Groq, Together, etc.)
  providerOptions: {
    openai: { strictJsonSchema: false },
  },
});

export { handler as GET, handler as POST };
```

### What this does

- **GET `/api/ai-me/tools`** — lists all discovered tools (useful for debugging)
- **GET `/api/ai-me/health`** — health check
- **POST `/api/ai-me`** — chat endpoint (the React components call this)

### Configuration Reference

```typescript
createAIMeHandler({
  // Required
  model: LanguageModel,                          // Any Vercel AI SDK v6 model
  discovery: { mode, include?, exclude?, ... },   // How to find your routes
  getSession: (req) => Promise<Session | null>,   // Auth — return null to reject

  // Optional
  systemPrompt?: string,                         // Instructions for the LLM
  confirmation?: {
    methods?: string[],          // Default: ["POST", "PUT", "PATCH", "DELETE"]
    message?: string,            // Custom confirmation prompt
  },
  maxHistoryMessages?: number,   // Cap conversation history (default: 20)
  providerOptions?: Record<string, Record<string, unknown>>,
  cloud?: { apiKey, analytics?, auditLog? },      // AI-Me Cloud (optional)
});
```

## 4. Add the Chat UI

### A. Create a providers wrapper

Create `app/providers.tsx`:

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
          "Create a new project called 'Q3 Launch'",
          "What's the total budget across all projects?",
        ]}
      />
    </AIMeProvider>
  );
}
```

### B. Wrap your layout

Update `app/layout.tsx`:

```tsx
import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

That's it. A chat bubble appears in the bottom-right corner. Press **Cmd+.** (Mac) or **Ctrl+.** (Windows/Linux) to toggle it.

### Component Props

**`<AIMeProvider>`**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `endpoint` | `string` | Yes | Path to your AI-Me handler (e.g., `/api/ai-me`) |
| `headers` | `Record<string, string>` | No | Additional headers sent with every request |

**`<AIMeChat>`**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `"bottom-right" \| "bottom-left" \| "inline"` | `"bottom-right"` | Where the chat panel appears |
| `theme` | `AIMeTheme` | — | Color/font overrides |
| `welcomeMessage` | `string` | `"Hi! I can help you..."` | Message shown on empty chat |
| `suggestedPrompts` | `string[]` | — | Clickable prompt suggestions |
| `defaultOpen` | `boolean` | `false` | Whether chat starts open |
| `onToggle` | `(open: boolean) => void` | — | Callback when chat opens/closes |

## 5. Build Your API Routes

AI-Me auto-discovers routes in your `app/api/` directory. Each exported HTTP method becomes a tool the AI can call.

Example — `app/api/projects/route.ts`:

```typescript
const projects = [
  { id: "1", name: "Website Redesign", status: "active", budget: 50000 },
  { id: "2", name: "Mobile App", status: "planning", budget: 120000 },
];

export async function GET() {
  return Response.json(projects);
}

export async function POST(req: Request) {
  const body = await req.json();
  const project = { id: crypto.randomUUID(), ...body };
  projects.push(project);
  return Response.json(project, { status: 201 });
}
```

Example — `app/api/projects/[id]/route.ts`:

```typescript
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // find and return project by id
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  // update project
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // delete project
}
```

These routes automatically become tools:

| Route | Method | Tool Name | Confirmation |
|-------|--------|-----------|-------------|
| `/api/projects` | GET | `get_projects` | No |
| `/api/projects` | POST | `post_projects` | Yes |
| `/api/projects/:id` | GET | `get_projects_id` | No |
| `/api/projects/:id` | PUT | `put_projects_id` | Yes |
| `/api/projects/:id` | DELETE | `delete_projects_id` | Yes |

### Optional: Export Zod Schemas for Better AI Context

If you export Zod schemas from your route files, the AI gets richer parameter descriptions:

```typescript
import { z } from "zod";

export const bodySchema = z.object({
  name: z.string(),
  status: z.enum(["planning", "active", "completed"]),
  budget: z.number().optional(),
});

export async function POST(req: Request) {
  const body = bodySchema.parse(await req.json());
  // ...
}
```

Schema naming convention:
- `bodySchema` / `requestSchema` → mapped to POST/PUT/PATCH
- `querySchema` / `searchSchema` → mapped to GET

## Discovery Modes

### Filesystem Mode (default)

Scans `app/api/` at startup. Best for Next.js apps where the AI should call your own routes.

```typescript
discovery: {
  mode: "filesystem",
  include: ["/api/**"],
  exclude: ["/api/ai-me/**", "/api/webhooks/**", "/api/internal/**"],
}
```

### OpenAPI Mode

For external APIs or apps that have an OpenAPI spec. Two ways to provide the spec:

**Inline spec:**

```typescript
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
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { name: { type: "string" } },
                  required: ["name"],
                },
              },
            },
          },
        },
      },
    },
  },
}
```

**Remote URL (fetched once at startup):**

```typescript
discovery: {
  mode: "openapi",
  specUrl: "https://api.example.com/openapi.json",
  exclude: ["/internal/**"],
}
```

OpenAPI mode uses `operationId` as the tool name when available, and generates richer parameter schemas from the spec's type information.

## Theming

AI-Me uses CSS custom properties — no Tailwind or external CSS required. Override via the `theme` prop:

```tsx
<AIMeChat
  theme={{
    primaryColor: "#e11d48",      // rose-600
    backgroundColor: "#0f172a",   // slate-900
    textColor: "#f8fafc",         // slate-50
    borderRadius: "8px",
    fontFamily: "'Inter', sans-serif",
  }}
/>
```

Default CSS variables (all prefixed `--ai-me-` to avoid conflicts):

| Variable | Default |
|----------|---------|
| `--ai-me-primary` | `#6366f1` (indigo) |
| `--ai-me-primary-hover` | `#4f46e5` |
| `--ai-me-bg` | `#ffffff` |
| `--ai-me-bg-secondary` | `#f9fafb` |
| `--ai-me-text` | `#111827` |
| `--ai-me-text-secondary` | `#6b7280` |
| `--ai-me-border` | `#e5e7eb` |
| `--ai-me-radius` | `12px` |
| `--ai-me-font` | `system-ui, -apple-system, sans-serif` |
| `--ai-me-shadow` | `0 4px 24px rgba(0, 0, 0, 0.12)` |

## Additional Components

### Command Palette

A Cmd+K search interface:

```tsx
import { AIMeCommandPalette } from "@ai-me-chat/react";

<AIMeCommandPalette
  commands={[
    { id: "projects", label: "Go to Projects", action: () => router.push("/projects") },
    { id: "settings", label: "Open Settings", action: () => router.push("/settings") },
  ]}
/>
```

### Confirmation Dialog

For reviewing destructive actions before they execute. Rendered automatically by `AIMeChat` when a tool with `requiresConfirmation: true` is called.

### useAIMe Hook

Build custom chat UIs:

```tsx
"use client";

import { useAIMe } from "@ai-me-chat/react";

export function CustomChat() {
  const { messages, input, status, error, handleSubmit, handleInputChange } = useAIMe();

  return (
    <form onSubmit={handleSubmit}>
      {messages.map((m) => (
        <div key={m.id}>{m.content}</div>
      ))}
      <input value={input} onChange={handleInputChange} />
      <button type="submit" disabled={status === "streaming"}>Send</button>
    </form>
  );
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Cmd+.** / **Ctrl+.** | Toggle chat panel |
| **Cmd+K** / **Ctrl+K** | Open command palette (if used) |
| **Escape** | Close chat / command palette |
| **Enter** | Send message |

## Security

AI-Me follows these security principles:

- **Auth forwarding**: Your `getSession` callback runs on every request. Return `null` to reject unauthorized users.
- **Cookie/header forwarding**: When the AI calls your routes, it forwards the original request's `cookie` and `authorization` headers — your route handlers see the real user.
- **No credential leakage**: Auth headers are never sent to the LLM context.
- **Write confirmation**: POST, PUT, PATCH, DELETE operations require user confirmation by default.

## File Structure

```
your-app/
├── app/
│   ├── layout.tsx              ← wrap with Providers
│   ├── providers.tsx           ← AIMeProvider + AIMeChat
│   ├── page.tsx
│   └── api/
│       ├── ai-me/
│       │   └── route.ts        ← createAIMeHandler
│       ├── projects/
│       │   ├── route.ts        ← GET, POST (auto-discovered)
│       │   └── [id]/
│       │       └── route.ts    ← GET, PUT, DELETE (auto-discovered)
│       └── users/
│           └── route.ts        ← auto-discovered
├── .env.local                  ← API keys
└── package.json
```

## Debugging

Visit `/api/ai-me/tools` in your browser to see all discovered tools:

```json
[
  {
    "name": "get_projects",
    "description": "GET /api/projects",
    "httpMethod": "GET",
    "path": "/api/projects",
    "requiresConfirmation": false
  },
  {
    "name": "post_projects",
    "description": "POST /api/projects",
    "httpMethod": "POST",
    "path": "/api/projects",
    "requiresConfirmation": true
  }
]
```

If a route isn't showing up:
1. Verify it exports a named HTTP method (`GET`, `POST`, etc.)
2. Check your `include`/`exclude` patterns
3. Make sure the route file is named `route.ts` (not `page.ts` or other names)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Chat bubble doesn't appear | Ensure `Providers` wraps your layout and is `"use client"` |
| "Unauthorized" on chat | Your `getSession` is returning `null` — check auth logic |
| No tools discovered | Visit `/api/ai-me/tools` — check include/exclude patterns |
| LLM errors | Verify your API key in `.env.local` and model name |
| Groq schema errors | Add `providerOptions: { openai: { strictJsonSchema: false } }` |
| Tools not calling routes | Check that route handlers return `Response.json()` |
