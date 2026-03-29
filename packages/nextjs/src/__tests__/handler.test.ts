import path from "path";
import * as fs from "fs";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createAIMeHandler, detectAppDir, resolveAppDir } from "../handler.js";

vi.mock("fs");

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

describe("detectAppDir", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("returns src/app when it exists", () => {
    vi.mocked(fs.existsSync).mockImplementation((p) =>
      String(p).endsWith(path.join("src", "app")),
    );

    const result = detectAppDir();
    expect(result).toBe(path.join(process.cwd(), "src", "app"));
  });

  it("falls back to app/ when src/app does not exist", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const result = detectAppDir();
    expect(result).toBe(path.join(process.cwd(), "app"));
  });
});

describe("resolveAppDir", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("uses explicit appDir config when provided (relative path)", () => {
    const config = { model: mockModel, discovery: { mode: "filesystem" as const, appDir: "custom/app" }, getSession: async () => ({ user: { id: "u1" } }) };

    const result = resolveAppDir(config);
    expect(result).toBe(path.resolve(process.cwd(), "custom/app"));
  });

  it("uses explicit appDir config when provided (absolute path)", () => {
    const absPath = "/absolute/path/to/app";
    const config = { model: mockModel, discovery: { mode: "filesystem" as const, appDir: absPath }, getSession: async () => ({ user: { id: "u1" } }) };

    const result = resolveAppDir(config);
    expect(result).toBe(absPath);
  });

  it("auto-detects src/app when appDir is not set and src/app exists", () => {
    vi.mocked(fs.existsSync).mockImplementation((p) =>
      String(p).endsWith(path.join("src", "app")),
    );

    const config = { model: mockModel, discovery: { mode: "filesystem" as const }, getSession: async () => ({ user: { id: "u1" } }) };

    const result = resolveAppDir(config);
    expect(result).toBe(path.join(process.cwd(), "src", "app"));
  });
});

describe("health endpoint", () => {
  it("GET /health returns 200 without auth", async () => {
    const handler = createAIMeHandler({
      model: mockModel,
      discovery: { mode: "openapi", spec: minimalSpec },
      getSession: async () => null, // no session — should still work
    });

    const req = new Request("http://localhost:3000/api/ai-me/health", {
      method: "GET",
    });
    const res = await handler(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("ok");
  });

  it("GET /health returns 200 even with valid session", async () => {
    const handler = createAIMeHandler({
      model: mockModel,
      discovery: { mode: "openapi", spec: minimalSpec },
      getSession: async () => ({ user: { id: "test-user" } }),
    });

    const req = new Request("http://localhost:3000/api/ai-me/health", {
      method: "GET",
    });
    const res = await handler(req);
    expect(res.status).toBe(200);
  });
});

describe("chat message validation", () => {
  const makeHandler = () =>
    createAIMeHandler({
      model: mockModel,
      discovery: { mode: "openapi", spec: minimalSpec },
      getSession: async () => ({ user: { id: "test-user" } }),
    });

  it("returns 400 for invalid JSON body", async () => {
    const handler = makeHandler();
    const req = new Request("http://localhost:3000/api/ai-me", {
      method: "POST",
      body: "not json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid json/i);
  });

  it("returns 400 when messages is not an array", async () => {
    const handler = makeHandler();
    const req = new Request("http://localhost:3000/api/ai-me", {
      method: "POST",
      body: JSON.stringify({ messages: "not an array" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/messages must be a non-empty array/);
  });

  it("returns 400 when messages is empty", async () => {
    const handler = makeHandler();
    const req = new Request("http://localhost:3000/api/ai-me", {
      method: "POST",
      body: JSON.stringify({ messages: [] }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when message is missing id or role", async () => {
    const handler = makeHandler();
    const req = new Request("http://localhost:3000/api/ai-me", {
      method: "POST",
      body: JSON.stringify({ messages: [{ content: "hello" }] }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/id.*role/);
    expect(body.received).toContain("content");
  });
});

describe("dynamic system prompt", () => {
  it("accepts a function for systemPrompt", () => {
    // This should not throw — verifies the type accepts functions
    const handler = createAIMeHandler({
      model: mockModel,
      discovery: { mode: "openapi", spec: minimalSpec },
      getSession: async () => ({ user: { id: "test-user", name: "Test" } }),
      systemPrompt: async (session) => `Hello ${session.user.id}`,
    });
    expect(handler).toBeDefined();
  });

  it("accepts a static string for systemPrompt", () => {
    const handler = createAIMeHandler({
      model: mockModel,
      discovery: { mode: "openapi", spec: minimalSpec },
      getSession: async () => ({ user: { id: "test-user" } }),
      systemPrompt: "Static prompt",
    });
    expect(handler).toBeDefined();
  });
});
