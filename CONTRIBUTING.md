# Contributing to AI-Me

## Setup

```bash
git clone https://github.com/aselims/ai-me-chat.git
cd ai-me-chat
pnpm install
pnpm build
```

## Development Workflow

1. Create a feature branch from `main`
2. Make changes in the relevant package(s)
3. Run quality gates before committing:
   ```bash
   pnpm typecheck && pnpm lint && pnpm test && pnpm build
   ```
4. Commit with conventional format: `feat(core):`, `fix(react):`, `chore(nextjs):`
5. Open a pull request

## Project Structure

```
packages/
  core/     — Shared types and utilities
  react/    — React components
  nextjs/   — Next.js integration
  cloud/    — Cloud dashboard (private)
apps/
  docs/     — Documentation site
  web/      — Cloud dashboard app (private)
examples/
  basic-nextjs/ — Example Next.js app
```

## Running the Example App

```bash
cd examples/basic-nextjs
cp .env.example .env.local
# Add your GROQ_API_KEY to .env.local
pnpm dev
```

## Repository Architecture

This project uses a **dual-repo model**:

| Repo | Visibility | Purpose |
|------|-----------|---------|
| `ai-me-chat` (this repo) | Private | Full monorepo — all packages, cloud, internal docs |
| `ai-me-chat-public` | Public | Open-source distribution — published packages only |

All development happens in **this private repo**. The public repo is a curated mirror that contains only what npm consumers and open-source contributors need.

### What's public vs private

**Public** (synced to `ai-me-chat-public`):
- `packages/core`, `packages/react`, `packages/nextjs` — the 3 published npm packages
- `examples/basic-nextjs` — working example app
- `apps/docs` — documentation site (cloud section excluded)
- `docs/setup-guide.md`, `docs/auto-discovery.md` — user-facing guides
- Root config: `turbo.json`, `tsconfig.base.json`, `eslint.config.js`, `.prettierrc`, `.gitignore`
- `LICENSE`, `CONTRIBUTING.md`, `.github/workflows/ci.yml`, `.changeset/`

**Private** (stays in this repo only):
- `packages/cloud` — cloud package (DB schema, API keys, billing)
- `apps/web` — cloud dashboard app
- `docs/plans/`, `docs/decisions/`, `docs/superpowers/` — internal planning
- `docs/01-06_*.md` — product vision, BRD, architecture, pitch deck
- `CLAUDE.md` — AI operating instructions
- `docker-compose.yml` — dev database
- `scripts/` — internal tooling

### Syncing to the public repo

After making changes to any public package, sync them to the public repo:

```bash
# Preview what will change
./scripts/sync-public.sh

# Sync, commit, and push in one step
./scripts/sync-public.sh --push
```

The sync script (`scripts/sync-public.sh`):
- Copies only public packages, example, docs app, and root config
- Uses `--delete` so removed files are cleaned up in the public repo
- Excludes build artifacts (`dist/`, `.next/`, `node_modules/`), env files, and coverage
- Does **not** sync `README.md` or `.env.example` at the public root — those are maintained separately since the public README differs from the private one
- Shows a `git status` diff before committing

### Publishing to npm

```bash
# 1. Describe the change
pnpm changeset

# 2. Bump versions and update changelogs
pnpm changeset version

# 3. Build and publish
pnpm build
pnpm -r publish --access public

# 4. Sync the version bumps to the public repo
./scripts/sync-public.sh --push
```
