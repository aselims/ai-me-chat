import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "AI-Me Docs",
  description: "Documentation for the AI-Me SDK — embed AI into any Next.js app",
};

const navLinks = [
  { href: "/", label: "Getting Started" },
  { href: "/components", label: "Components" },
  { href: "/hooks", label: "Hooks" },
  { href: "/configuration", label: "Configuration" },
  { href: "/api-reference", label: "API Reference" },
  { href: "/cloud", label: "Cloud Dashboard" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html { scroll-behavior: smooth; }
          body {
            background: #0a0a0f;
            color: #e8e8f0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 15px;
            line-height: 1.7;
            min-height: 100vh;
          }
          a { color: #a78bfa; text-decoration: none; transition: color 0.15s; }
          a:hover { color: #c4b5fd; }
          code, pre { font-family: 'JetBrains Mono', 'Fira Code', monospace; }
          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: #111118; }
          ::-webkit-scrollbar-thumb { background: #2a2a3d; border-radius: 3px; }
          ::-webkit-scrollbar-thumb:hover { background: #3a3a55; }
        `}</style>
      </head>
      <body>
        <div style={{ display: "flex", minHeight: "100vh" }}>
          {/* Sidebar */}
          <aside
            style={{
              width: 240,
              flexShrink: 0,
              background: "#0d0d15",
              borderRight: "1px solid #1a1a2e",
              position: "fixed",
              top: 0,
              left: 0,
              height: "100vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Logo / Branding */}
            <div
              style={{
                padding: "24px 20px 20px",
                borderBottom: "1px solid #1a1a2e",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "linear-gradient(135deg, #7c6aff, #a78bfa)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  ✦
                </div>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#e8e8f0",
                    letterSpacing: "-0.02em",
                  }}
                >
                  AI-Me Docs
                </span>
              </div>
              <p style={{ fontSize: 12, color: "#6b6b8a", marginTop: 6 }}>
                v0.1.0
              </p>
            </div>

            {/* Navigation */}
            <nav style={{ padding: "16px 12px", flex: 1 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#4a4a6a",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  padding: "0 8px",
                  marginBottom: 8,
                }}
              >
                Documentation
              </p>
              <ul style={{ listStyle: "none" }}>
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      style={{
                        display: "block",
                        padding: "7px 10px",
                        borderRadius: 6,
                        fontSize: 14,
                        color: "#a0a0c0",
                        transition: "background 0.15s, color 0.15s",
                        marginBottom: 2,
                      }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>

              <div style={{ marginTop: 24 }}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#4a4a6a",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    padding: "0 8px",
                    marginBottom: 8,
                  }}
                >
                  Resources
                </p>
                <ul style={{ listStyle: "none" }}>
                  <li>
                    <a
                      href="https://github.com/ai-me/ai-me"
                      style={{
                        display: "block",
                        padding: "7px 10px",
                        borderRadius: 6,
                        fontSize: 14,
                        color: "#a0a0c0",
                      }}
                    >
                      GitHub
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://npmjs.com/package/@ai-me-chat/core"
                      style={{
                        display: "block",
                        padding: "7px 10px",
                        borderRadius: 6,
                        fontSize: 14,
                        color: "#a0a0c0",
                      }}
                    >
                      npm
                    </a>
                  </li>
                </ul>
              </div>
            </nav>

            {/* Footer */}
            <div
              style={{
                padding: "16px 20px",
                borderTop: "1px solid #1a1a2e",
                fontSize: 12,
                color: "#4a4a6a",
              }}
            >
              MIT License
            </div>
          </aside>

          {/* Main content area */}
          <div
            style={{
              marginLeft: 240,
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: "100vh",
            }}
          >
            {/* Top header bar */}
            <header
              style={{
                height: 56,
                borderBottom: "1px solid #1a1a2e",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 40px",
                background: "#0a0a0f",
                position: "sticky",
                top: 0,
                zIndex: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 13, color: "#4a4a6a" }}>
                  AI-Me SDK Documentation
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <a
                  href="https://github.com/ai-me/ai-me"
                  style={{
                    fontSize: 13,
                    color: "#6b6b8a",
                    padding: "4px 12px",
                    borderRadius: 6,
                    border: "1px solid #1a1a2e",
                  }}
                >
                  GitHub
                </a>
              </div>
            </header>

            {/* Page content */}
            <main style={{ flex: 1, padding: "48px 40px 80px", maxWidth: 860 }}>
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
