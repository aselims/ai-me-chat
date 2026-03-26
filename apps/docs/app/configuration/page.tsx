// Configuration reference page

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
    marginBottom: 12,
    marginTop: 28,
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
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    marginBottom: 32,
    fontSize: 14,
  } as React.CSSProperties,
  th: {
    textAlign: "left" as const,
    padding: "10px 14px",
    background: "#0d0d18",
    color: "#6b6b8a",
    fontWeight: 600,
    fontSize: 12,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    borderBottom: "1px solid #1e1e32",
  } as React.CSSProperties,
  td: {
    padding: "11px 14px",
    borderBottom: "1px solid #14142a",
    color: "#a0a0c0",
    verticalAlign: "top" as const,
  } as React.CSSProperties,
  tdCode: {
    padding: "11px 14px",
    borderBottom: "1px solid #14142a",
    color: "#a78bfa",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: 13,
    verticalAlign: "top" as const,
  } as React.CSSProperties,
  callout: {
    background: "#0f0f20",
    border: "1px solid #2a2060",
    borderLeft: "3px solid #7c6aff",
    borderRadius: 8,
    padding: "16px 20px",
    marginBottom: 24,
    fontSize: 14,
    color: "#a0a0c0",
    lineHeight: 1.7,
  } as React.CSSProperties,
  varRow: {
    display: "grid",
    gridTemplateColumns: "220px 1fr",
    gap: 16,
    padding: "12px 0",
    borderBottom: "1px solid #14142a",
    alignItems: "start",
  } as React.CSSProperties,
};

interface ConfigRow {
  prop: string;
  type: string;
  required?: boolean;
  defaultVal: string;
  description: string;
}

function ConfigTable({ rows }: { rows: ConfigRow[] }) {
  return (
    <table style={s.table}>
      <thead>
        <tr>
          <th style={s.th}>Property</th>
          <th style={s.th}>Type</th>
          <th style={s.th}>Default</th>
          <th style={s.th}>Description</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.prop}>
            <td style={{ ...s.tdCode, color: "#e8e8f0" }}>
              {row.prop}
              {row.required && (
                <span
                  style={{
                    fontSize: 10,
                    background: "#2a1a40",
                    color: "#a78bfa",
                    borderRadius: 3,
                    padding: "1px 5px",
                    marginLeft: 6,
                    fontFamily: "inherit",
                    verticalAlign: "middle",
                  }}
                >
                  required
                </span>
              )}
            </td>
            <td style={s.tdCode}>{row.type}</td>
            <td
              style={{
                ...s.td,
                color: "#4a4a6a",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
              }}
            >
              {row.defaultVal}
            </td>
            <td style={s.td}>{row.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ConfigurationPage() {
  return (
    <div>
      <h1 style={s.h1}>Configuration</h1>
      <p style={s.lead}>
        Complete reference for all configuration objects accepted by{" "}
        <span style={s.inlineCode}>createAIMeHandler</span>. Configure tool discovery, safety
        confirmations, cloud integration, and visual theming.
      </p>

      {/* ── AIMeConfig ── */}
      <h2 style={s.h2}>AIMeConfig</h2>
      <p style={s.p}>
        The top-level config object passed to{" "}
        <span style={s.inlineCode}>createAIMeHandler(config)</span>.
      </p>
      <pre style={s.pre}>
        <code style={s.code}>{`import { createAIMeHandler } from "@ai-me-chat/nextjs";
import { anthropic } from "@ai-sdk/anthropic";

const handler = createAIMeHandler({
  model: anthropic("claude-3-5-sonnet-20241022"),
  systemPrompt: "You are a helpful assistant for Acme Corp.",
  discovery: { mode: "filesystem", include: ["/api/**"] },
  confirmation: {
    methods: ["DELETE", "POST"],
    message: "Are you sure you want to perform this action?",
  },
  getSession: async (req) => {
    const session = await auth(); // your auth provider
    return session;
  },
  maxSteps: 5,
  cloud: {
    apiKey: process.env.AI_ME_API_KEY!,
    analytics: true,
    auditLog: true,
  },
});`}</code>
      </pre>

      <ConfigTable
        rows={[
          {
            prop: "model",
            type: "LanguageModel",
            required: true,
            defaultVal: "—",
            description:
              "Any Vercel AI SDK-compatible language model instance, e.g. openai('gpt-4o') or anthropic('claude-3-5-sonnet-20241022').",
          },
          {
            prop: "systemPrompt",
            type: "string",
            defaultVal: '""',
            description:
              "System-level instructions prepended to every conversation. Tell the model its persona and constraints.",
          },
          {
            prop: "discovery",
            type: "DiscoveryConfig",
            required: true,
            defaultVal: "—",
            description: "How AI-Me discovers your API routes and turns them into tools. See DiscoveryConfig below.",
          },
          {
            prop: "confirmation",
            type: "ConfirmationConfig",
            defaultVal: "undefined",
            description:
              "Which tool calls require user confirmation before execution. See ConfirmationConfig below.",
          },
          {
            prop: "getSession",
            type: "(req: Request) => Promise<Session | null>",
            defaultVal: "undefined",
            description:
              "Async function that returns the current user session. The session is passed to tool handlers as context.",
          },
          {
            prop: "maxSteps",
            type: "number",
            defaultVal: "5",
            description:
              "Maximum number of tool-call steps the model can take in a single response before it must return to the user.",
          },
          {
            prop: "cloud",
            type: "CloudConfig",
            defaultVal: "undefined",
            description:
              "AI-Me Cloud integration for analytics and audit logging. See CloudConfig below.",
          },
        ]}
      />

      {/* ── DiscoveryConfig ── */}
      <h2 style={s.h2}>DiscoveryConfig</h2>
      <p style={s.p}>
        Controls how AI-Me scans your codebase to build the set of tools exposed to the model.
        Two modes are supported: filesystem scanning and OpenAPI spec ingestion.
      </p>

      <h3 style={s.h3}>Filesystem mode</h3>
      <p style={s.p}>
        Scans Next.js route files and extracts Zod schemas from{" "}
        <span style={s.inlineCode}>export const schema</span> declarations using static analysis.
      </p>
      <pre style={s.pre}>
        <code style={s.code}>{`discovery: {
  mode: "filesystem",
  include: ["/api/**"],        // glob patterns to scan
  exclude: ["/api/internal/**"],
}`}</code>
      </pre>

      <h3 style={s.h3}>OpenAPI mode</h3>
      <p style={s.p}>
        Parses an OpenAPI 3.x specification and generates tools from the defined operations.
        Useful when integrating third-party APIs or when you already maintain an OpenAPI spec.
      </p>
      <pre style={s.pre}>
        <code style={s.code}>{`discovery: {
  mode: "openapi",
  spec: "/openapi.json",       // path or URL to the spec
  include: ["GET /api/**"],    // optional: filter operations
  exclude: ["POST /api/admin/**"],
}`}</code>
      </pre>

      <ConfigTable
        rows={[
          {
            prop: "mode",
            type: '"filesystem" | "openapi"',
            required: true,
            defaultVal: "—",
            description: "Discovery strategy.",
          },
          {
            prop: "include",
            type: "string[]",
            defaultVal: '["/**"]',
            description:
              'Glob patterns (filesystem mode) or "METHOD /path/**" patterns (openapi mode) to include.',
          },
          {
            prop: "exclude",
            type: "string[]",
            defaultVal: "[]",
            description: "Patterns to exclude from discovery. Takes precedence over include.",
          },
          {
            prop: "spec",
            type: "string",
            defaultVal: "undefined",
            description:
              "Path or URL to the OpenAPI specification file. Only used in openapi mode.",
          },
        ]}
      />

      {/* ── ConfirmationConfig ── */}
      <h2 style={s.h2}>ConfirmationConfig</h2>
      <p style={s.p}>
        When the model calls a tool matching the confirmation criteria, AI-Me pauses execution and
        renders an <span style={s.inlineCode}>{"<AIMeConfirm>"}</span> dialog in the chat. The
        tool only executes after the user confirms.
      </p>
      <pre style={s.pre}>
        <code style={s.code}>{`confirmation: {
  methods: ["DELETE", "PUT", "POST"],
  message: "The AI wants to perform this action. Continue?",
}`}</code>
      </pre>

      <ConfigTable
        rows={[
          {
            prop: "methods",
            type: "HttpMethod[]",
            defaultVal: '["DELETE"]',
            description:
              'HTTP methods that require confirmation. Typically ["DELETE"] or ["DELETE", "POST"] for safety-critical endpoints.',
          },
          {
            prop: "message",
            type: "string",
            defaultVal: '"Confirm this action?"',
            description:
              "Message shown in the confirmation dialog above the tool call details.",
          },
        ]}
      />

      {/* ── CloudConfig ── */}
      <h2 style={s.h2}>CloudConfig</h2>
      <p style={s.p}>
        Connects your deployment to AI-Me Cloud for cross-session analytics, per-user usage
        tracking, and a tamper-evident audit log of all tool executions.
      </p>
      <pre style={s.pre}>
        <code style={s.code}>{`cloud: {
  apiKey: process.env.AI_ME_API_KEY!,
  analytics: true,
  auditLog: true,
}`}</code>
      </pre>

      <ConfigTable
        rows={[
          {
            prop: "apiKey",
            type: "string",
            required: true,
            defaultVal: "—",
            description:
              "Your AI-Me Cloud API key. Generate one from the Cloud Dashboard under Settings > API Keys.",
          },
          {
            prop: "analytics",
            type: "boolean",
            defaultVal: "true",
            description:
              "Send anonymised usage metrics (message count, model, latency, token usage) to AI-Me Cloud.",
          },
          {
            prop: "auditLog",
            type: "boolean",
            defaultVal: "false",
            description:
              "Record a full audit log of every tool call, including arguments and results, for compliance purposes.",
          },
        ]}
      />

      {/* ── Theming ── */}
      <h2 style={s.h2}>Theming</h2>
      <p style={s.p}>
        AI-Me components are styled with CSS custom properties. Override any variable on a parent
        element to customise the look. All variables fall back to sensible dark-mode defaults.
      </p>

      <div style={s.callout}>
        Variables are scoped to <span style={s.inlineCode}>[data-ai-me]</span> so they do not
        leak into your application styles.
      </div>

      <h3 style={s.h3}>Global overrides</h3>
      <pre style={s.pre}>
        <code style={s.code}>{`/* globals.css */
[data-ai-me] {
  --ai-me-primary:        #7c6aff;   /* accent / interactive */
  --ai-me-primary-hover:  #9d8eff;   /* hover state */
  --ai-me-bg:             #0d0d18;   /* panel background */
  --ai-me-bg-elevated:    #13131f;   /* elevated surfaces */
  --ai-me-border:         #1e1e32;   /* subtle borders */
  --ai-me-text:           #e8e8f0;   /* primary text */
  --ai-me-text-muted:     #6b6b8a;   /* secondary text */
  --ai-me-user-bubble:    #1a1a30;   /* user message background */
  --ai-me-ai-bubble:      #0f0f22;   /* assistant message background */
  --ai-me-radius:         12px;      /* border radius */
  --ai-me-font:           inherit;   /* font family */
  --ai-me-shadow:         0 8px 32px rgba(0, 0, 0, 0.4);
}`}</code>
      </pre>

      <h3 style={s.h3}>Light theme example</h3>
      <pre style={s.pre}>
        <code style={s.code}>{`[data-ai-me] {
  --ai-me-primary:        #6d57ee;
  --ai-me-primary-hover:  #5a47d6;
  --ai-me-bg:             #ffffff;
  --ai-me-bg-elevated:    #f8f8fc;
  --ai-me-border:         #e4e4ed;
  --ai-me-text:           #111118;
  --ai-me-text-muted:     #6b6b8a;
  --ai-me-user-bubble:    #ede9ff;
  --ai-me-ai-bubble:      #f5f4ff;
}`}</code>
      </pre>

      <h3 style={s.h3}>All CSS variables</h3>
      <div
        style={{
          background: "#0d0d18",
          border: "1px solid #1e1e32",
          borderRadius: 10,
          overflow: "hidden",
          marginBottom: 32,
        }}
      >
        {[
          { variable: "--ai-me-primary", defaultVal: "#7c6aff", description: "Accent color used on buttons, links, and focus rings." },
          { variable: "--ai-me-primary-hover", defaultVal: "#9d8eff", description: "Hover state of the primary accent." },
          { variable: "--ai-me-bg", defaultVal: "#0d0d18", description: "Background of the main chat panel." },
          { variable: "--ai-me-bg-elevated", defaultVal: "#13131f", description: "Slightly elevated surface (input area, header)." },
          { variable: "--ai-me-border", defaultVal: "#1e1e32", description: "Border color for panels and separators." },
          { variable: "--ai-me-text", defaultVal: "#e8e8f0", description: "Primary text color." },
          { variable: "--ai-me-text-muted", defaultVal: "#6b6b8a", description: "Secondary / placeholder text." },
          { variable: "--ai-me-user-bubble", defaultVal: "#1a1a30", description: "Background of user message bubbles." },
          { variable: "--ai-me-ai-bubble", defaultVal: "#0f0f22", description: "Background of assistant message bubbles." },
          { variable: "--ai-me-radius", defaultVal: "12px", description: "Global border radius for panels and bubbles." },
          { variable: "--ai-me-font", defaultVal: "inherit", description: "Font family. Defaults to your page font." },
          { variable: "--ai-me-shadow", defaultVal: "0 8px 32px …", description: "Box shadow applied to the floating panel." },
        ].map((v, i) => (
          <div
            key={v.variable}
            style={{
              display: "grid",
              gridTemplateColumns: "220px 100px 1fr",
              gap: 16,
              padding: "12px 20px",
              borderBottom: i < 11 ? "1px solid #14142a" : "none",
              alignItems: "start",
            }}
          >
            <code style={{ ...s.code, fontSize: 13, color: "#a78bfa" }}>{v.variable}</code>
            <code style={{ ...s.code, fontSize: 12, color: "#6b6b8a" }}>{v.defaultVal}</code>
            <span style={{ fontSize: 13, color: "#6b6b8a", lineHeight: 1.6 }}>{v.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
