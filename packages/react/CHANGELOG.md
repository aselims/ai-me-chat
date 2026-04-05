# @ai-me-chat/react

## 0.3.1

### Patch Changes

- Fix confirmation UI not rendering with AI SDK v6. Tool part detection now uses `toolCallId` and `state` properties instead of the deprecated `"tool-call"` / `"tool-result"` type format. Adds `sendAutomaticallyWhen` for auto-resume after approval, and exports `isToolPart`, `getToolName`, and `ToolPartLike` utilities.

## 0.2.1

### Patch Changes

- Fix empty message rendering caused by Groq reasoning tokens (reasoning-start/reasoning-end SSE events).

## 0.2.0

### Minor Changes

- Integration improvements: health endpoint before auth, chat message validation, dynamic system prompt, tool/message completion callbacks, action intents, chat scroll fix, catch-all route example.

### Patch Changes

- Updated dependencies
  - @ai-me-chat/core@0.2.0

## 0.1.0

### Minor Changes

- Adding readme

### Patch Changes

- Updated dependencies
  - @ai-me-chat/core@0.1.0
