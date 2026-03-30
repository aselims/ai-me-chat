# Task Tracker — AI-Me Demo App

A demo project management app showcasing [AI-Me](../../README.md) copilot plugin capabilities: natural-language chat, command palette, confirmation dialogs, and automatic API discovery.

## Quick Start

```bash
# From the monorepo root
pnpm install

# Copy env and add your Groq API key
cp examples/basic-nextjs/.env.example examples/basic-nextjs/.env.local

# Start the dev server
pnpm --filter basic-nextjs-example dev
```

Open `http://localhost:3000` and log in with `admin` / `admin123` or `alice` / `alice123`.

## Features Demonstrated

- **AIMeChat** — Floating chat widget (Cmd+.)
- **AIMeCommandPalette** — Quick actions (Cmd+K)
- **AIMeConfirm** — Confirmation dialogs for destructive operations
- **Filesystem route discovery** — Auto-discovers API routes
- **Schema extraction** — Zod `bodySchema` exports enrich tool parameters
- **Session persistence** — Chat survives page navigation
- **Theme customization** — Custom branded colors
- **onToolComplete** — UI refreshes after AI mutations

## Known Issues

### `better-sqlite3` native bindings not found

If you see an error like:

```
Error: Could not locate the bindings file.
Tried: .../better-sqlite3/build/better_sqlite3.node
```

This happens because `better-sqlite3` is a native Node addon and the prebuilt binary may not download correctly in pnpm monorepos. Fix it by rebuilding from the package directory:

```bash
cd node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3
npx prebuild-install || npm run build-release
```

Then restart the dev server.
