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
 * Create an AI-Me API route handler for Next.js App Router.
 *
 * Usage:
 *   const handler = createAIMeHandler({ model, discovery, getSession });
 *   export { handler as GET, handler as POST };
 */
export function createAIMeHandler(config: AIMeConfig) {
  // Discover tools at initialization time
  let toolDefinitions: AIMeToolDefinition[] | null = null;
  let toolsPromise: Promise<AIMeToolDefinition[]> | null = null;

  async function getToolDefinitions(appDir: string): Promise<AIMeToolDefinition[]> {
    if (toolDefinitions) return toolDefinitions;
    if (toolsPromise) return toolsPromise;

    toolsPromise = initTools(appDir);
    toolDefinitions = await toolsPromise;
    toolsPromise = null;
    return toolDefinitions;
  }

  async function initTools(appDir: string): Promise<AIMeToolDefinition[]> {
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
    // Auth check
    const session = await config.getSession(req);
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const url = new URL(req.url);

    // Route: GET /api/ai-me/tools — list available tools (debug)
    if (req.method === "GET" && url.pathname.endsWith("/tools")) {
      const appDir = process.cwd() + "/app";
      let tools: AIMeToolDefinition[];
      try {
        tools = await getToolDefinitions(appDir);
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error instanceof Error ? error.message : "Tool discovery failed" }),
          { status: 500, headers: { "Content-Type": "application/json" } },
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

    // Route: GET /api/ai-me/health
    if (req.method === "GET" && url.pathname.endsWith("/health")) {
      return Response.json({ status: "ok", version: "0.0.1" });
    }

    // Route: POST /api/ai-me (chat)
    if (req.method === "POST") {
      return handleChat(req, config, session, getToolDefinitions);
    }

    return new Response("Not Found", { status: 404 });
  }

  return handler;
}

async function handleChat(
  req: Request,
  config: AIMeConfig,
  session: NonNullable<Awaited<ReturnType<AIMeConfig["getSession"]>>>,
  getToolDefinitions: (appDir: string) => Promise<AIMeToolDefinition[]>,
): Promise<Response> {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const appDir = process.cwd() + "/app";
  const toolDefs = await getToolDefinitions(appDir);

  // Build execution context with forwarded auth headers
  const baseUrl = new URL(req.url).origin;
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
    const def = toolDef; // capture for closure
    aiTools[def.name] = tool({
      description: def.description,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      inputSchema: def.parameters as any,
      // Disable strict schema validation for OpenAI-compatible providers
      // (e.g., Groq) that reject additionalProperties in tool schemas
      strict: false,
      execute: async (params: Record<string, unknown>) => {
        const result = await executeTool(
          def,
          params,
          executionContext,
        );
        return result.response;
      },
    });
  }

  const modelMessages = await convertToModelMessages(messages);

  // Limit history if configured
  const maxHistory = config.maxHistoryMessages ?? 20;
  const trimmedMessages =
    modelMessages.length > maxHistory
      ? modelMessages.slice(-maxHistory)
      : modelMessages;

  const result = streamText({
    model: config.model,
    system:
      config.systemPrompt ??
      `You are an AI assistant for this application. You can help users query data and perform actions. User: ${session.user.id}${session.user.role ? ` (role: ${session.user.role})` : ""}`,
    messages: trimmedMessages,
    tools: aiTools,
    stopWhen: stepCountIs(5),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(config.providerOptions ? { providerOptions: config.providerOptions as any } : {}),
  });

  return result.toUIMessageStreamResponse();
}
