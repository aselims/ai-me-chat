import type { AIMeToolDefinition, ToolExecution } from "./types.js";

/**
 * Execute a tool by calling its execute function or making an HTTP request
 * to the host app's API route.
 *
 * DEC-008: Uses shared service functions when available, falls back to HTTP.
 */
export async function executeTool(
  tool: AIMeToolDefinition,
  params: Record<string, unknown>,
  context: ExecutionContext,
): Promise<ToolExecution> {
  const id = crypto.randomUUID();
  const startTime = new Date();

  try {
    let response: unknown;

    if (tool.execute) {
      // Custom tool with direct execute function (shared service pattern)
      response = await tool.execute(params);
    } else if (tool.httpMethod && tool.path) {
      // Auto-discovered route — call via HTTP with forwarded auth
      response = await executeHttpTool(tool, params, context);
    } else {
      throw new Error(`Tool "${tool.name}" has no execute function or HTTP path`);
    }

    return {
      id,
      toolName: tool.name,
      parameters: params,
      statusCode: 200,
      response,
      confirmed: !tool.requiresConfirmation,
      executedAt: startTime,
    };
  } catch (error) {
    return {
      id,
      toolName: tool.name,
      parameters: params,
      statusCode: 500,
      response: { error: error instanceof Error ? error.message : "Unknown error" },
      confirmed: false,
      executedAt: startTime,
    };
  }
}

export interface ExecutionContext {
  /** Base URL for HTTP calls (e.g., "http://localhost:3000") */
  baseUrl: string;
  /** Headers to forward (cookies, authorization) */
  headers: Record<string, string>;
}

async function executeHttpTool(
  tool: AIMeToolDefinition,
  params: Record<string, unknown>,
  context: ExecutionContext,
): Promise<unknown> {
  const method = tool.httpMethod!;
  let url = `${context.baseUrl}${tool.path}`;

  // Replace path parameters
  for (const [key, value] of Object.entries(params)) {
    if (url.includes(`:${key}`)) {
      url = url.replace(`:${key}`, encodeURIComponent(String(value)));
    }
  }

  const fetchOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...context.headers,
    },
  };

  // Add query params for GET, body for write methods
  if (method === "GET" && params.query) {
    const queryParams = new URLSearchParams(
      params.query as Record<string, string>,
    );
    url += `?${queryParams.toString()}`;
  } else if (["POST", "PUT", "PATCH"].includes(method) && params.body) {
    fetchOptions.body = JSON.stringify(params.body);
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}
