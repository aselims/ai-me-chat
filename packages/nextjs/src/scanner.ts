import * as fs from "node:fs";
import * as path from "node:path";
import type { DiscoveredRoute } from "@ai-me-chat/core";

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

const ROUTE_FILE_NAMES = ["route.ts", "route.js", "route.tsx", "route.jsx"];

/**
 * Scan a Next.js App Router directory for API routes.
 * Finds all route.ts/route.js files under `appDir/api/` and extracts
 * HTTP methods and path parameters.
 */
export function scanRoutes(appDir: string): DiscoveredRoute[] {
  const apiDir = path.join(appDir, "api");
  if (!fs.existsSync(apiDir)) {
    return [];
  }
  const routes: DiscoveredRoute[] = [];
  walkDirectory(apiDir, appDir, routes);
  return routes.sort((a, b) => a.path.localeCompare(b.path));
}

function walkDirectory(
  dir: string,
  appDir: string,
  routes: DiscoveredRoute[],
): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDirectory(fullPath, appDir, routes);
    } else if (ROUTE_FILE_NAMES.includes(entry.name)) {
      const route = parseRouteFile(fullPath, appDir);
      if (route && route.methods.length > 0) {
        routes.push(route);
      }
    }
  }
}

function parseRouteFile(filePath: string, appDir: string): DiscoveredRoute | null {
  const content = fs.readFileSync(filePath, "utf-8");
  const methods = extractHttpMethods(content);

  if (methods.length === 0) {
    return null;
  }

  const relativePath = path.relative(appDir, path.dirname(filePath));
  const apiPath = "/" + relativePath.split(path.sep).join("/");
  const pathParams = extractPathParams(apiPath);

  return {
    path: cleanPath(apiPath),
    methods,
    pathParams,
    filePath: path.relative(path.resolve(appDir, ".."), filePath),
  };
}

/**
 * Extract exported HTTP method handlers from route file content.
 * Matches patterns like:
 *   export async function GET(...)
 *   export function POST(...)
 *   export const PUT = ...
 *   export { handler as DELETE }
 */
function extractHttpMethods(content: string): string[] {
  const methods: string[] = [];

  for (const method of HTTP_METHODS) {
    const patterns = [
      // export async function GET(
      new RegExp(`export\\s+(async\\s+)?function\\s+${method}\\s*\\(`),
      // export const GET =
      new RegExp(`export\\s+const\\s+${method}\\s*=`),
      // export { handler as GET }
      new RegExp(`export\\s*\\{[^}]*\\bas\\s+${method}\\b[^}]*\\}`),
    ];

    if (patterns.some((p) => p.test(content))) {
      methods.push(method);
    }
  }

  return methods;
}

/**
 * Extract path parameters from a Next.js dynamic route path.
 * e.g., "/api/projects/[id]/tasks/[taskId]" → ["id", "taskId"]
 */
function extractPathParams(routePath: string): string[] {
  const params: string[] = [];
  const matches = routePath.matchAll(/\[([^\]]+)\]/g);
  for (const match of matches) {
    params.push(match[1]);
  }
  return params;
}

/**
 * Clean up path by removing route groups like (group) and catch-all segments.
 * Converts Next.js bracket params to colon params for readability.
 * e.g., "/api/(admin)/users/[id]" → "/api/users/:id"
 */
function cleanPath(routePath: string): string {
  return routePath
    .replace(/\/\([^)]+\)/g, "") // Remove route groups
    .replace(/\[\.\.\.(\w+)\]/g, ":$1*") // Catch-all [...slug] → :slug*
    .replace(/\[(\w+)\]/g, ":$1"); // Dynamic [id] → :id
}
