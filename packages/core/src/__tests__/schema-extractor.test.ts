import { describe, it, expect } from "vitest";
import { extractSchemasFromFile } from "../tools/schema-extractor.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const sampleRoute = `
import { z } from "zod";
export const bodySchema = z.object({ name: z.string(), email: z.string() });
export const querySchema = z.object({ page: z.string().optional(), limit: z.string().optional() });
`;

const enumRoute = `
import { z } from "zod";
export const bodySchema = z.object({
  status: z.enum(["active", "inactive", "pending"]),
  count: z.number(),
  enabled: z.boolean(),
});
`;

const arrayRoute = `
import { z } from "zod";
export const bodySchema = z.object({
  tags: z.array(z.string()),
  ids: z.array(z.number()),
});
`;

const optionalRoute = `
import { z } from "zod";
export const querySchema = z.object({
  search: z.string().optional(),
  page: z.string().optional(),
  required: z.string(),
});
`;

const literalRoute = `
import { z } from "zod";
export const bodySchema = z.object({
  type: z.literal("create"),
  count: z.literal(42),
});
`;

const emptyRoute = `
import { z } from "zod";
// No exported schemas here
const internalSchema = z.object({ foo: z.string() });
`;

const noZodRoute = `
export async function GET(req: Request) {
  return new Response("ok");
}
`;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("extractSchemasFromFile", () => {
  describe("basic extraction", () => {
    it("extracts multiple exported schemas from one file", () => {
      const schemas = extractSchemasFromFile("route.ts", sampleRoute);
      expect(schemas).toHaveLength(2);

      const names = schemas.map((s) => s.exportName);
      expect(names).toContain("bodySchema");
      expect(names).toContain("querySchema");
    });

    it("returns empty array when no exported z.object schemas are present", () => {
      expect(extractSchemasFromFile("route.ts", emptyRoute)).toHaveLength(0);
      expect(extractSchemasFromFile("route.ts", noZodRoute)).toHaveLength(0);
    });
  });

  describe("JSON Schema output shape", () => {
    it("produces type:object with properties and required keys", () => {
      const schemas = extractSchemasFromFile("route.ts", sampleRoute);
      const body = schemas.find((s) => s.exportName === "bodySchema");

      expect(body).toBeDefined();
      expect(body!.jsonSchema["type"]).toBe("object");
      expect(body!.jsonSchema["properties"]).toBeDefined();
      expect(body!.jsonSchema["required"]).toEqual(
        expect.arrayContaining(["name", "email"]),
      );
    });

    it("maps z.string() → { type: 'string' }", () => {
      const [schema] = extractSchemasFromFile("route.ts", sampleRoute);
      const props = schema!.jsonSchema["properties"] as Record<string, unknown>;
      expect(props["name"]).toEqual({ type: "string" });
    });

    it("maps z.number() → { type: 'number' }", () => {
      const [schema] = extractSchemasFromFile("route.ts", enumRoute);
      const props = schema!.jsonSchema["properties"] as Record<string, unknown>;
      expect(props["count"]).toEqual({ type: "number" });
    });

    it("maps z.boolean() → { type: 'boolean' }", () => {
      const [schema] = extractSchemasFromFile("route.ts", enumRoute);
      const props = schema!.jsonSchema["properties"] as Record<string, unknown>;
      expect(props["enabled"]).toEqual({ type: "boolean" });
    });

    it("maps z.enum([...]) → { type: 'string', enum: [...] }", () => {
      const [schema] = extractSchemasFromFile("route.ts", enumRoute);
      const props = schema!.jsonSchema["properties"] as Record<string, unknown>;
      expect(props["status"]).toEqual({
        type: "string",
        enum: ["active", "inactive", "pending"],
      });
    });

    it("maps z.array(z.string()) → { type: 'array', items: { type: 'string' } }", () => {
      const [schema] = extractSchemasFromFile("route.ts", arrayRoute);
      const props = schema!.jsonSchema["properties"] as Record<string, unknown>;
      expect(props["tags"]).toEqual({ type: "array", items: { type: "string" } });
    });

    it("maps z.array(z.number()) → { type: 'array', items: { type: 'number' } }", () => {
      const [schema] = extractSchemasFromFile("route.ts", arrayRoute);
      const props = schema!.jsonSchema["properties"] as Record<string, unknown>;
      expect(props["ids"]).toEqual({ type: "array", items: { type: "number" } });
    });
  });

  describe("optional modifier", () => {
    it("marks .optional() fields as not required", () => {
      const [schema] = extractSchemasFromFile("route.ts", optionalRoute);
      const required = schema!.jsonSchema["required"] as string[];
      expect(required).toContain("required");
      expect(required).not.toContain("search");
      expect(required).not.toContain("page");
    });

    it("wraps .optional() fields in anyOf with null", () => {
      const [schema] = extractSchemasFromFile("route.ts", optionalRoute);
      const props = schema!.jsonSchema["properties"] as Record<string, { anyOf?: unknown[] }>;
      expect(props["search"]?.anyOf).toBeDefined();
      expect(props["search"]?.anyOf).toEqual(
        expect.arrayContaining([{ type: "string" }, { type: "null" }]),
      );
    });
  });

  describe("literal types", () => {
    it("maps z.literal('str') → { const: 'str' }", () => {
      const [schema] = extractSchemasFromFile("route.ts", literalRoute);
      const props = schema!.jsonSchema["properties"] as Record<string, unknown>;
      expect(props["type"]).toEqual({ const: "create" });
    });

    it("maps z.literal(42) → { const: 42 }", () => {
      const [schema] = extractSchemasFromFile("route.ts", literalRoute);
      const props = schema!.jsonSchema["properties"] as Record<string, unknown>;
      expect(props["count"]).toEqual({ const: 42 });
    });
  });

  describe("method inference", () => {
    it("infers POST for bodySchema", () => {
      const schemas = extractSchemasFromFile("route.ts", sampleRoute);
      const body = schemas.find((s) => s.exportName === "bodySchema");
      expect(body!.method).toBe("POST");
    });

    it("infers GET for querySchema", () => {
      const schemas = extractSchemasFromFile("route.ts", sampleRoute);
      const query = schemas.find((s) => s.exportName === "querySchema");
      expect(query!.method).toBe("GET");
    });

    it("returns undefined method for paramsSchema", () => {
      const content = `
        import { z } from "zod";
        export const paramsSchema = z.object({ id: z.string() });
      `;
      const [schema] = extractSchemasFromFile("route.ts", content);
      expect(schema!.method).toBeUndefined();
    });
  });

  describe("_filePath parameter", () => {
    it("accepts any filePath string (value is not used for extraction)", () => {
      const schemas1 = extractSchemasFromFile("/absolute/path/route.ts", sampleRoute);
      const schemas2 = extractSchemasFromFile("relative/route.ts", sampleRoute);
      expect(schemas1).toHaveLength(2);
      expect(schemas2).toHaveLength(2);
    });
  });

  describe("edge cases", () => {
    it("handles a z.object with no properties gracefully", () => {
      const content = `
        import { z } from "zod";
        export const bodySchema = z.object({});
      `;
      const [schema] = extractSchemasFromFile("route.ts", content);
      expect(schema).toBeDefined();
      expect(schema!.jsonSchema["properties"]).toEqual({});
      expect(schema!.jsonSchema["required"]).toBeUndefined();
    });

    it("handles fields with chained .describe() (ignores the modifier)", () => {
      const content = `
        import { z } from "zod";
        export const bodySchema = z.object({
          name: z.string().describe("The user name"),
        });
      `;
      const [schema] = extractSchemasFromFile("route.ts", content);
      const props = schema!.jsonSchema["properties"] as Record<string, unknown>;
      expect(props["name"]).toEqual({ type: "string" });
    });

    it("handles multiline z.object declarations", () => {
      const content = `
        import { z } from "zod";
        export const bodySchema = z.object({
          firstName: z.string(),
          lastName: z.string(),
          age: z.number(),
        });
      `;
      const [schema] = extractSchemasFromFile("route.ts", content);
      const required = schema!.jsonSchema["required"] as string[];
      expect(required).toEqual(
        expect.arrayContaining(["firstName", "lastName", "age"]),
      );
    });
  });
});
