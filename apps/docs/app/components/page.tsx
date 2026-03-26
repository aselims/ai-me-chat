// Components reference page

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
  componentCard: {
    background: "#0d0d18",
    border: "1px solid #1e1e32",
    borderRadius: 10,
    padding: "20px 24px",
    marginBottom: 40,
  } as React.CSSProperties,
  tag: {
    display: "inline-block",
    background: "#12122a",
    border: "1px solid #2a2a45",
    borderRadius: 4,
    padding: "1px 8px",
    fontSize: 11,
    color: "#7c6aff",
    fontWeight: 600,
    marginRight: 6,
    letterSpacing: "0.02em",
  } as React.CSSProperties,
};

interface PropRow {
  prop: string;
  type: string;
  defaultVal: string;
  description: string;
}

function PropTable({ rows }: { rows: PropRow[] }) {
  return (
    <table style={s.table}>
      <thead>
        <tr>
          <th style={s.th}>Prop</th>
          <th style={s.th}>Type</th>
          <th style={s.th}>Default</th>
          <th style={s.th}>Description</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.prop}>
            <td style={{ ...s.tdCode, color: "#e8e8f0" }}>{row.prop}</td>
            <td style={s.tdCode}>{row.type}</td>
            <td style={{ ...s.td, color: "#4a4a6a", fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
              {row.defaultVal}
            </td>
            <td style={s.td}>{row.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ComponentsPage() {
  return (
    <div>
      <h1 style={s.h1}>Components</h1>
      <p style={s.lead}>
        AI-Me ships four React components. <span style={s.inlineCode}>AIMeProvider</span> and{" "}
        <span style={s.inlineCode}>AIMeChat</span> cover the most common use case. The command
        palette and confirmation dialog are opt-in additions.
      </p>

      {/* ── AIMeProvider ── */}
      <h2 style={s.h2}>
        <span style={s.inlineCode}>{"<AIMeProvider>"}</span>
      </h2>
      <div style={s.componentCard}>
        <span style={s.tag}>Context</span>
        <span style={s.tag}>Required</span>
        <p style={{ ...s.p, marginTop: 12, marginBottom: 0 }}>
          Wraps your application and provides AI-Me context to all descendant components and hooks.
          Must be an ancestor of any other AI-Me component.
        </p>
      </div>

      <h3 style={s.h3}>Usage</h3>
      <pre style={s.pre}>
        <code style={s.code}>{`import { AIMeProvider } from "@ai-me-chat/react";

export default function RootLayout({ children }) {
  return (
    <AIMeProvider
      endpoint="/api/ai-me"
      headers={{ "X-Custom-Header": "value" }}
    >
      {children}
    </AIMeProvider>
  );
}`}</code>
      </pre>

      <h3 style={s.h3}>Props</h3>
      <PropTable
        rows={[
          {
            prop: "endpoint",
            type: "string",
            defaultVal: '"/api/ai-me"',
            description:
              "URL of the AI-Me route handler. Must match the path where createAIMeHandler is mounted.",
          },
          {
            prop: "headers",
            type: "Record<string, string>",
            defaultVal: "{}",
            description:
              "Additional HTTP headers sent with every request to the endpoint. Useful for auth tokens.",
          },
          {
            prop: "children",
            type: "ReactNode",
            defaultVal: "—",
            description: "Your application tree.",
          },
        ]}
      />

      {/* ── AIMeChat ── */}
      <h2 style={s.h2}>
        <span style={s.inlineCode}>{"<AIMeChat>"}</span>
      </h2>
      <div style={s.componentCard}>
        <span style={s.tag}>Widget</span>
        <span style={s.tag}>Floating</span>
        <p style={{ ...s.p, marginTop: 12, marginBottom: 0 }}>
          A floating chat bubble that expands into a full conversation panel. Handles message
          rendering, streaming, markdown, code highlighting, and tool-call confirmation dialogs
          out of the box.
        </p>
      </div>

      <h3 style={s.h3}>Usage</h3>
      <pre style={s.pre}>
        <code style={s.code}>{`import { AIMeProvider, AIMeChat } from "@ai-me-chat/react";

export default function Layout({ children }) {
  return (
    <AIMeProvider endpoint="/api/ai-me">
      {children}
      <AIMeChat
        position="bottom-right"
        welcomeMessage="Hi! How can I help you today?"
        suggestedPrompts={[
          "What can you do?",
          "Show me my latest orders",
        ]}
        defaultOpen={false}
        onToggle={(open) => console.log("chat open:", open)}
      />
    </AIMeProvider>
  );
}`}</code>
      </pre>

      <h3 style={s.h3}>Props</h3>
      <PropTable
        rows={[
          {
            prop: "position",
            type: '"bottom-right" | "bottom-left"',
            defaultVal: '"bottom-right"',
            description: "Corner of the viewport where the chat bubble is anchored.",
          },
          {
            prop: "theme",
            type: '"dark" | "light" | "auto"',
            defaultVal: '"dark"',
            description:
              'Visual theme. "auto" follows the OS preference via prefers-color-scheme.',
          },
          {
            prop: "welcomeMessage",
            type: "string",
            defaultVal: '"How can I help?"',
            description:
              "Initial message shown in the chat panel before the user sends anything.",
          },
          {
            prop: "suggestedPrompts",
            type: "string[]",
            defaultVal: "[]",
            description:
              "Clickable prompt chips shown below the welcome message to help users get started.",
          },
          {
            prop: "defaultOpen",
            type: "boolean",
            defaultVal: "false",
            description: "Whether the chat panel is open on first render.",
          },
          {
            prop: "onToggle",
            type: "(open: boolean) => void",
            defaultVal: "undefined",
            description: "Callback fired whenever the panel opens or closes.",
          },
        ]}
      />

      {/* ── AIMeCommandPalette ── */}
      <h2 style={s.h2}>
        <span style={s.inlineCode}>{"<AIMeCommandPalette>"}</span>
      </h2>
      <div style={s.componentCard}>
        <span style={s.tag}>Widget</span>
        <span style={s.tag}>Keyboard-first</span>
        <p style={{ ...s.p, marginTop: 12, marginBottom: 0 }}>
          A Cmd+K style command palette that combines traditional command shortcuts with AI-powered
          natural language. Users can type a command name or describe what they want to do in plain
          English.
        </p>
      </div>

      <h3 style={s.h3}>Usage</h3>
      <pre style={s.pre}>
        <code style={s.code}>{`import { AIMeProvider, AIMeCommandPalette } from "@ai-me-chat/react";

const commands = [
  {
    id: "new-project",
    label: "New Project",
    description: "Create a new project",
    action: () => router.push("/projects/new"),
    keywords: ["create", "add"],
  },
];

export default function Layout({ children }) {
  return (
    <AIMeProvider endpoint="/api/ai-me">
      {children}
      <AIMeCommandPalette
        commands={commands}
        shortcut="cmd+k"
        onToggle={(open) => console.log(open)}
      />
    </AIMeProvider>
  );
}`}</code>
      </pre>

      <h3 style={s.h3}>Props</h3>
      <PropTable
        rows={[
          {
            prop: "commands",
            type: "Command[]",
            defaultVal: "[]",
            description:
              "Static commands shown in the palette. Each command has id, label, description, action, and optional keywords.",
          },
          {
            prop: "theme",
            type: '"dark" | "light" | "auto"',
            defaultVal: '"dark"',
            description: "Visual theme for the palette overlay.",
          },
          {
            prop: "shortcut",
            type: "string",
            defaultVal: '"cmd+k"',
            description:
              'Keyboard shortcut that opens the palette. Accepts modifier+key format, e.g. "ctrl+/" or "cmd+k".',
          },
          {
            prop: "onToggle",
            type: "(open: boolean) => void",
            defaultVal: "undefined",
            description: "Callback fired when the palette opens or closes.",
          },
        ]}
      />

      <h3 style={s.h3}>Command shape</h3>
      <pre style={s.pre}>
        <code style={s.code}>{`interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  keywords?: string[];       // used for fuzzy search
  action: () => void | Promise<void>;
}`}</code>
      </pre>

      {/* ── AIMeConfirm ── */}
      <h2 style={s.h2}>
        <span style={s.inlineCode}>{"<AIMeConfirm>"}</span>
      </h2>
      <div style={s.componentCard}>
        <span style={s.tag}>Dialog</span>
        <span style={s.tag}>Safety</span>
        <p style={{ ...s.p, marginTop: 12, marginBottom: 0 }}>
          A confirmation dialog the AI displays before executing destructive or irreversible tool
          calls. Configured server-side via <span style={s.inlineCode}>confirmation</span> in{" "}
          <span style={s.inlineCode}>createAIMeHandler</span> — this component handles the client-side
          render.
        </p>
      </div>

      <h3 style={s.h3}>Usage</h3>
      <pre style={s.pre}>
        <code style={s.code}>{`// Usually rendered automatically by AIMeChat.
// You can also render it manually for custom flows:
import { AIMeConfirm } from "@ai-me-chat/react";

<AIMeConfirm
  action={{
    tool: "deleteProject",
    args: { projectId: "proj-123" },
    description: "Delete project 'My App' permanently?",
  }}
  onConfirm={() => console.log("confirmed")}
  onReject={() => console.log("rejected")}
/>`}</code>
      </pre>

      <h3 style={s.h3}>Props</h3>
      <PropTable
        rows={[
          {
            prop: "action",
            type: "ConfirmAction",
            defaultVal: "—",
            description:
              "Describes the tool call that requires confirmation: tool name, args, and a human-readable description.",
          },
          {
            prop: "onConfirm",
            type: "() => void | Promise<void>",
            defaultVal: "—",
            description: "Called when the user clicks the confirm button.",
          },
          {
            prop: "onReject",
            type: "() => void",
            defaultVal: "—",
            description: "Called when the user dismisses or clicks cancel.",
          },
        ]}
      />

      <h3 style={s.h3}>ConfirmAction shape</h3>
      <pre style={s.pre}>
        <code style={s.code}>{`interface ConfirmAction {
  tool: string;              // name of the tool being called
  args: Record<string, unknown>;
  description: string;       // human-readable summary shown in the dialog
}`}</code>
      </pre>
    </div>
  );
}
