# Contributing to AI-Me

Thanks for your interest in contributing! AI-Me is an open-source AI copilot plugin for SaaS apps.

## Setup

```bash
git clone https://github.com/aselims/ai-me-chat.git
cd ai-me-chat
pnpm install
pnpm build
```

Requires Node 20+ and pnpm 10+.

## Project Structure

```
packages/
  core/     — Tool discovery, schema extraction, OpenAPI support
  react/    — Chat panel, command palette, confirmation dialog
  nextjs/   — Next.js route handler, auto-discovery, proxy
apps/
  docs/     — Documentation site
examples/
  basic-nextjs/ — Complete working example
```

## Development Workflow

1. Fork the repo and create a feature branch from `main`
2. Make changes in the relevant package(s)
3. Run quality gates:
   ```bash
   pnpm typecheck && pnpm lint && pnpm test && pnpm build
   ```
4. Commit with conventional format: `feat(core):`, `fix(react):`, `chore(nextjs):`
5. Open a pull request against `main`

## Running the Example App

```bash
cd examples/basic-nextjs
cp .env.example .env.local
# Add your GROQ_API_KEY or OPENAI_API_KEY to .env.local
pnpm dev
```

## Running Tests

```bash
pnpm test          # Run all tests
pnpm test --filter @ai-me-chat/core   # Run tests for a specific package
```

## Code Style

- TypeScript strict mode
- ESLint + Prettier (run `pnpm format` to auto-fix)
- No new dependencies without discussion in an issue first

## Reporting Issues

Open an issue at [github.com/aselims/ai-me-chat/issues](https://github.com/aselims/ai-me-chat/issues).

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
