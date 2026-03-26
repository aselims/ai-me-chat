import { describe, it, expect } from "vitest";
import type { DiscoveredRoute } from "@ai-me-chat/core";
import { filterRoutes } from "../filter.js";

const makeRoute = (routePath: string, methods = ["GET"]): DiscoveredRoute => ({
  path: routePath,
  methods,
  pathParams: [],
  filePath: `app${routePath}/route.ts`,
});

const allRoutes: DiscoveredRoute[] = [
  makeRoute("/api/invoices"),
  makeRoute("/api/invoices/:id", ["GET", "PUT", "DELETE"]),
  makeRoute("/api/projects"),
  makeRoute("/api/projects/:id"),
  makeRoute("/api/auth/login", ["POST"]),
  makeRoute("/api/auth/logout", ["POST"]),
  makeRoute("/api/webhooks/stripe", ["POST"]),
];

describe("filterRoutes", () => {
  it("returns all routes when no include/exclude configured", () => {
    const result = filterRoutes(allRoutes, {});
    expect(result).toHaveLength(allRoutes.length);
  });

  it("includes only matching routes", () => {
    const result = filterRoutes(allRoutes, {
      include: ["/api/invoices/**"],
    });
    expect(result.map((r) => r.path)).toEqual([
      "/api/invoices",
      "/api/invoices/:id",
    ]);
  });

  it("excludes matching routes", () => {
    const result = filterRoutes(allRoutes, {
      exclude: ["/api/auth/**", "/api/webhooks/**"],
    });
    expect(result.map((r) => r.path)).toEqual([
      "/api/invoices",
      "/api/invoices/:id",
      "/api/projects",
      "/api/projects/:id",
    ]);
  });

  it("exclude takes precedence over include", () => {
    const result = filterRoutes(allRoutes, {
      include: ["/api/**"],
      exclude: ["/api/auth/**"],
    });
    expect(result.map((r) => r.path)).not.toContain("/api/auth/login");
    expect(result.map((r) => r.path)).not.toContain("/api/auth/logout");
    expect(result.length).toBe(5);
  });

  it("handles single-level glob", () => {
    const result = filterRoutes(allRoutes, {
      include: ["/api/projects", "/api/projects/:id"],
    });
    expect(result).toHaveLength(2);
  });
});
