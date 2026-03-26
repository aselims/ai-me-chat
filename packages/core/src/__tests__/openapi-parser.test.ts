import { describe, it, expect, vi } from "vitest";
import type { z } from "zod";
import { parseOpenAPISpec, generateToolsFromOpenAPI, fetchOpenAPISpec } from "../tools/openapi-parser.js";
import type { OpenAPISpec } from "../tools/openapi-parser.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const minimalSpec: OpenAPISpec = {
  openapi: "3.0.3",
  info: { title: "Test API", version: "1.0.0" },
  paths: {
    "/items": {
      get: {
        operationId: "listItems",
        summary: "List all items",
        parameters: [
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Page number",
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "string" },
          },
        ],
      },
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
    "/items/{id}": {
      get: {
        operationId: "getItem",
        summary: "Get item by ID",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
      },
      put: {
        operationId: "updateItem",
        summary: "Update an item",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                },
              },
            },
          },
        },
      },
      delete: {
        operationId: "deleteItem",
        summary: "Delete an item",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
      },
    },
  },
};

const specWithRefs: OpenAPISpec = {
  openapi: "3.0.3",
  info: { title: "Ref API", version: "1.0.0" },
  paths: {
    "/orders": {
      post: {
        operationId: "createOrder",
        summary: "Create an order",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateOrderInput" },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      CreateOrderInput: {
        type: "object",
        properties: {
          productId: { type: "string" },
          quantity: { type: "number" },
        },
        required: ["productId", "quantity"],
      },
    },
  },
};

const specWithEnum: OpenAPISpec = {
  openapi: "3.0.3",
  info: { title: "Enum API", version: "1.0.0" },
  paths: {
    "/reports": {
      get: {
        operationId: "listReports",
        parameters: [
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["draft", "published", "archived"] },
          },
        ],
      },
    },
  },
};

const specNoOperationId: OpenAPISpec = {
  openapi: "3.0.3",
  info: { title: "No-Op-ID API", version: "1.0.0" },
  paths: {
    "/api/users/{userId}/posts": {
      get: {},
    },
  },
};

// ---------------------------------------------------------------------------
// parseOpenAPISpec tests
// ---------------------------------------------------------------------------

describe("parseOpenAPISpec", () => {
  it("returns one DiscoveredRoute per unique path (methods are collected)", () => {
    const routes = parseOpenAPISpec(minimalSpec);
    // /items and /items/{id}
    expect(routes).toHaveLength(2);
  });

  it("collects all HTTP methods for a path", () => {
    const routes = parseOpenAPISpec(minimalSpec);
    const itemsRoute = routes.find((r) => r.path === "/items");
    expect(itemsRoute).toBeDefined();
    expect(itemsRoute!.methods).toEqual(expect.arrayContaining(["GET", "POST"]));
  });

  it("converts OpenAPI path params {id} to Express :id notation", () => {
    const routes = parseOpenAPISpec(minimalSpec);
    const itemRoute = routes.find((r) => r.path.includes(":id"));
    expect(itemRoute).toBeDefined();
    expect(itemRoute!.path).toBe("/items/:id");
  });

  it("extracts path parameter names into pathParams array", () => {
    const routes = parseOpenAPISpec(minimalSpec);
    const itemRoute = routes.find((r) => r.path === "/items/:id");
    expect(itemRoute!.pathParams).toContain("id");
  });

  it("sets filePath to openapi:<rawPath>", () => {
    const routes = parseOpenAPISpec(minimalSpec);
    const itemsRoute = routes.find((r) => r.path === "/items");
    expect(itemsRoute!.filePath).toBe("openapi:/items");
  });

  it("skips paths with no HTTP method operations", () => {
    const spec: OpenAPISpec = {
      ...minimalSpec,
      paths: {
        ...minimalSpec.paths,
        "/empty-path": {} as Record<string, never>,
      },
    };
    const routes = parseOpenAPISpec(spec);
    expect(routes.find((r) => r.path === "/empty-path")).toBeUndefined();
  });

  it("handles an empty paths object", () => {
    const spec: OpenAPISpec = {
      openapi: "3.0.3",
      info: { title: "Empty", version: "1" },
      paths: {},
    };
    expect(parseOpenAPISpec(spec)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// generateToolsFromOpenAPI tests
// ---------------------------------------------------------------------------

describe("generateToolsFromOpenAPI", () => {
  describe("tool naming", () => {
    it("uses operationId as the tool name (normalised to snake_case)", () => {
      const tools = generateToolsFromOpenAPI(minimalSpec);
      const names = tools.map((t) => t.name);
      expect(names).toContain("list_items");
      expect(names).toContain("create_item");
      expect(names).toContain("get_item");
      expect(names).toContain("update_item");
      expect(names).toContain("delete_item");
    });

    it("auto-generates a name from method + path when operationId is absent", () => {
      const tools = generateToolsFromOpenAPI(specNoOperationId);
      const tool = tools[0];
      expect(tool).toBeDefined();
      // GET /api/users/{userId}/posts → get_api_users_userId_posts
      expect(tool!.name).toBe("get_api_users_userId_posts");
    });
  });

  describe("tool descriptions", () => {
    it("uses summary as description when available", () => {
      const tools = generateToolsFromOpenAPI(minimalSpec);
      const listTool = tools.find((t) => t.name === "list_items");
      expect(listTool!.description).toBe("List all items");
    });

    it("falls back to 'METHOD path' when no summary or description", () => {
      const spec: OpenAPISpec = {
        openapi: "3.0.3",
        info: { title: "T", version: "1" },
        paths: { "/foo": { get: { operationId: "getFoo" } } },
      };
      const [tool] = generateToolsFromOpenAPI(spec);
      expect(tool!.description).toBe("GET /foo");
    });
  });

  describe("confirmation behaviour", () => {
    it("marks POST/PUT/DELETE as requiresConfirmation by default", () => {
      const tools = generateToolsFromOpenAPI(minimalSpec);

      const getTool = tools.find((t) => t.name === "list_items");
      const postTool = tools.find((t) => t.name === "create_item");
      const putTool = tools.find((t) => t.name === "update_item");
      const delTool = tools.find((t) => t.name === "delete_item");

      expect(getTool!.requiresConfirmation).toBe(false);
      expect(postTool!.requiresConfirmation).toBe(true);
      expect(putTool!.requiresConfirmation).toBe(true);
      expect(delTool!.requiresConfirmation).toBe(true);
    });

    it("respects custom confirmation config", () => {
      const tools = generateToolsFromOpenAPI(minimalSpec, { methods: ["DELETE"] });
      const postTool = tools.find((t) => t.name === "create_item");
      const delTool = tools.find((t) => t.name === "delete_item");

      expect(postTool!.requiresConfirmation).toBe(false);
      expect(delTool!.requiresConfirmation).toBe(true);
    });
  });

  describe("Zod parameter schema — path params", () => {
    it("includes path param as required string field", () => {
      const tools = generateToolsFromOpenAPI(minimalSpec);
      const getTool = tools.find((t) => t.name === "get_item");
      const schema = getTool!.parameters as z.ZodObject<z.ZodRawShape>;

      // Should parse successfully with id present.
      const result = schema.safeParse({ id: "abc-123" });
      expect(result.success).toBe(true);
    });

    it("rejects missing required path param", () => {
      const tools = generateToolsFromOpenAPI(minimalSpec);
      const getTool = tools.find((t) => t.name === "get_item");
      const schema = getTool!.parameters as z.ZodObject<z.ZodRawShape>;

      const result = schema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("Zod parameter schema — query params", () => {
    it("includes typed optional query params", () => {
      const tools = generateToolsFromOpenAPI(minimalSpec);
      const listTool = tools.find((t) => t.name === "list_items");
      const schema = listTool!.parameters as z.ZodObject<z.ZodRawShape>;

      // Optional params — should succeed without them.
      const withoutQuery = schema.safeParse({});
      expect(withoutQuery.success).toBe(true);

      // And succeed with them.
      const withQuery = schema.safeParse({ page: "1", limit: "10" });
      expect(withQuery.success).toBe(true);
    });

    it("maps enum query param to z.enum", () => {
      const tools = generateToolsFromOpenAPI(specWithEnum);
      const [tool] = tools;
      const schema = tool!.parameters as z.ZodObject<z.ZodRawShape>;

      const valid = schema.safeParse({ status: "draft" });
      expect(valid.success).toBe(true);

      const invalid = schema.safeParse({ status: "unknown" });
      expect(invalid.success).toBe(false);
    });
  });

  describe("Zod parameter schema — request body", () => {
    it("includes a body field for POST operations", () => {
      const tools = generateToolsFromOpenAPI(minimalSpec);
      const createTool = tools.find((t) => t.name === "create_item");
      const schema = createTool!.parameters as z.ZodObject<z.ZodRawShape>;

      const result = schema.safeParse({ body: { name: "Widget", price: 9.99 } });
      expect(result.success).toBe(true);
    });

    it("enforces required properties inside the body", () => {
      const tools = generateToolsFromOpenAPI(minimalSpec);
      const createTool = tools.find((t) => t.name === "create_item");
      const schema = createTool!.parameters as z.ZodObject<z.ZodRawShape>;

      // name is required in spec, price is not
      const missingRequired = schema.safeParse({ body: { price: 5 } });
      expect(missingRequired.success).toBe(false);

      const optionalMissing = schema.safeParse({ body: { name: "Widget" } });
      expect(optionalMissing.success).toBe(true);
    });
  });

  describe("$ref resolution", () => {
    it("resolves #/components/schemas refs for request bodies", () => {
      const tools = generateToolsFromOpenAPI(specWithRefs);
      const [createOrder] = tools;
      expect(createOrder).toBeDefined();

      const schema = createOrder!.parameters as z.ZodObject<z.ZodRawShape>;

      // Both productId and quantity are required per the component schema.
      const valid = schema.safeParse({ body: { productId: "p1", quantity: 2 } });
      expect(valid.success).toBe(true);

      const missingQuantity = schema.safeParse({ body: { productId: "p1" } });
      expect(missingQuantity.success).toBe(false);
    });
  });

  describe("httpMethod and path on tool definition", () => {
    it("sets httpMethod and Express-style path", () => {
      const tools = generateToolsFromOpenAPI(minimalSpec);
      const getItem = tools.find((t) => t.name === "get_item");
      expect(getItem!.httpMethod).toBe("GET");
      expect(getItem!.path).toBe("/items/:id");
    });
  });
});

describe("fetchOpenAPISpec", () => {
  it("fetches and parses a JSON spec from a URL", async () => {
    const mockSpec: OpenAPISpec = {
      openapi: "3.0.3",
      info: { title: "Remote API", version: "1.0.0" },
      paths: {
        "/items": { get: { operationId: "listItems" } },
      },
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve(mockSpec),
      text: () => Promise.resolve(JSON.stringify(mockSpec)),
    });

    try {
      const spec = await fetchOpenAPISpec("https://api.example.com/openapi.json");
      expect(spec).toEqual(mockSpec);
      expect(globalThis.fetch).toHaveBeenCalledWith("https://api.example.com/openapi.json");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("throws on non-OK response", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    try {
      await expect(fetchOpenAPISpec("https://api.example.com/missing.json"))
        .rejects.toThrow("Failed to fetch OpenAPI spec: 404 Not Found");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
