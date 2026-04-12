import fs from "fs";
import path from "path";
import { streamText, convertToModelMessages, tool, stepCountIs } from "ai";
import type { UIMessage } from "ai";
import {
  type AIMeConfig,
  type AIMeToolDefinition,
  generateToolDefinitions,
  generateToolsFromOpenAPI,
  fetchOpenAPISpec,
  executeTool,
} from "@ai-me-chat/core";
import type { OpenAPISpec, ExecutionContext } from "@ai-me-chat/core";
import { scanRoutes } from "./scanner.js";
import { filterRoutes } from "./filter.js";

/**
 * Resolve the Next.js app directory.
 *
 * Priority:
 *   1. `config.discovery.appDir` — explicit override (absolute or relative to cwd)
 *   2. `src/app` — default for `create-next-app` projects
 *   3. `app` — legacy / bare Next.js layout
 */
/** @internal Exported for testing only — not part of the public API. */
export function detectAppDir(): string {
  const srcApp = path.join(process.cwd(), "src", "app");
  if (fs.existsSync(srcApp)) return srcApp;
  return path.join(process.cwd(), "app");
}

/** @internal Exported for testing only — not part of the public API. */
export function resolveAppDir(config: AIMeConfig): string {
  if (config.discovery.appDir) {
    return path.resolve(process.cwd(), config.discovery.appDir);
  }
  return detectAppDir();
}

/**
 * Create an AI-Me API route handler for Next.js App Router.
 *
 * Usage:
 *   const handler = createAIMeHandler({ model, discovery, getSession });
 *   export { handler as GET, handler as POST };
 */
export function createAIMeHandler(config: AIMeConfig) {
  // Resolve the app directory once at handler-creation time so both the
  // /tools endpoint and handleChat use the same value.
  const appDir = resolveAppDir(config);

  // Discover tools at initialization time
  let toolDefinitions: AIMeToolDefinition[] | null = null;
  let toolsPromise: Promise<AIMeToolDefinition[]> | null = null;

  async function getToolDefinitions(): Promise<AIMeToolDefinition[]> {
    if (toolDefinitions) return toolDefinitions;
    if (toolsPromise) return toolsPromise;

    toolsPromise = initTools();
    toolDefinitions = await toolsPromise;
    toolsPromise = null;
    return toolDefinitions;
  }

  async function initTools(): Promise<AIMeToolDefinition[]> {
    if (config.discovery.mode === "openapi") {
      let spec: OpenAPISpec;
      if (config.discovery.spec) {
        spec = config.discovery.spec as unknown as OpenAPISpec;
      } else if (config.discovery.specUrl) {
        spec = await fetchOpenAPISpec(config.discovery.specUrl);
      } else {
        throw new Error(
          'OpenAPI discovery mode requires either "spec" (inline object) or "specUrl" (remote URL) in discovery config',
        );
      }
      const tools = generateToolsFromOpenAPI(spec, config.confirmation);
      if (config.discovery.include || config.discovery.exclude) {
        const routes = tools.map((t) => ({
          path: t.path ?? "",
          methods: [t.httpMethod ?? "GET"],
          pathParams: [],
          filePath: "",
        }));
        const filtered = filterRoutes(routes, config.discovery);
        const filteredPaths = new Set(
          filtered.flatMap((r) => r.methods.map((m) => `${m}:${r.path}`)),
        );
        return tools.filter((t) => filteredPaths.has(`${t.httpMethod}:${t.path}`));
      }
      return tools;
    }

    let routes = scanRoutes(appDir);
    routes = filterRoutes(routes, config.discovery);
    return generateToolDefinitions(routes, config.confirmation);
  }

  async function handler(req: Request): Promise<Response> {
    const url = new URL(req.url);

    // Health check — always public, no auth required
    if (req.method === "GET" && url.pathname.endsWith("/health")) {
      return Response.json({ status: "ok" });
    }

    // Auth check — everything else requires a session
    const session = await config.getSession(req);
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Route: GET /api/ai-me/tools — list available tools (debug)
    if (req.method === "GET" && url.pathname.endsWith("/tools")) {
      let tools: AIMeToolDefinition[];
      try {
        tools = await getToolDefinitions();
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : "Tool discovery failed" },
          { status: 500 },
        );
      }
      return Response.json(
        tools.map((t) => ({
          name: t.name,
          description: t.description,
          httpMethod: t.httpMethod,
          path: t.path,
          requiresConfirmation: t.requiresConfirmation,
        })),
      );
    }

    // Route: POST /api/ai-me (chat)
    if (req.method === "POST") {
      // Use configured baseUrl, or fall back to http://127.0.0.1:{port} to
      // avoid SSL issues behind reverse proxies, or use the request origin.
      const effectiveBaseUrl =
        config.baseUrl ??
        `http://127.0.0.1:${url.port || (url.protocol === "https:" ? "443" : "3000")}`;
      return handleChat(req, config, session, getToolDefinitions, effectiveBaseUrl);
    }

    return new Response("Not Found", { status: 404 });
  }

  return handler;
}

async function handleChat(
  req: Request,
  config: AIMeConfig,
  session: NonNullable<Awaited<ReturnType<AIMeConfig["getSession"]>>>,
  getToolDefinitions: () => Promise<AIMeToolDefinition[]>,
  baseUrl: string,
): Promise<Response> {
  // Parse and validate request body
  let body: { messages?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "messages must be a non-empty array" }, { status: 400 });
  }

  // Validate each message has required UIMessage fields
  for (const msg of messages) {
    if (!msg.id || !msg.role) {
      return Response.json(
        {
          error: "Each message must have an 'id' and 'role' field. Use the AI SDK UIMessage format.",
          received: Object.keys(msg),
        },
        { status: 400 },
      );
    }
  }

  const toolDefs = await getToolDefinitions();
  const executionContext: ExecutionContext = {
    baseUrl,
    headers: {
      cookie: req.headers.get("cookie") ?? "",
      authorization: req.headers.get("authorization") ?? "",
    },
  };

  // Convert tool definitions to AI SDK v6 tool() format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const aiTools: Record<string, any> = {};
  for (const toolDef of toolDefs) {
    aiTools[toolDef.name] = tool({
      description: toolDef.description,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      inputSchema: toolDef.parameters as any,
      // Disable strict schema validation for OpenAI-compatible providers
      // (e.g., Groq) that reject additionalProperties in tool schemas
      strict: false,
      // AI SDK pauses and emits an approval request the client must resolve
      needsApproval: toolDef.requiresConfirmation,
      execute: async (params: Record<string, unknown>) => {
        const result = await executeTool(
          toolDef,
          params,
          executionContext,
        );
        return result.response;
      },
    });
  }

  const modelMessages = await convertToModelMessages(messages as UIMessage[]);

  // Limit history if configured
  const maxHistory = config.maxHistoryMessages ?? 20;
  const trimmedMessages =
    modelMessages.length > maxHistory
      ? modelMessages.slice(-maxHistory)
      : modelMessages;

  // Resolve system prompt — supports static string or async function
  const defaultPrompt = `You are an AI assistant for this application. You can help users query data and perform actions. User: ${session.user.id}${session.user.role ? ` (role: ${session.user.role})` : ""}`;
  const systemPromptValue =
    typeof config.systemPrompt === "function"
      ? await config.systemPrompt(session)
      : config.systemPrompt ?? defaultPrompt;

  const result = streamText({
    model: config.model,
    system: systemPromptValue,
    messages: trimmedMessages,
    tools: aiTools,
    stopWhen: stepCountIs(5),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(config.providerOptions ? { providerOptions: config.providerOptions as any } : {}),
  });

  const response = result.toUIMessageStreamResponse();

  // Strip reasoning events (reasoning-start, reasoning-end) from the SSE stream.
  // Some providers (e.g. Groq) emit these even when not requested, and they cause
  // the AI SDK client to create empty message parts that break rendering.
  if (!response.body) return response;
  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      const text = new TextDecoder().decode(chunk);
      const lines = text.split("\n");
      const filtered = lines.filter((line) => {
        if (!line.startsWith("data: ")) return true;
        try {
          const data = JSON.parse(line.slice(6));
          return data.type !== "reasoning-start" && data.type !== "reasoning-end";
        } catch {
          return true;
        }
      });
      if (filtered.length > 0) {
        controller.enqueue(new TextEncoder().encode(filtered.join("\n")));
      }
    },
  });

  return new Response(response.body.pipeThrough(transform), {
    headers: response.headers,
    status: response.status,
  });
}
