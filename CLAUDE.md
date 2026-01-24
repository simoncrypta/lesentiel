# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**lesentiel** is a local-first Terminal User Interface (TUI) application for organizing purchase receipts. Users drag-and-drop files from Finder directly into the terminal, and the app moves them to a centralized `~/receipts` directory. Built with OpenTUI (a framework for building TUIs with JSX), SolidJS, and Bun.

## Development Commands

### Setup
```bash
bun install
```

### Run the application
```bash
bun dev
```
Runs with hot-reload enabled via the `--watch` flag.

### Testing
```bash
# Run all tests
bun test

# Run a specific test file
bun test src/utils/fileParser.test.ts
```
Uses Bun's native test runner with concurrent execution.

### Type checking
```bash
bun run tsc --noEmit
```
TypeScript is used only for type checking, not compilation (configured via `noEmit: true` in tsconfig.json).

## Architecture

### Runtime Environment
- **Runtime**: Bun (not Node.js) - uses `bun.lock`, has native TypeScript support
- **Module System**: ESM only (`"type": "module"` in package.json)
- **Entry Point**: `src/index.tsx` - calls `render()` from `@opentui/solid`

### UI Framework Stack
The project uses a layered UI stack:
1. **OpenTUI Core** (`@opentui/core`): Provides primitive components and terminal-based flexbox layout system
2. **OpenTUI Solid** (`@opentui/solid`): SolidJS renderer for OpenTUI (provides `render()` and `usePaste()`)
3. **SolidJS** (v1.9.9): Reactive UI library with signals (`createSignal()`) and components (`For`, `onMount`)

### JSX Configuration
- JSX is preserved by TypeScript and handled by Bun's transpiler (configured via `bunfig.toml`)
- **jsxImportSource**: `@opentui/solid` (configured in tsconfig.json) - DO NOT change this
- Babel is configured with `babel-preset-solid` for JSX transformation
- Do NOT add React as a dependency - this project uses SolidJS

### OpenTUI Component System
OpenTUI uses lowercase JSX tags for TUI primitives (similar to HTML but for terminals):
- `<box>`: Flexbox container supporting `alignItems`, `justifyContent`, `flexGrow`, `flexDirection`, `padding`, etc.
- `<text>`: Text rendering with optional `TextAttributes` from `@opentui/core` for styling (`DIM`, `BOLD`, `ITALIC`, `UNDERLINE`)
- `<ascii_font>`: Renders text in ASCII art fonts
- Additional primitives: `<input>`, `<button>`, `<list>`, etc.

Layout uses flexbox properties on `<box>` elements.

### Application Architecture

**Three-layer structure:**

1. **Main Application** (`src/index.tsx`)
   - Manages application state with SolidJS signals (`receipts`, `footerText`)
   - Initializes the `~/receipts` directory on mount
   - Handles drag-and-drop via `usePaste()` hook (captures paste events when files are dragged from Finder)
   - Orchestrates file parsing and moving operations
   - Renders the `AppLayout` component

2. **UI Components** (`src/components/`)
   - `AppLayout`: Top-level layout container with flexbox column layout
   - `Header`: Application title with ASCII art font
   - `ReceiptList`: Displays list of receipt files using SolidJS `For` component
   - `Footer`: Status messages for user feedback

3. **Utilities** (`src/utils/`)
   - **fileParser.ts**: Parses pasted text to extract file paths
     - Handles multiple formats: `file://` URLs, quoted paths, escaped spaces, newline/space-separated paths
     - Validates file existence before returning paths
   - **receipts.ts**: Manages the `~/receipts` directory
     - `ensureReceiptsDir()`: Creates directory if it doesn't exist
     - `moveFileToReceipts()`: Validates source, checks for duplicates, copies file, then deletes original
     - `getReceiptsDir()`: Returns the receipts directory path

### Key Patterns
- **SolidJS Reactivity**: Uses `createSignal()` for state, `onMount()` for initialization, `For` for list rendering
- **File Operations**: All file I/O uses Bun's native APIs (`Bun.file()`, `Bun.write()`, `Bun.Glob()`, `Bun.spawn()`)
- **Error Handling**: Each utility function throws descriptive errors that are caught and displayed to the user

### TypeScript Configuration
The project uses strict TypeScript settings:
- `strict: true` - All strict checks enabled
- `noUncheckedIndexedAccess: true` - Array/object access returns `T | undefined` (always null-check array access)
- `noFallthroughCasesInSwitch: true`
- `noImplicitOverride: true`
- `noUnusedLocals: true` and `noUnusedParameters: true`
- `noPropertyAccessFromIndexSignature: true`

**When writing code**: Prefer type guards over type assertions. Always null-check values from array access, `find()`, `findIndex()`, or optional properties.

### Testing Patterns
Tests use Bun's native test runner (`bun:test`) with `describe`, `it`, `expect`, `beforeEach`, `afterEach`.

**File testing patterns:**
- Tests are colocated with source files (e.g., `fileParser.test.ts` next to `fileParser.ts`)
- Tests run concurrently by default (configured in `bunfig.test.toml`)
- Tests that create temporary files should:
  - Use `/tmp/` directory for test files
  - Track created files in an array
  - Clean up in `afterEach` hooks using `Bun.spawn(["rm", file])`

## Key Configuration Files

### bunfig.toml
Configures Bun's preload behavior for OpenTUI Solid. Required for proper JSX handling.

### tsconfig.json
- `"module": "Preserve"` - For Bun compatibility
- `"moduleResolution": "bundler"` - Modern resolution strategy
- `"jsxImportSource": "@opentui/solid"` - Critical for proper JSX typing
- `"allowImportingTsExtensions": true` - Allows importing `.ts`/`.tsx` files with extensions
