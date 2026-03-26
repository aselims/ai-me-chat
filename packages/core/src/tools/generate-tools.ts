import { z } from "zod";
import type { DiscoveredRoute, AIMeToolDefinition, ConfirmationConfig } from "../types.js";
import type { ExtractedSchema } from "./schema-extractor.js";

const DEFAULT_WRITE_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

/**
 * Generate AI-Me tool definitions from discovered routes.
 * Each HTTP method on a route becomes a separate tool.
 */
export function generateToolDefinitions(
  routes: DiscoveredRoute[],
  confirmation?: ConfirmationConfig,
): AIMeToolDefinition[] {
  const confirmMethods = confirmation?.methods ?? DEFAULT_WRITE_METHODS;
  const tools: AIMeToolDefinition[] = [];

  for (const route of routes) {
    for (const method of route.methods) {
      const toolName = buildToolName(method, route.path);
      const description = `${method} ${route.path}`;

      tools.push({
        name: toolName,
        description,
        parameters: buildParametersSchema(method, route.pathParams),
        requiresConfirmation: confirmMethods.includes(method),
        httpMethod: method,
        path: route.path,
      });
    }
  }

  return tools;
}

/**
 * Build a snake_case tool name from HTTP method and path.
 * e.g., GET /api/invoices → get_invoices
 *        POST /api/projects/:id/tasks → post_projects_id_tasks
 */
function buildToolName(method: string, routePath: string): string {
  const pathPart = routePath
    .replace(/^\/api\//, "")   // Remove /api/ prefix
    .replace(/:/g, "")         // Remove colon from params
    .replace(/\*/g, "")        // Remove catch-all asterisk
    .replace(/\//g, "_")       // Slashes to underscores
    .replace(/_+/g, "_")       // Collapse multiple underscores
    .replace(/_$/, "");         // Remove trailing underscore

  return `${method.toLowerCase()}_${pathPart}`;
}

/**
 * Generate AI-Me tool definitions from discovered routes, enhanced with
 * extracted Zod schemas from the route source files.
 *
 * When a route file exports a matching schema (bodySchema for write methods,
 * querySchema for GET), it replaces the generic fallback schema with the
 * richer extracted version, giving the LLM better parameter descriptions.
 *
 * The `schemas` map is keyed by the route's `filePath` field.
 */
export function generateToolDefinitionsWithSchemas(
  routes: DiscoveredRoute[],
  schemas: Map<string, ExtractedSchema[]>,
  confirmation?: ConfirmationConfig,
): AIMeToolDefinition[] {
  const confirmMethods = confirmation?.methods ?? DEFAULT_WRITE_METHODS;
  const tools: AIMeToolDefinition[] = [];

  for (const route of routes) {
    const fileSchemas = schemas.get(route.filePath) ?? [];

    for (const method of route.methods) {
      const toolName = buildToolName(method, route.path);
      const description = `${method} ${route.path}`;

      // Try to find a matching extracted schema for this method.
      const matchingSchema = pickBestSchema(fileSchemas, method);

      tools.push({
        name: toolName,
        description,
        parameters: matchingSchema
          ? buildParametersSchemaFromExtracted(method, route.pathParams, matchingSchema)
          : buildParametersSchema(method, route.pathParams),
        requiresConfirmation: confirmMethods.includes(method),
        httpMethod: method,
        path: route.path,
      });
    }
  }

  return tools;
}

/**
 * Choose the extracted schema that best matches the given HTTP method.
 * Prefers an exact method match (inferred from export name), then falls back
 * to any schema whose `exportName` contains a relevant keyword.
 */
function pickBestSchema(
  fileSchemas: ExtractedSchema[],
  method: string,
): ExtractedSchema | undefined {
  // Exact method match (e.g., bodySchema → POST).
  const exact = fileSchemas.find((s) => s.method === method);
  if (exact) return exact;

  // Keyword heuristics.
  if (method === "GET") {
    return fileSchemas.find((s) =>
      s.exportName.toLowerCase().includes("query") ||
      s.exportName.toLowerCase().includes("search"),
    );
  }

  if (["POST", "PUT", "PATCH"].includes(method)) {
    return fileSchemas.find((s) =>
      s.exportName.toLowerCase().includes("body") ||
      s.exportName.toLowerCase().includes("request"),
    );
  }

  return undefined;
}

/**
 * Build a Zod schema that merges path params with an extracted JSON Schema
 * body or query definition.
 */
function buildParametersSchemaFromExtracted(
  method: string,
  pathParams: string[],
  extracted: ExtractedSchema,
): z.ZodType {
  const shape: Record<string, z.ZodType> = {};

  for (const param of pathParams) {
    shape[param] = z.string().describe(`Path parameter: ${param}`);
  }

  // Build a Zod object from the extracted JSON Schema properties.
  const props = extracted.jsonSchema["properties"] as
    | Record<string, Record<string, unknown>>
    | undefined;

  const requiredFields = new Set<string>(
    Array.isArray(extracted.jsonSchema["required"])
      ? (extracted.jsonSchema["required"] as string[])
      : [],
  );

  if (props) {
    const innerShape: Record<string, z.ZodType> = {};
    for (const [key, propSchema] of Object.entries(props)) {
      const zodField = jsonSchemaScalarToZod(propSchema);
      innerShape[key] = requiredFields.has(key) ? zodField : zodField.optional();
    }

    if (method === "GET") {
      shape["query"] = z.object(innerShape).optional().describe("Query parameters");
    } else if (["POST", "PUT", "PATCH"].includes(method)) {
      shape["body"] = z.object(innerShape).optional().describe("Request body");
    }
  } else {
    // No properties extracted — fall back to generic.
    if (method === "GET") {
      shape["query"] = z
        .object({})
        .passthrough()
        .optional()
        .describe("Query string parameters");
    } else if (["POST", "PUT", "PATCH"].includes(method)) {
      shape["body"] = z
        .object({})
        .passthrough()
        .optional()
        .describe("Request body (JSON object with any properties)");
    }
  }

  return z.object(shape);
}

/**
 * Convert a simple JSON Schema scalar fragment to a Zod type.
 * This is intentionally minimal — it handles the output of the schema extractor
 * (string, number, boolean, array, anyOf-with-null for optionals).
 */
function jsonSchemaScalarToZod(schema: Record<string, unknown>): z.ZodType {
  // anyOf: [type, null] → optional wrapper already handled by caller
  const anyOf = schema["anyOf"];
  if (Array.isArray(anyOf)) {
    const nonNull = (anyOf as Record<string, unknown>[]).filter(
      (s) => s["type"] !== "null",
    );
    if (nonNull.length === 1 && nonNull[0]) {
      return jsonSchemaScalarToZod(nonNull[0]);
    }
    return z.unknown();
  }

  if (Array.isArray(schema["enum"])) {
    const values = schema["enum"] as unknown[];
    if (values.every((v) => typeof v === "string") && values.length >= 2) {
      const [first, second, ...rest] = values as [string, string, ...string[]];
      return z.enum([first, second, ...rest]);
    }
  }

  switch (schema["type"]) {
    case "string":  return z.string();
    case "number":
    case "integer": return z.number();
    case "boolean": return z.boolean();
    case "array": {
      const items = schema["items"] as Record<string, unknown> | undefined;
      return items ? z.array(jsonSchemaScalarToZod(items)) : z.array(z.unknown());
    }
    case "object":  return z.record(z.string(), z.unknown());
    default:        return z.unknown();
  }
}

/**
 * Build a Zod schema for tool parameters.
 * Path params become required string fields.
 * GET requests get an optional query params object.
 * POST/PUT/PATCH get an optional body object.
 */
function buildParametersSchema(
  method: string,
  pathParams: string[],
): z.ZodType {
  const shape: Record<string, z.ZodType> = {};

  for (const param of pathParams) {
    shape[param] = z.string().describe(`Path parameter: ${param}`);
  }

  if (method === "GET") {
    shape["query"] = z
      .record(z.string(), z.string())
      .optional()
      .describe("Query string parameters");
  } else if (["POST", "PUT", "PATCH"].includes(method)) {
    shape["body"] = z
      .record(z.string(), z.unknown())
      .optional()
      .describe("Request body");
  }

  return z.object(shape);
}
