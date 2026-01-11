# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is an OpenTUI project built with SolidJS and Bun. OpenTUI is a framework for building terminal user interfaces (TUIs) using a React-like JSX syntax with flexbox layout.

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
Currently no test framework is configured. When adding tests, consider:
- `bun:test` for native Bun testing
- `vitest` for compatibility with Vite ecosystem
- `@solidjs/testing-library` for component testing

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
