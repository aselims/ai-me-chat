/**
 * Static schema extractor for Next.js route files.
 *
 * Since we cannot safely dynamic-import arbitrary user route files and call Zod
 * at runtime (the files may import framework internals, use top-level await, etc.),
 * this module uses a regex/string-based approach to parse exported Zod schema
 * declarations and emit an equivalent JSON Schema representation.
 *
 * Supported export patterns:
 *   export const bodySchema   = z.object({...})
 *   export const querySchema  = z.object({...})
 *   export const paramsSchema = z.object({...})
 *
 * Supported Zod primitives inside z.object({...}):
 *   z.string(), z.number(), z.boolean(), z.enum([...])
 *   Modifiers: .optional(), .array(), .nullable(), .default(...)
 *
 * For full fidelity use the OpenAPI parser instead.
 */

export interface ExtractedSchema {
  exportName: string;
  jsonSchema: Record<string, unknown>;
  method?: string;
}

// ---------------------------------------------------------------------------
// Top-level entry point
// ---------------------------------------------------------------------------

export function extractSchemasFromFile(
  _filePath: string,
  fileContent: string,
): ExtractedSchema[] {
  const results: ExtractedSchema[] = [];

  const exportPattern =
    /export\s+const\s+(\w+)\s*=\s*z\.object\s*\(\s*\{([^]*?)\}\s*\)/g;

  let match: RegExpExecArray | null;
  while ((match = exportPattern.exec(fileContent)) !== null) {
    const exportName = match[1];
    const objectBody = match[2];

    // exportName must be a non-empty identifier; objectBody may be "" for z.object({}).
    if (!exportName) continue;

    const jsonSchema = buildJsonSchema(objectBody);
    const method = inferMethod(exportName);

    results.push({ exportName, jsonSchema, method });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function inferMethod(exportName: string): string | undefined {
  const lower = exportName.toLowerCase();
  if (lower.includes("body") || lower.includes("request")) return "POST";
  if (lower.includes("query") || lower.includes("search")) return "GET";
  return undefined;
}

function buildJsonSchema(objectBody: string): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  const fields = splitFields(objectBody);

  for (const field of fields) {
    const fieldMatch = field.match(/^\s*(\w+)\s*:\s*(.+?)\s*$/s);
    if (!fieldMatch) continue;

    const fieldName = fieldMatch[1];
    const typeExpr = fieldMatch[2];

    if (!fieldName || !typeExpr) continue;

    const { schema, isOptional } = parseZodType(typeExpr.trim());
    properties[fieldName] = schema;
    if (!isOptional) {
      required.push(fieldName);
    }
  }

  const jsonSchema: Record<string, unknown> = {
    type: "object",
    properties,
  };

  if (required.length > 0) {
    jsonSchema["required"] = required;
  }

  return jsonSchema;
}

function splitFields(body: string): string[] {
  const fields: string[] = [];
  let depth = 0;
  let current = "";

  for (const char of body) {
    if (char === "(" || char === "[" || char === "{") {
      depth++;
      current += char;
    } else if (char === ")" || char === "]" || char === "}") {
      depth--;
      current += char;
    } else if (char === "," && depth === 0) {
      const trimmed = current.trim();
      if (trimmed) fields.push(trimmed);
      current = "";
    } else {
      current += char;
    }
  }

  const trimmed = current.trim();
  if (trimmed) fields.push(trimmed);

  return fields;
}

interface ParsedType {
  schema: Record<string, unknown>;
  isOptional: boolean;
}

function parseZodType(expr: string): ParsedType {
  const { base, modifiers } = tokeniseExpr(expr);

  let schema: Record<string, unknown> = resolveBaseType(base);
  let isOptional = false;

  for (const mod of modifiers) {
    if (mod.startsWith(".optional")) {
      isOptional = true;
      schema = { anyOf: [schema, { type: "null" }] };
    } else if (mod.startsWith(".nullable")) {
      schema = { anyOf: [schema, { type: "null" }] };
    } else if (mod.startsWith(".array")) {
      schema = { type: "array", items: schema };
    } else if (mod.startsWith(".default")) {
      isOptional = true;
    }
  }

  return { schema, isOptional };
}

interface TokenisedExpr {
  base: string;
  modifiers: string[];
}

function tokeniseExpr(expr: string): TokenisedExpr {
  const modifiers: string[] = [];
  let rest = expr.trim();

  let depth = 0;
  let baseEnd = 0;
  let foundBase = false;

  for (let i = 0; i < rest.length; i++) {
    const ch = rest[i];
    if (ch === "(") depth++;
    else if (ch === ")") {
      depth--;
      if (depth === 0) {
        baseEnd = i + 1;
        foundBase = true;
        break;
      }
    }
  }

  if (!foundBase) {
    return { base: rest, modifiers: [] };
  }

  const base = rest.slice(0, baseEnd);
  rest = rest.slice(baseEnd);

  while (rest.startsWith(".")) {
    depth = 0;
    let modEnd = 0;
    let foundMod = false;

    for (let i = 1; i < rest.length; i++) {
      const ch = rest[i];
      if (ch === "(") depth++;
      else if (ch === ")") {
        depth--;
        if (depth === 0) {
          modEnd = i + 1;
          foundMod = true;
          break;
        }
      }
    }

    if (!foundMod) break;

    modifiers.push(rest.slice(0, modEnd));
    rest = rest.slice(modEnd);
  }

  return { base, modifiers };
}

function resolveBaseType(base: string): Record<string, unknown> {
  const trimmed = base.trim();

  if (trimmed.startsWith("z.string")) return { type: "string" };
  if (trimmed.startsWith("z.number")) return { type: "number" };
  if (trimmed.startsWith("z.boolean")) return { type: "boolean" };
  if (trimmed.startsWith("z.null")) return { type: "null" };
  if (trimmed.startsWith("z.unknown") || trimmed.startsWith("z.any"))
    return {};

  if (trimmed.startsWith("z.enum")) {
    const enumValues = extractEnumValues(trimmed);
    return { type: "string", enum: enumValues };
  }

  if (trimmed.startsWith("z.array")) {
    const inner = extractSingleArg(trimmed);
    if (inner) {
      const { schema: items } = parseZodType(inner);
      return { type: "array", items };
    }
    return { type: "array" };
  }

  if (trimmed.startsWith("z.object")) {
    return { type: "object" };
  }

  if (trimmed.startsWith("z.record")) return { type: "object" };

  if (trimmed.startsWith("z.literal")) {
    const val = extractLiteralValue(trimmed);
    return val !== undefined ? { const: val } : {};
  }

  return {};
}

function extractEnumValues(expr: string): string[] {
  const inner = extractSingleArg(expr);
  if (!inner) return [];

  const values: string[] = [];
  const valuePattern = /["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = valuePattern.exec(inner)) !== null) {
    if (m[1]) values.push(m[1]);
  }
  return values;
}

function extractSingleArg(expr: string): string | null {
  const openParen = expr.indexOf("(");
  if (openParen === -1) return null;

  let depth = 0;
  for (let i = openParen; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === "(") depth++;
    else if (ch === ")") {
      depth--;
      if (depth === 0) {
        return expr.slice(openParen + 1, i);
      }
    }
  }
  return null;
}

function extractLiteralValue(expr: string): string | number | boolean | undefined {
  const inner = extractSingleArg(expr)?.trim();
  if (!inner) return undefined;

  if ((inner.startsWith('"') && inner.endsWith('"')) ||
      (inner.startsWith("'") && inner.endsWith("'"))) {
    return inner.slice(1, -1);
  }
  if (inner === "true") return true;
  if (inner === "false") return false;
  const num = Number(inner);
  if (!Number.isNaN(num)) return num;
  return undefined;
}
