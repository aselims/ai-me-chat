# Contributing to AI-Me

## Setup

```bash
git clone https://github.com/ai-me/ai-me-chat.git
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
  cloud/    — Cloud dashboard
examples/
  basic-nextjs/ — Example Next.js app
```

## Running the Example App

```bash
cd examples/basic-nextjs
cp .env.example .env.local
# Add your OPENAI_API_KEY to .env.local
pnpm dev
```
