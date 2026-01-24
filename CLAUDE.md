# CLAUDE.md

> **⚠️ This file is a quick reference. For complete coding guidelines, see [AGENTS.md](./AGENTS.md)**

This project is a local-first TUI receipt manager built with OpenTUI, SolidJS, and Bun.

## Quick Commands
```bash
bun install                       # Install dependencies
bun dev                           # Run with hot-reload
bun test                          # Run all tests
bun test src/utils/fileParser.test.ts  # Run specific test
bun run tsc --noEmit              # Type check
```

## Three-Layer Architecture
1. **Main App** (`src/index.tsx`) - State management, orchestration, drag-and-drop
2. **Components** (`src/components/`) - UI layout (Header, Footer, ReceiptList, AppLayout)
3. **Utils** (`src/utils/`) - File operations (fileParser.ts, receipts.ts)

## Essential Guidelines
- **Architecture Details**: See [Application Architecture](./AGENTS.md#application-architecture)
- **OpenTUI Patterns**: See [OpenTUI-Specific Best Practices](./AGENTS.md#opentui-specific-best-practices)
- **Code Style**: See [Code Style Guidelines](./AGENTS.md#code-style-guidelines)
- **Common Mistakes**: See [Common Pitfalls](./AGENTS.md#common-pitfalls)

## Key Points for Claude Code
- Runtime: Bun (not Node.js) - use `Bun.file()`, `Bun.write()`, `Bun.Glob()`, `Bun.spawn()`
- UI Framework: OpenTUI + SolidJS (not React)
- Signals: Always call with `()` - `receipts()` not `receipts`
- Props: Don't destructure - use `props.value` not `{ value } = props`
