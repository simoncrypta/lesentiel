# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a local-first terminal receipt management application built with OpenTUI, SolidJS, and Bun. The app allows users to drag-and-drop files into a terminal UI to move them to a centralized `~/receipts` directory. OpenTUI is a framework for building terminal user interfaces (TUIs) using a React-like JSX syntax with flexbox layout.

## Development Commands

### Setup
```bash
bun install
```

### Development
```bash
bun dev
```
Runs the TUI application with hot-reload enabled via `--watch` flag.

### Testing
```bash
bun test
```
Runs all tests using Bun's native test runner with concurrent execution.

To run a specific test file:
```bash
bun test src/utils/fileParser.test.ts
```

### TypeScript Type Checking
```bash
bun run tsc --noEmit
```
Since the project has `noEmit: true` in tsconfig.json, TypeScript is used only for type checking, not compilation.

## Architecture

### Runtime Environment
- **Runtime**: Bun (not Node.js)
- **Package Manager**: Bun (uses `bun.lock`, not `package-lock.json` or `yarn.lock`)
- **Module System**: ESM only (`"type": "module"` in package.json)

### UI Framework Stack
- **OpenTUI Core** (`@opentui/core`): Provides the primitive components and layout system
- **OpenTUI Solid** (`@opentui/solid`): SolidJS renderer for OpenTUI
- **SolidJS** (v1.9.9): The reactive UI library powering components

### JSX Configuration
- JSX is preserved and handled by Bun's transpiler (configured via `bunfig.toml`)
- JSX import source is `@opentui/solid` (see `tsconfig.json`)
- Babel is configured for Solid preset to handle JSX transformation

### Component System
OpenTUI uses lowercase JSX tags for TUI primitives:
- `<box>`: Flexbox container (supports `alignItems`, `justifyContent`, `flexGrow`, etc.)
- `<text>`: Text rendering with optional styling attributes
- `<ascii_font>`: Renders text in ASCII art fonts
- Additional primitives: `<input>`, `<button>`, `<list>`, etc.

### TypeScript Configuration
The project uses strict TypeScript settings:
- `strict: true` - All strict checks enabled (including `strictNullChecks`)
- `noUncheckedIndexedAccess: true` - Array/object access returns `T | undefined`
- `noFallthroughCasesInSwitch: true`
- `noImplicitOverride: true`

When writing code, prefer type guards over assertions.

## Code Patterns

### Component Structure
Components are functional and use SolidJS patterns:

```typescript
import { render } from "@opentui/solid";
import { TextAttributes } from "@opentui/core";

render(() => (
  <box>
    {/* TUI components here */}
  </box>
));
```

### Entry Point
The main entry point is `src/index.tsx`, which calls `render()` from `@opentui/solid`.

### Application Architecture
- **Main Component** (`src/index.tsx`): Renders the TUI with receipt list and drag-and-drop handling
- **File Parser** (`src/utils/fileParser.ts`): Parses pasted text to extract file paths, handling various formats (file:// URLs, quoted paths, escaped spaces)
- **Receipt Manager** (`src/utils/receipts.ts`): Manages the `~/receipts` directory, handles file moving and directory creation

### Key Patterns
- **Drag-and-Drop**: Uses OpenTUI's `usePaste()` hook to capture paste events when files are dragged from Finder
- **SolidJS Reactivity**: Uses `createSignal()` for state management and `For` component for rendering lists
- **File Operations**: All file I/O uses Bun's native APIs (`Bun.file()`, `Bun.write()`, `Bun.Glob()`)

### Layout
- Use flexbox properties on `<box>` elements for layout
- Common props: `flexGrow`, `alignItems`, `justifyContent`, `flexDirection`
- OpenTUI uses a terminal-based flexbox implementation

### Styling
- Text styling via `TextAttributes` from `@opentui/core`
- Available attributes: `DIM`, `BOLD`, `ITALIC`, `UNDERLINE`, etc.

## Project Configuration Files

### bunfig.toml
Configures Bun's preload behavior for OpenTUI Solid. Required for proper JSX handling.

### tsconfig.json
- Uses `"module": "Preserve"` for Bun compatibility
- `"moduleResolution": "bundler"` for modern resolution
- `"jsxImportSource": "@opentui/solid"` for proper JSX typing
- Allows importing `.ts`/`.tsx` extensions directly

## Testing
The project uses Bun's native test runner (`bun:test`).

### Test Structure
- Tests are colocated with source files (e.g., `fileParser.test.ts` next to `fileParser.ts`)
- Uses `describe`, `it`, `expect`, `beforeEach`, `afterEach` from `bun:test`
- Tests run concurrently by default (configured in `bunfig.test.toml`)

### File Testing Patterns
Tests that create temporary files should:
- Use `/tmp/` directory for test files
- Clean up in `afterEach` hooks using `Bun.spawn(["rm", file])`
- Track created files in an array for cleanup

## Common Pitfalls

### JSX Configuration
- Do not change `jsxImportSource` - it must be `@opentui/solid`
- Do not add React as a dependency - this uses SolidJS

### Bun vs Node.js
- Use `bun` commands, not `npm` or `yarn`
- Bun has native TypeScript support - no need for `ts-node`
- Some Node.js-specific APIs may not be available

### Strict TypeScript
- Array access returns `T | undefined` due to `noUncheckedIndexedAccess`
- Always null-check values from `find()`, `findIndex()`, or optional properties
- Use type guards instead of type assertions when possible
