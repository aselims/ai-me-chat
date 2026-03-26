import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { scanRoutes } from "../scanner.js";

describe("scanRoutes", () => {
  let tmpDir: string;
  let appDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-me-scanner-"));
    appDir = path.join(tmpDir, "app");
    fs.mkdirSync(path.join(appDir, "api"), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function createRoute(routePath: string, content: string) {
    const dir = path.join(appDir, routePath);
    fs.mkdirSync(path.dirname(dir), { recursive: true });
    fs.writeFileSync(dir, content);
  }

  it("returns empty array when no api directory exists", () => {
    const emptyDir = path.join(tmpDir, "empty-app");
    fs.mkdirSync(emptyDir);
    expect(scanRoutes(emptyDir)).toEqual([]);
  });

  it("discovers a simple GET route", () => {
    createRoute("api/invoices/route.ts", `
      export async function GET(req: Request) {
        return Response.json({ invoices: [] });
      }
    `);

    const routes = scanRoutes(appDir);
    expect(routes).toHaveLength(1);
    expect(routes[0]).toMatchObject({
      path: "/api/invoices",
      methods: ["GET"],
      pathParams: [],
    });
  });

  it("discovers multiple HTTP methods in one route", () => {
    createRoute("api/projects/route.ts", `
      export async function GET(req: Request) { return Response.json([]); }
      export async function POST(req: Request) { return Response.json({}); }
    `);

    const routes = scanRoutes(appDir);
    expect(routes).toHaveLength(1);
    expect(routes[0].methods).toEqual(["GET", "POST"]);
  });

  it("extracts path parameters from dynamic routes", () => {
    createRoute("api/projects/[id]/route.ts", `
      export async function GET(req: Request) { return Response.json({}); }
      export async function PUT(req: Request) { return Response.json({}); }
      export async function DELETE(req: Request) { return Response.json({}); }
    `);

    const routes = scanRoutes(appDir);
    expect(routes).toHaveLength(1);
    expect(routes[0]).toMatchObject({
      path: "/api/projects/:id",
      methods: ["GET", "PUT", "DELETE"],
      pathParams: ["id"],
    });
  });

  it("handles nested dynamic routes", () => {
    createRoute("api/projects/[projectId]/tasks/[taskId]/route.ts", `
      export async function GET(req: Request) { return Response.json({}); }
      export async function PATCH(req: Request) { return Response.json({}); }
    `);

    const routes = scanRoutes(appDir);
    expect(routes).toHaveLength(1);
    expect(routes[0]).toMatchObject({
      path: "/api/projects/:projectId/tasks/:taskId",
      methods: ["GET", "PATCH"],
      pathParams: ["projectId", "taskId"],
    });
  });

  it("discovers multiple routes and sorts them", () => {
    createRoute("api/users/route.ts", `export async function GET() { return Response.json([]); }`);
    createRoute("api/invoices/route.ts", `export async function GET() { return Response.json([]); }`);
    createRoute("api/projects/route.ts", `export async function GET() { return Response.json([]); }`);

    const routes = scanRoutes(appDir);
    expect(routes).toHaveLength(3);
    expect(routes.map((r) => r.path)).toEqual([
      "/api/invoices",
      "/api/projects",
      "/api/users",
    ]);
  });

  it("handles export const pattern", () => {
    createRoute("api/health/route.ts", `
      export const GET = async (req: Request) => {
        return Response.json({ status: "ok" });
      };
    `);

    const routes = scanRoutes(appDir);
    expect(routes).toHaveLength(1);
    expect(routes[0].methods).toEqual(["GET"]);
  });

  it("handles re-export pattern", () => {
    createRoute("api/proxy/route.ts", `
      const handler = async (req: Request) => Response.json({});
      export { handler as GET, handler as POST };
    `);

    const routes = scanRoutes(appDir);
    expect(routes).toHaveLength(1);
    expect(routes[0].methods).toEqual(["GET", "POST"]);
  });

  it("ignores route files with no HTTP method exports", () => {
    createRoute("api/internal/route.ts", `
      // No exported HTTP handlers
      function helper() { return 42; }
      export default helper;
    `);

    const routes = scanRoutes(appDir);
    expect(routes).toHaveLength(0);
  });

  it("strips route groups from paths", () => {
    createRoute("api/(admin)/users/route.ts", `
      export async function GET() { return Response.json([]); }
    `);

    const routes = scanRoutes(appDir);
    expect(routes).toHaveLength(1);
    expect(routes[0].path).toBe("/api/users");
  });

  it("handles catch-all routes", () => {
    createRoute("api/docs/[...slug]/route.ts", `
      export async function GET() { return Response.json({}); }
    `);

    const routes = scanRoutes(appDir);
    expect(routes).toHaveLength(1);
    expect(routes[0].path).toBe("/api/docs/:slug*");
  });
});
