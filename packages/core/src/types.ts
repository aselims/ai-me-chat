import type { LanguageModel } from "ai";

// ---- Configuration ----

export interface AIMeConfig {
  /** LLM model instance (Vercel AI SDK v6) */
  model: LanguageModel;

  /** Route discovery configuration */
  discovery: DiscoveryConfig;

  /** Get the current user session from the request */
  getSession: (req: Request) => Promise<AIMeSession | null>;

  /** System prompt prepended to all conversations. Pass a function to inject user-specific context. */
  systemPrompt?: string | ((session: AIMeSession) => string | Promise<string>);

  /** Confirmation settings for write operations */
  confirmation?: ConfirmationConfig;

  /** Maximum conversation history messages to send to LLM */
  maxHistoryMessages?: number;

  /** Cloud analytics (optional) */
  cloud?: CloudConfig;

  /** Provider-specific options passed to streamText (e.g., { openai: { strictJsonSchema: false } }) */
  providerOptions?: Record<string, Record<string, unknown>>;
}

export interface DiscoveryConfig {
  mode: "filesystem" | "openapi";
  /**
   * Absolute or relative path to the Next.js app directory.
   * Defaults to auto-detection: prefers `src/app` when it exists, falls back to `app`.
   * Only used when mode is "filesystem".
   */
  appDir?: string;
  /** Glob patterns of routes to include */
  include?: string[];
  /** Glob patterns of routes to exclude */
  exclude?: string[];
  /** OpenAPI spec URL fetched once at init (when mode is "openapi") */
  specUrl?: string;
  /** Inline OpenAPI spec object — takes precedence over specUrl (when mode is "openapi") */
  spec?: Record<string, unknown>;
}

export interface ConfirmationConfig {
  /** HTTP methods that require confirmation (default: POST, PUT, PATCH, DELETE) */
  methods?: string[];
  /** Custom confirmation message template */
  message?: string;
}

export interface CloudConfig {
  apiKey: string;
  analytics?: boolean;
  auditLog?: boolean;
}

// ---- Auth ----

export interface AIMeSession {
  user: {
    id: string;
    role?: string;
    [key: string]: unknown;
  };
}

// ---- Discovery ----

export interface DiscoveredRoute {
  /** API path (e.g., "/api/invoices") */
  path: string;
  /** HTTP methods exported by this route (GET, POST, etc.) */
  methods: string[];
  /** Path parameters extracted from the path (e.g., ["id"] from "/api/invoices/[id]") */
  pathParams: string[];
  /** File path on disk (relative to app root) */
  filePath: string;
}

// ---- Tools ----

export interface AIMeToolDefinition {
  /** Unique tool name (e.g., "list_invoices") */
  name: string;
  /** Human-readable description for the LLM */
  description: string;
  /** Zod schema for parameters */
  parameters: unknown; // ZodType — kept as unknown to avoid hard zod dependency
  /** Whether this tool requires user confirmation before execution */
  requiresConfirmation: boolean;
  /** HTTP method (for auto-discovered routes) */
  httpMethod?: string;
  /** API path (for auto-discovered routes) */
  path?: string;
  /** Custom execute function (for manually defined tools) */
  execute?: (params: Record<string, unknown>) => Promise<unknown>;
}

// ---- Messages ----

export interface AIMeMessage {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// ---- Actions ----

export interface PendingAction {
  /** Unique action ID */
  id: string;
  /** Tool that will be executed */
  toolName: string;
  /** Parameters for the tool */
  parameters: Record<string, unknown>;
  /** Human-readable description of what will happen */
  description: string;
}

export interface ToolExecution {
  id: string;
  toolName: string;
  parameters: Record<string, unknown>;
  statusCode: number;
  response: unknown;
  confirmed: boolean;
  executedAt: Date;
}

// ---- Theme ----

export interface AIMeTheme {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  fontFamily?: string;
}

// ---- Events (for Cloud analytics) ----

export interface AIMeEvent {
  type: "message" | "tool_call" | "tool_result" | "confirmation" | "error";
  appId: string;
  userId?: string;
  data: Record<string, unknown>;
  timestamp: Date;
}
