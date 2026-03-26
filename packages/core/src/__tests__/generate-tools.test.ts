import { describe, it, expect } from "vitest";
import type { DiscoveredRoute } from "../types.js";
import { generateToolDefinitions } from "../tools/generate-tools.js";

const makeRoute = (
  routePath: string,
  methods: string[],
  pathParams: string[] = [],
): DiscoveredRoute => ({
  path: routePath,
  methods,
  pathParams,
  filePath: `app${routePath}/route.ts`,
});

describe("generateToolDefinitions", () => {
  it("creates one tool per method per route", () => {
    const routes = [makeRoute("/api/invoices", ["GET", "POST"])];
    const tools = generateToolDefinitions(routes);

    expect(tools).toHaveLength(2);
    expect(tools[0].name).toBe("get_invoices");
    expect(tools[1].name).toBe("post_invoices");
  });

  it("generates correct tool names from paths", () => {
    const routes = [
      makeRoute("/api/projects/:id/tasks", ["GET"], ["id"]),
    ];
    const tools = generateToolDefinitions(routes);

    expect(tools[0].name).toBe("get_projects_id_tasks");
    expect(tools[0].description).toBe("GET /api/projects/:id/tasks");
  });

  it("marks write methods as requiring confirmation by default", () => {
    const routes = [
      makeRoute("/api/items", ["GET", "POST", "PUT", "PATCH", "DELETE"]),
    ];
    const tools = generateToolDefinitions(routes);

    expect(tools.find((t) => t.name === "get_items")!.requiresConfirmation).toBe(false);
    expect(tools.find((t) => t.name === "post_items")!.requiresConfirmation).toBe(true);
    expect(tools.find((t) => t.name === "put_items")!.requiresConfirmation).toBe(true);
    expect(tools.find((t) => t.name === "patch_items")!.requiresConfirmation).toBe(true);
    expect(tools.find((t) => t.name === "delete_items")!.requiresConfirmation).toBe(true);
  });

  it("respects custom confirmation methods", () => {
    const routes = [makeRoute("/api/items", ["GET", "POST", "DELETE"])];
    const tools = generateToolDefinitions(routes, {
      methods: ["DELETE"],
    });

    expect(tools.find((t) => t.name === "get_items")!.requiresConfirmation).toBe(false);
    expect(tools.find((t) => t.name === "post_items")!.requiresConfirmation).toBe(false);
    expect(tools.find((t) => t.name === "delete_items")!.requiresConfirmation).toBe(true);
  });

  it("includes path params as required string fields in parameters", () => {
    const routes = [makeRoute("/api/users/:userId", ["GET"], ["userId"])];
    const tools = generateToolDefinitions(routes);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schema = tools[0].parameters as any;
    const parsed = schema.parse({ userId: "123" });
    expect(parsed.userId).toBe("123");
  });

  it("preserves httpMethod and path on tool definitions", () => {
    const routes = [makeRoute("/api/data", ["POST"])];
    const tools = generateToolDefinitions(routes);

    expect(tools[0].httpMethod).toBe("POST");
    expect(tools[0].path).toBe("/api/data");
  });

  it("handles routes with no path params", () => {
    const routes = [makeRoute("/api/health", ["GET"])];
    const tools = generateToolDefinitions(routes);

    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe("get_health");
  });
});
