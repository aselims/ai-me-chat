/**
 * OpenAPI 3.x spec parser.
 *
 * Converts OpenAPI path/operation entries into DiscoveredRoute objects and
 * AIMeToolDefinition objects with richer parameter schemas derived from the
 * JSON Schema definitions embedded in the spec.
 *
 * Supported features:
 *  - path + query parameters (in: "path" | "query")
 *  - requestBody with application/json content schema
 *  - operationId → tool name (falls back to auto-generated name)
 *  - summary / description → tool description
 *  - $ref resolution for same-file component references (#/components/schemas/...)
 *  - required flags on parameters and request body properties
 */

import { z } from "zod";
import type {
  DiscoveredRoute,
  AIMeToolDefinition,
  ConfirmationConfig,
} from "../types.js";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface OpenAPISpec {
  openapi: string;
  info: { title: string; version: string };
  paths: Record<string, Record<string, OpenAPIOperation>>;
  components?: {
    schemas?: Record<string, Record<string, unknown>>;
  };
}

export interface OpenAPIOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: OpenAPIParameter[];
  requestBody?: {
    required?: boolean;
    content: Record<string, { schema: Record<string, unknown> }>;
  };
  responses?: Record<string, unknown>;
  tags?: string[];
}

export interface OpenAPIParameter {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required?: boolean;
  schema?: Record<string, unknown>;
  description?: string;
}

// ---------------------------------------------------------------------------
// HTTP method set — these are the only keys we treat as operations in a path
// item object.  All other keys (summary, description, servers, parameters,
// $ref) are ignored.
// ---------------------------------------------------------------------------

const HTTP_METHODS = new Set([
  "get", "post", "put", "patch", "delete", "head", "options", "trace",
]);

const DEFAULT_WRITE_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

// ---------------------------------------------------------------------------
// parseOpenAPISpec
// ---------------------------------------------------------------------------

/**
 * Parse an OpenAPI 3.x spec and return a list of discovered routes.
 *
 * Each path + HTTP method combination becomes one DiscoveredRoute entry.
 * Path parameters are extracted from the OpenAPI `{param}` notation.
 */
export function parseOpenAPISpec(spec: OpenAPISpec): DiscoveredRoute[] {
  const routes: DiscoveredRoute[] = [];

  for (const [rawPath, pathItem] of Object.entries(spec.paths ?? {})) {
    // Collect all methods found on this path item.
    const methods: string[] = [];
    for (const key of Object.keys(pathItem)) {
      if (HTTP_METHODS.has(key.toLowerCase())) {
        methods.push(key.toUpperCase());
      }
    }

    if (methods.length === 0) continue;

    // Convert OpenAPI path notation (/items/{id}) → Express notation (/items/:id)
    const expressPath = openApiPathToExpress(rawPath);

    // Extract path parameter names from the OpenAPI-style path.
    const pathParams = extractPathParams(rawPath);

    routes.push({
      path: expressPath,
      methods,
      pathParams,
      // No real file path — use the spec path as a synthetic identifier.
      filePath: `openapi:${rawPath}`,
    });
  }

  return routes;
}

// ---------------------------------------------------------------------------
// generateToolsFromOpenAPI
// ---------------------------------------------------------------------------

/**
 * Generate AIMeToolDefinition objects from an OpenAPI 3.x spec.
 *
 * This produces richer tool definitions than the filesystem-discovery path
 * because the OpenAPI spec provides parameter types, descriptions, and
 * required flags that allow us to build precise Zod schemas.
 */
export function generateToolsFromOpenAPI(
  spec: OpenAPISpec,
  confirmation?: ConfirmationConfig,
): AIMeToolDefinition[] {
  const confirmMethods = confirmation?.methods ?? DEFAULT_WRITE_METHODS;
  const tools: AIMeToolDefinition[] = [];

  for (const [rawPath, pathItem] of Object.entries(spec.paths ?? {})) {
    for (const [methodKey, operation] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.has(methodKey.toLowerCase())) continue;

      const method = methodKey.toUpperCase();
      const op = operation as OpenAPIOperation;

      const toolName = buildToolName(method, rawPath, op.operationId);
      const description = buildDescription(method, rawPath, op);
      const expressPath = openApiPathToExpress(rawPath);
      const parameters = buildZodSchema(method, rawPath, op, spec);

      tools.push({
        name: toolName,
        description,
        parameters,
        requiresConfirmation: confirmMethods.includes(method),
        httpMethod: method,
        path: expressPath,
      });
    }
  }

  return tools;
}

// ---------------------------------------------------------------------------
// fetchOpenAPISpec
// ---------------------------------------------------------------------------

/**
 * Fetch an OpenAPI spec from a remote URL.
 * Returns the parsed JSON as an OpenAPISpec object.
 */
export async function fetchOpenAPISpec(url: string): Promise<OpenAPISpec> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch OpenAPI spec: ${response.status} ${response.statusText}`);
  }
  const spec = (await response.json()) as OpenAPISpec;
  return spec;
}

// ---------------------------------------------------------------------------
// Internal: naming helpers
// ---------------------------------------------------------------------------

function buildToolName(
  method: string,
  rawPath: string,
  operationId: string | undefined,
): string {
  if (operationId) {
    // Normalise to snake_case: camelCase → snake_case, hyphens/spaces → underscores.
    return operationId
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .replace(/[-\s]+/g, "_")
      .toLowerCase()
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
  }

  // Auto-generate from method + path (same logic as generate-tools.ts).
  const pathPart = rawPath
    .replace(/^\//, "")
    .replace(/\{([^}]+)\}/g, "$1")   // {id} → id
    .replace(/\//g, "_")
    .replace(/_+/g, "_")
    .replace(/_$/, "");

  return `${method.toLowerCase()}_${pathPart}`;
}

function buildDescription(
  method: string,
  rawPath: string,
  op: OpenAPIOperation,
): string {
  if (op.summary) return op.summary;
  if (op.description) return op.description;
  return `${method} ${rawPath}`;
}

// ---------------------------------------------------------------------------
// Internal: path helpers
// ---------------------------------------------------------------------------

/** Convert `/items/{id}` → `/items/:id` */
function openApiPathToExpress(path: string): string {
  return path.replace(/\{([^}]+)\}/g, ":$1");
}

/** Extract parameter names from `/items/{id}/sub/{subId}` → ["id", "subId"] */
function extractPathParams(path: string): string[] {
  const params: string[] = [];
  const re = /\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(path)) !== null) {
    if (m[1]) params.push(m[1]);
  }
  return params;
}

// ---------------------------------------------------------------------------
// Internal: Zod schema builder
// ---------------------------------------------------------------------------

/**
 * Build a Zod object schema for a tool's parameters.
 *
 * The schema combines:
 *   - path parameters (always string, required)
 *   - query parameters (typed, optional/required per spec)
 *   - requestBody fields (for POST/PUT/PATCH, typed, optional/required per spec)
 */
function buildZodSchema(
  method: string,
  rawPath: string,
  op: OpenAPIOperation,
  spec: OpenAPISpec,
): z.ZodObject<z.ZodRawShape> {
  // In Zod 4.x ZodRawShape has a readonly index signature, so we accumulate
  // into a plain mutable Record<string, z.ZodType> and cast at the z.object() call.
  const shape: Record<string, z.ZodType> = {};

  // Path params.
  for (const paramName of extractPathParams(rawPath)) {
    shape[paramName] = z
      .string()
      .describe(`Path parameter: ${paramName}`);
  }

  // Explicit parameters (path + query, skip header/cookie).
  for (const param of op.parameters ?? []) {
    if (param.in !== "path" && param.in !== "query") continue;
    if (param.in === "path") {
      // Already added above from path string; override only if spec provides
      // a richer description.
      if (param.description) {
        shape[param.name] = z.string().describe(param.description);
      }
      continue;
    }

    // query parameter
    const resolved = resolveSchema(param.schema ?? {}, spec);
    let zodField = jsonSchemaToZod(resolved);
    if (param.description) zodField = zodField.describe(param.description);
    shape[param.name] =
      param.required ? zodField : zodField.optional();
  }

  // Request body (POST / PUT / PATCH).
  if (
    ["POST", "PUT", "PATCH"].includes(method) &&
    op.requestBody
  ) {
    const jsonContent =
      op.requestBody.content["application/json"] ??
      Object.values(op.requestBody.content)[0];

    if (jsonContent?.schema) {
      const resolved = resolveSchema(jsonContent.schema, spec);
      const bodySchema = jsonSchemaObjectToZod(resolved, spec);
      shape["body"] = op.requestBody.required
        ? bodySchema
        : bodySchema.optional();
    } else {
      shape["body"] = z
        .record(z.string(), z.unknown())
        .optional()
        .describe("Request body");
    }
  }

  return z.object(shape as z.ZodRawShape);
}

// ---------------------------------------------------------------------------
// Internal: $ref resolver
// ---------------------------------------------------------------------------

/**
 * Resolve a JSON Schema object that may contain a `$ref` pointing to
 * `#/components/schemas/<name>`.  Only same-file references are supported.
 */
function resolveSchema(
  schema: Record<string, unknown>,
  spec: OpenAPISpec,
): Record<string, unknown> {
  const ref = schema["$ref"];
  if (typeof ref !== "string") return schema;

  const prefix = "#/components/schemas/";
  if (!ref.startsWith(prefix)) return schema;

  const schemaName = ref.slice(prefix.length);
  const resolved = spec.components?.schemas?.[schemaName];
  return resolved ?? schema;
}

// ---------------------------------------------------------------------------
// Internal: JSON Schema → Zod converters
// ---------------------------------------------------------------------------

/**
 * Convert a JSON Schema `type: "object"` definition to a Zod object schema.
 * Falls back to `z.record(z.string(), z.unknown())` for non-object schemas.
 */
function jsonSchemaObjectToZod(
  schema: Record<string, unknown>,
  spec: OpenAPISpec,
): z.ZodType {
  if (schema["type"] !== "object") {
    return jsonSchemaToZod(schema);
  }

  const props = schema["properties"] as Record<string, Record<string, unknown>> | undefined;
  if (!props) {
    return z.record(z.string(), z.unknown()).describe("Request body");
  }

  const required = new Set<string>(
    Array.isArray(schema["required"]) ? (schema["required"] as string[]) : [],
  );

  const shape: Record<string, z.ZodType> = {};

  for (const [propName, propSchema] of Object.entries(props)) {
    const resolved = resolveSchema(propSchema, spec);
    const zodField = jsonSchemaToZod(resolved);
    shape[propName] = required.has(propName) ? zodField : zodField.optional();
  }

  return z.object(shape as z.ZodRawShape);
}

/**
 * Convert a JSON Schema fragment to a Zod type.
 * Handles: string, number, integer, boolean, array, object, anyOf/oneOf,
 * enum, and $ref (via pass-through — caller should resolve before calling).
 */
function jsonSchemaToZod(schema: Record<string, unknown>): z.ZodType {
  const type = schema["type"] as string | undefined;

  // anyOf / oneOf → z.union (with minimum 2 members; fall back to z.unknown)
  const anyOf = schema["anyOf"] ?? schema["oneOf"];
  if (Array.isArray(anyOf) && anyOf.length >= 2) {
    const members = (anyOf as Record<string, unknown>[]).map((s) =>
      jsonSchemaToZod(s),
    );
    // z.union requires a tuple of at least 2 ZodType — we build it dynamically.
    const [first, second, ...rest] = members as [z.ZodType, z.ZodType, ...z.ZodType[]];
    return z.union([first, second, ...rest]);
  }

  if (schema["enum"] !== undefined) {
    const values = schema["enum"] as unknown[];
    if (values.every((v) => typeof v === "string")) {
      const [first, second, ...rest] = values as [string, string, ...string[]];
      if (first !== undefined && second !== undefined) {
        return z.enum([first, second, ...rest]);
      }
      if (first !== undefined) return z.literal(first);
    }
    return z.unknown();
  }

  switch (type) {
    case "string":
      return z.string();
    case "number":
    case "integer":
      return z.number();
    case "boolean":
      return z.boolean();
    case "null":
      return z.null();
    case "array": {
      const items = schema["items"] as Record<string, unknown> | undefined;
      return items ? z.array(jsonSchemaToZod(items)) : z.array(z.unknown());
    }
    case "object": {
      const props = schema["properties"] as
        | Record<string, Record<string, unknown>>
        | undefined;
      if (!props) return z.record(z.string(), z.unknown());

      const required = new Set<string>(
        Array.isArray(schema["required"])
          ? (schema["required"] as string[])
          : [],
      );
      const innerShape: Record<string, z.ZodType> = {};
      for (const [k, v] of Object.entries(props)) {
        const field = jsonSchemaToZod(v);
        innerShape[k] = required.has(k) ? field : field.optional();
      }
      return z.object(innerShape as z.ZodRawShape);
    }
    default:
      return z.unknown();
  }
}
