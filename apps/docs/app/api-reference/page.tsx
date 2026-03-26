// API Reference page

import type React from "react";

const s = {
  h1: {
    fontSize: 36,
    fontWeight: 700,
    color: "#e8e8f0",
    letterSpacing: "-0.03em",
    marginBottom: 12,
    lineHeight: 1.2,
  } as React.CSSProperties,
  lead: {
    fontSize: 17,
    color: "#9090b0",
    marginBottom: 48,
    lineHeight: 1.7,
  } as React.CSSProperties,
  h2: {
    fontSize: 22,
    fontWeight: 600,
    color: "#e8e8f0",
    letterSpacing: "-0.02em",
    marginBottom: 16,
    marginTop: 52,
    paddingBottom: 10,
    borderBottom: "1px solid #1a1a2e",
  } as React.CSSProperties,
  h3: {
    fontSize: 15,
    fontWeight: 600,
    color: "#c8c8e0",
    marginBottom: 10,
    marginTop: 36,
  } as React.CSSProperties,
  p: {
    color: "#9090b0",
    marginBottom: 16,
    lineHeight: 1.75,
    fontSize: 15,
  } as React.CSSProperties,
  pre: {
    background: "#0d0d18",
    border: "1px solid #1e1e32",
    borderRadius: 10,
    padding: "20px 24px",
    overflowX: "auto",
    marginBottom: 28,
    fontSize: 13.5,
    lineHeight: 1.65,
  } as React.CSSProperties,
  code: {
    color: "#c4b5fd",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  } as React.CSSProperties,
  inlineCode: {
    background: "#16162a",
    color: "#a78bfa",
    padding: "2px 6px",
    borderRadius: 4,
    fontSize: "0.88em",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  } as React.CSSProperties,
  fnCard: {
    background: "#0d0d18",
    border: "1px solid #1e1e32",
    borderRadius: 10,
    marginBottom: 32,
    overflow: "hidden",
  } as React.CSSProperties,
  fnHeader: {
    padding: "14px 20px",
    borderBottom: "1px solid #1e1e32",
    display: "flex",
    alignItems: "center",
    gap: 12,
  } as React.CSSProperties,
  fnBody: {
    padding: "16px 20px",
  } as React.CSSProperties,
  tag: {
    display: "inline-block",
    borderRadius: 4,
    padding: "2px 8px",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.02em",
  } as React.CSSProperties,
};

function FnTag({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        ...s.tag,
        background: color + "18",
        color: color,
        border: `1px solid ${color}30`,
      }}
    >
      {label}
    </span>
  );
}

interface FnProps {
  name: string;
  pkg: string;
  signature: string;
  description: string;
  params?: Array<{ name: string; type: string; desc: string }>;
  returns?: string;
  example?: string;
  tag?: string;
  tagColor?: string;
}

function FnEntry({
  name,
  pkg,
  signature,
  description,
  params,
  returns,
  example,
  tag,
  tagColor,
}: FnProps) {
  return (
    <div style={s.fnCard}>
      <div style={s.fnHeader}>
        <code
          style={{
            ...s.code,
            fontSize: 15,
            fontWeight: 600,
            color: "#e8e8f0",
            flex: 1,
          }}
        >
          {name}
        </code>
        {tag && tagColor && <FnTag label={tag} color={tagColor} />}
        <span
          style={{
            fontSize: 12,
            color: "#4a4a6a",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {pkg}
        </span>
      </div>
      <div style={s.fnBody}>
        <p style={{ ...s.p, marginBottom: 14 }}>{description}</p>

        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#4a4a6a",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: 8,
            }}
          >
            Signature
          </div>
          <pre
            style={{
              ...s.pre,
              margin: 0,
              padding: "14px 18px",
              fontSize: 13,
            }}
          >
            <code style={s.code}>{signature}</code>
          </pre>
        </div>

        {params && params.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#4a4a6a",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: 8,
              }}
            >
              Parameters
            </div>
            {params.map((p) => (
              <div
                key={p.name}
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px 1fr",
                  gap: 12,
                  padding: "8px 0",
                  borderTop: "1px solid #14142a",
                  fontSize: 13,
                }}
              >
                <div>
                  <code style={{ ...s.code, color: "#e8e8f0", fontSize: 13 }}>
                    {p.name}
                  </code>
                  <br />
                  <code style={{ ...s.code, color: "#4a4a6a", fontSize: 12 }}>
                    {p.type}
                  </code>
                </div>
                <span style={{ color: "#7a7a9a", lineHeight: 1.6 }}>{p.desc}</span>
              </div>
            ))}
          </div>
        )}

        {returns && (
          <div style={{ marginBottom: example ? 16 : 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#4a4a6a",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: 6,
              }}
            >
              Returns
            </div>
            <code style={{ ...s.code, fontSize: 13, color: "#7c6aff" }}>{returns}</code>
          </div>
        )}

        {example && (
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#4a4a6a",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: 8,
                marginTop: 16,
              }}
            >
              Example
            </div>
            <pre
              style={{
                ...s.pre,
                margin: 0,
                padding: "14px 18px",
                fontSize: 13,
              }}
            >
              <code style={s.code}>{example}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ApiReferencePage() {
  return (
    <div>
      <h1 style={s.h1}>API Reference</h1>
      <p style={s.lead}>
        Complete reference for every function exported by the AI-Me packages. All functions are
        fully typed — TypeScript users get inline documentation via JSDoc in their editor.
      </p>

      {/* ── Core ── */}
      <h2 style={s.h2}>@ai-me-chat/core</h2>
      <p style={s.p}>
        The foundational package. Framework-agnostic tool discovery, schema extraction, and OpenAPI
        parsing. Import these in server-side code only.
      </p>

      <FnEntry
        name="generateToolDefinitions"
        pkg="@ai-me-chat/core"
        tag="async"
        tagColor="#7c6aff"
        signature={`async function generateToolDefinitions(
  config: DiscoveryConfig
): Promise<ToolDefinition[]>`}
        description="Runs the configured discovery strategy and returns an array of tool definitions ready to pass to the Vercel AI SDK. This is what createAIMeHandler calls internally."
        params={[
          { name: "config", type: "DiscoveryConfig", desc: "Discovery configuration (mode, include/exclude patterns, optional spec path)." },
        ]}
        returns="Promise<ToolDefinition[]>"
        example={`import { generateToolDefinitions } from "@ai-me-chat/core";

const tools = await generateToolDefinitions({
  mode: "filesystem",
  include: ["/api/**"],
  exclude: ["/api/internal/**"],
});

console.log(tools.map((t) => t.name));
// ["GET /api/users", "POST /api/orders", ...]`}
      />

      <FnEntry
        name="executeTool"
        pkg="@ai-me-chat/core"
        tag="async"
        tagColor="#7c6aff"
        signature={`async function executeTool(
  tool: ToolDefinition,
  args: Record<string, unknown>,
  context: ExecutionContext
): Promise<ToolResult>`}
        description="Executes a single tool call by dispatching an HTTP request to the corresponding route. Handles authentication headers, request serialization, and response parsing."
        params={[
          { name: "tool", type: "ToolDefinition", desc: "The tool to execute (from generateToolDefinitions output)." },
          { name: "args", type: "Record<string, unknown>", desc: "Arguments passed by the model, validated against the tool's Zod schema." },
          { name: "context", type: "ExecutionContext", desc: "Request context including session, headers, and base URL." },
        ]}
        returns="Promise<ToolResult>"
      />

      <FnEntry
        name="extractSchemasFromFile"
        pkg="@ai-me-chat/core"
        tag="sync"
        tagColor="#10b981"
        signature={`function extractSchemasFromFile(
  filePath: string
): ExtractedSchema[]`}
        description="Statically analyses a TypeScript/JavaScript route file and extracts exported Zod schema declarations. Used by the filesystem discovery mode. Runs at build time."
        params={[
          { name: "filePath", type: "string", desc: "Absolute path to the route file to analyse." },
        ]}
        returns="ExtractedSchema[]"
        example={`import { extractSchemasFromFile } from "@ai-me-chat/core";

const schemas = extractSchemasFromFile(
  "/app/api/users/route.ts"
);
// [{ method: "POST", schema: ZodObject, description: "..." }]`}
      />

      <FnEntry
        name="parseOpenAPISpec"
        pkg="@ai-me-chat/core"
        tag="async"
        tagColor="#7c6aff"
        signature={`async function parseOpenAPISpec(
  specPathOrUrl: string
): Promise<OpenAPIDocument>`}
        description="Fetches and parses an OpenAPI 3.x specification from a file path or URL. Resolves $ref references and validates the document structure."
        params={[
          { name: "specPathOrUrl", type: "string", desc: "File system path or HTTP URL of the OpenAPI JSON or YAML specification." },
        ]}
        returns="Promise<OpenAPIDocument>"
      />

      <FnEntry
        name="generateToolsFromOpenAPI"
        pkg="@ai-me-chat/core"
        tag="sync"
        tagColor="#10b981"
        signature={`function generateToolsFromOpenAPI(
  doc: OpenAPIDocument,
  options?: { include?: string[]; exclude?: string[] }
): ToolDefinition[]`}
        description="Converts a parsed OpenAPI document into an array of tool definitions. Filters operations using include/exclude patterns and maps request body / query parameter schemas to Zod."
        params={[
          { name: "doc", type: "OpenAPIDocument", desc: "Parsed OpenAPI document (from parseOpenAPISpec)." },
          { name: "options.include", type: "string[]", desc: 'Optional list of "METHOD /path/**" patterns to include.' },
          { name: "options.exclude", type: "string[]", desc: "Optional list of patterns to exclude." },
        ]}
        returns="ToolDefinition[]"
        example={`import { parseOpenAPISpec, generateToolsFromOpenAPI } from "@ai-me-chat/core";

const doc = await parseOpenAPISpec("https://api.example.com/openapi.json");
const tools = generateToolsFromOpenAPI(doc, {
  include: ["GET /users/**", "POST /orders"],
});`}
      />

      {/* ── Handler ── */}
      <h2 style={s.h2}>@ai-me-chat/nextjs</h2>
      <p style={s.p}>
        Next.js-specific adapter. Exports a single factory function that wires together tool
        discovery, the Vercel AI SDK, and your Next.js App Router.
      </p>

      <FnEntry
        name="createAIMeHandler"
        pkg="@ai-me-chat/nextjs"
        tag="factory"
        tagColor="#f59e0b"
        signature={`function createAIMeHandler(
  config: AIMeConfig
): { GET: RouteHandler; POST: RouteHandler }`}
        description="Creates a Next.js App Router route handler that accepts chat messages from the client, runs tool discovery, and streams model responses back. Export the returned GET and POST handlers from your route file."
        params={[
          { name: "config", type: "AIMeConfig", desc: "Full configuration object. See the Configuration reference for all options." },
        ]}
        returns="{ GET: RouteHandler; POST: RouteHandler }"
        example={`// app/api/ai-me/route.ts
import { createAIMeHandler } from "@ai-me-chat/nextjs";
import { openai } from "@ai-sdk/openai";

const handler = createAIMeHandler({
  model: openai("gpt-4o"),
  discovery: { mode: "filesystem", include: ["/api/**"] },
  getSession: async (req) => {
    // return your auth session
    return { user: { id: "user-1" } };
  },
});

export { handler as GET, handler as POST };`}
      />

    </div>
  );
}
