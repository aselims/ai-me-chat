// Getting Started page

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
    marginTop: 48,
    paddingBottom: 10,
    borderBottom: "1px solid #1a1a2e",
  } as React.CSSProperties,
  h3: {
    fontSize: 16,
    fontWeight: 600,
    color: "#c8c8e0",
    marginBottom: 10,
    marginTop: 28,
  } as React.CSSProperties,
  p: {
    color: "#9090b0",
    marginBottom: 16,
    lineHeight: 1.75,
  } as React.CSSProperties,
  pre: {
    background: "#0d0d18",
    border: "1px solid #1e1e32",
    borderRadius: 10,
    padding: "20px 24px",
    overflowX: "auto",
    marginBottom: 24,
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
  badge: {
    display: "inline-block",
    background: "#1a1a30",
    border: "1px solid #2a2a45",
    borderRadius: 6,
    padding: "3px 10px",
    fontSize: 12,
    color: "#7c6aff",
    fontWeight: 500,
    marginRight: 8,
    marginBottom: 8,
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
  } as React.CSSProperties,
  step: {
    display: "flex",
    gap: 16,
    marginBottom: 32,
    alignItems: "flex-start",
  } as React.CSSProperties,
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7c6aff, #a78bfa)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
    color: "#fff",
    flexShrink: 0,
    marginTop: 2,
  } as React.CSSProperties,
};

export default function GettingStartedPage() {
  return (
    <div>
      {/* Hero */}
      <div style={{ marginBottom: 8 }}>
        <span style={s.badge}>Open Source</span>
        <span style={s.badge}>MIT License</span>
        <span style={s.badge}>Next.js 14+</span>
      </div>
      <h1 style={s.h1}>Getting Started</h1>
      <p style={s.lead}>
        AI-Me lets you embed a fully featured AI assistant into any Next.js application in minutes.
        Drop in a chat widget, a command palette, or build your own UI with the headless hooks —
        all powered by the AI SDK and your choice of model.
      </p>

      {/* Prerequisites callout */}
      <div style={s.callout}>
        <strong style={{ color: "#c4b5fd" }}>Prerequisites:</strong> Node.js 18+, Next.js 14 or
        later (App Router), and an API key for your chosen AI provider.
      </div>

      {/* Installation */}
      <h2 style={s.h2}>Installation</h2>
      <p style={s.p}>
        Install the AI-Me packages from npm. The SDK is split into focused packages so you only
        ship what you use.
      </p>

      <div style={s.step}>
        <div style={s.stepNum}>1</div>
        <div style={{ flex: 1 }}>
          <h3 style={{ ...s.h3, marginTop: 0 }}>Install packages</h3>
          <pre style={s.pre}>
            <code style={s.code}>pnpm add @ai-me-chat/core @ai-me-chat/react @ai-me-chat/nextjs</code>
          </pre>
          <p style={{ ...s.p, fontSize: 13, marginBottom: 0 }}>
            <span style={s.inlineCode}>@ai-me-chat/core</span> — tool discovery, schema extraction, OpenAPI parsing
            <br />
            <span style={s.inlineCode}>@ai-me-chat/react</span> — React components and hooks
            <br />
            <span style={s.inlineCode}>@ai-me-chat/nextjs</span> — Next.js route handler factory
          </p>
        </div>
      </div>

      <div style={s.step}>
        <div style={s.stepNum}>2</div>
        <div style={{ flex: 1 }}>
          <h3 style={{ ...s.h3, marginTop: 0 }}>Install an AI provider</h3>
          <pre style={s.pre}>
            <code style={s.code}>pnpm add @ai-sdk/openai</code>
          </pre>
          <p style={{ ...s.p, fontSize: 13, marginBottom: 0 }}>
            AI-Me uses the Vercel AI SDK under the hood. Any compatible provider works:{" "}
            <span style={s.inlineCode}>@ai-sdk/openai</span>,{" "}
            <span style={s.inlineCode}>@ai-sdk/anthropic</span>,{" "}
            <span style={s.inlineCode}>@ai-sdk/google</span>, etc.
          </p>
        </div>
      </div>

      {/* Quick Start */}
      <h2 style={s.h2}>Quick Start</h2>
      <p style={s.p}>
        Two files are all you need: a route handler that exposes the AI endpoint, and a layout that
        mounts the chat widget.
      </p>

      <div style={s.step}>
        <div style={s.stepNum}>1</div>
        <div style={{ flex: 1 }}>
          <h3 style={{ ...s.h3, marginTop: 0 }}>Create the API route handler</h3>
          <p style={{ ...s.p, fontSize: 13 }}>
            Create <span style={s.inlineCode}>app/api/ai-me/route.ts</span> in your Next.js app:
          </p>
          <pre style={s.pre}>
            <code style={s.code}>{`// app/api/ai-me/route.ts
import { createAIMeHandler } from "@ai-me-chat/nextjs";
import { openai } from "@ai-sdk/openai";

const handler = createAIMeHandler({
  model: openai("gpt-4o"),
  discovery: {
    mode: "filesystem",
    include: ["/api/**"],
  },
  getSession: async () => ({
    user: { id: "user-1" },
  }),
});

export { handler as GET, handler as POST };`}</code>
          </pre>
          <p style={{ ...s.p, fontSize: 13, marginBottom: 0 }}>
            The handler auto-discovers your API routes and exposes them as AI tools. Set your{" "}
            <span style={s.inlineCode}>OPENAI_API_KEY</span> environment variable and you're ready.
          </p>
        </div>
      </div>

      <div style={s.step}>
        <div style={s.stepNum}>2</div>
        <div style={{ flex: 1 }}>
          <h3 style={{ ...s.h3, marginTop: 0 }}>Add the chat widget to your layout</h3>
          <p style={{ ...s.p, fontSize: 13 }}>
            Wrap your root layout with <span style={s.inlineCode}>AIMeProvider</span> and render
            the floating chat widget:
          </p>
          <pre style={s.pre}>
            <code style={s.code}>{`// app/layout.tsx
import { AIMeProvider, AIMeChat } from "@ai-me-chat/react";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AIMeProvider endpoint="/api/ai-me">
          {children}
          <AIMeChat />
        </AIMeProvider>
      </body>
    </html>
  );
}`}</code>
          </pre>
        </div>
      </div>

      <div style={s.step}>
        <div style={s.stepNum}>3</div>
        <div style={{ flex: 1 }}>
          <h3 style={{ ...s.h3, marginTop: 0 }}>Start your dev server</h3>
          <pre style={s.pre}>
            <code style={s.code}>pnpm dev</code>
          </pre>
          <p style={{ ...s.p, fontSize: 13, marginBottom: 0 }}>
            A chat bubble appears in the bottom-right corner. Click it to open the assistant — it
            already knows about your API routes and can call them on behalf of the user.
          </p>
        </div>
      </div>

      {/* Environment variables */}
      <h2 style={s.h2}>Environment Variables</h2>
      <p style={s.p}>
        Add the following to your <span style={s.inlineCode}>.env.local</span>:
      </p>
      <pre style={s.pre}>
        <code style={s.code}>{`# Required — your AI provider key
OPENAI_API_KEY=sk-...

# Optional — AI-Me Cloud (analytics + audit log)
AI_ME_API_KEY=aime_...`}</code>
      </pre>

      {/* Next steps */}
      <h2 style={s.h2}>Next Steps</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginTop: 8,
        }}
      >
        {[
          {
            title: "Components",
            desc: "Explore AIMeChat, AIMeCommandPalette, and AIMeConfirm.",
            href: "/components",
          },
          {
            title: "Hooks",
            desc: "Build custom UI with useAIMe() and useAIMeContext().",
            href: "/hooks",
          },
          {
            title: "Configuration",
            desc: "Tool discovery, confirmation flows, theming, and more.",
            href: "/configuration",
          },
          {
            title: "API Reference",
            desc: "Full reference for every exported function.",
            href: "/api-reference",
          },
        ].map((card) => (
          <a
            key={card.href}
            href={card.href}
            style={{
              display: "block",
              background: "#0d0d18",
              border: "1px solid #1e1e32",
              borderRadius: 10,
              padding: "20px 22px",
              transition: "border-color 0.15s, background 0.15s",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#e8e8f0",
                marginBottom: 6,
              }}
            >
              {card.title} →
            </div>
            <div style={{ fontSize: 13, color: "#6b6b8a", lineHeight: 1.6 }}>
              {card.desc}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
