import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createAIMeHandler } from "../handler.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockModel = {} as any;

const minimalSpec = {
  openapi: "3.0.3",
  info: { title: "Test API", version: "1.0.0" },
  paths: {
    "/api/items": {
      get: { operationId: "listItems", summary: "List all items" },
      post: {
        operationId: "createItem",
        summary: "Create an item",
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
    "/api/items/{id}": {
      get: {
        operationId: "getItem",
        summary: "Get item by ID",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
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

describe("createAIMeHandler — OpenAPI mode", () => {
  describe("inline spec", () => {
    it("returns discovered tools from inline spec via /tools endpoint", async () => {
      const handler = createAIMeHandler({
        model: mockModel,
        discovery: { mode: "openapi", spec: minimalSpec },
        getSession: async () => ({ user: { id: "test-user" } }),
      });

      const req = new Request("http://localhost:3000/api/ai-me/tools", {
        method: "GET",
      });
      const res = await handler(req);
      expect(res.status).toBe(200);

      const tools = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const names = tools.map((t: any) => t.name);
      expect(names).toContain("list_items");
      expect(names).toContain("create_item");
      expect(names).toContain("get_item");
      expect(names).toContain("delete_item");
    });

    it("applies exclude filter to OpenAPI tools", async () => {
      const handler = createAIMeHandler({
        model: mockModel,
        discovery: {
          mode: "openapi",
          spec: minimalSpec,
          // The parser converts {id} to :id, so exclude uses Express-style path
          exclude: ["/api/items/:id"],
        },
        getSession: async () => ({ user: { id: "test-user" } }),
      });

      const req = new Request("http://localhost:3000/api/ai-me/tools", {
        method: "GET",
      });
      const res = await handler(req);
      const tools = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const names = tools.map((t: any) => t.name);

      expect(names).toContain("list_items");
      expect(names).toContain("create_item");
      expect(names).not.toContain("get_item");
      expect(names).not.toContain("delete_item");
    });
  });

  describe("specUrl", () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
      originalFetch = globalThis.fetch;
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it("fetches spec from URL and returns tools", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve(minimalSpec),
        text: () => Promise.resolve(JSON.stringify(minimalSpec)),
      });

      const handler = createAIMeHandler({
        model: mockModel,
        discovery: {
          mode: "openapi",
          specUrl: "https://api.example.com/openapi.json",
        },
        getSession: async () => ({ user: { id: "test-user" } }),
      });

      const req = new Request("http://localhost:3000/api/ai-me/tools", {
        method: "GET",
      });
      const res = await handler(req);
      const tools = await res.json();

      expect(tools.length).toBeGreaterThan(0);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://api.example.com/openapi.json",
      );
    });
  });

  describe("validation", () => {
    it("returns 500 when openapi mode has neither spec nor specUrl", async () => {
      const handler = createAIMeHandler({
        model: mockModel,
        discovery: { mode: "openapi" },
        getSession: async () => ({ user: { id: "test-user" } }),
      });

      const req = new Request("http://localhost:3000/api/ai-me/tools", {
        method: "GET",
      });
      const res = await handler(req);
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.error).toMatch(/spec.*specUrl/i);
    });

    it("returns 401 when getSession returns null", async () => {
      const handler = createAIMeHandler({
        model: mockModel,
        discovery: { mode: "openapi", spec: minimalSpec },
        getSession: async () => null,
      });

      const req = new Request("http://localhost:3000/api/ai-me/tools", {
        method: "GET",
      });
      const res = await handler(req);
      expect(res.status).toBe(401);
    });
  });
});
