# AGENTS.md

**Agent Guidelines for lesentiel**

This file provides coding standards and guidelines for AI agents working in the lesentiel codebase. This is a local-first TUI application for organizing receipts, built with OpenTUI, SolidJS, and Bun.

## Build, Test, and Development Commands

### Running the Application
```bash
bun dev                           # Run with hot-reload (--watch flag)
bun run src/index.tsx             # Run without hot-reload
```

### Testing
```bash
bun test                          # Run all tests (concurrent by default)
bun test src/utils/fileParser.test.ts    # Run a specific test file
```

### Type Checking
```bash
bun run tsc --noEmit              # Type check without emitting files
```

### Installation
```bash
bun install                       # Install dependencies
```

## Runtime Environment

- **Runtime**: Bun (NOT Node.js) - has native TypeScript support
- **Module System**: ESM only (`"type": "module"`)
- **Package Manager**: Bun (uses `bun.lock`, NOT `package-lock.json` or `yarn.lock`)
- **File I/O**: Always use Bun APIs (`Bun.file()`, `Bun.write()`, `Bun.Glob()`, `Bun.spawn()`)

## Code Style Guidelines

### Imports
- **Order**: External packages first, then local imports, grouped logically
- **Extensions**: Include `.ts`/`.tsx` extensions in imports (configured via `allowImportingTsExtensions`)
- **Style**: Named imports preferred over default imports where applicable

**Example:**
```typescript
import { render, usePaste } from "@opentui/solid";
import { createSignal, onMount } from "solid-js";
import { ensureReceiptsDir, moveFileToReceipts } from "./utils/receipts.ts";
import { AppLayout } from "./components/AppLayout.tsx";
```

### TypeScript Configuration

The project uses **strict TypeScript** settings:
- `strict: true` - All strict type-checking options enabled
- `noUncheckedIndexedAccess: true` - Array/object access returns `T | undefined`
- `noUnusedLocals: true` and `noUnusedParameters: true` - No unused code
- `noFallthroughCasesInSwitch: true` - Switch statements require breaks
- `noImplicitOverride: true` - Explicit override keywords required
- `noPropertyAccessFromIndexSignature: true` - Use bracket notation for index access

**Critical TypeScript Rules:**
1. **Always null-check array access** - Due to `noUncheckedIndexedAccess`, array indexing returns `T | undefined`
2. **Prefer type guards over type assertions** - Use `if (value)` checks instead of `value!`
3. **Null-check** results from `find()`, `findIndex()`, optional properties, and array access

**Example:**
```typescript
const firstFile = files[0];  // Type: string | undefined
if (firstFile) {             // REQUIRED: null-check before use
  await processFile(firstFile);
}
```

### JSX Configuration

- **jsxImportSource**: `@opentui/solid` (DO NOT change this)
- **jsx**: `preserve` (handled by Bun's transpiler)
- **DO NOT** add React as a dependency - this project uses SolidJS
- Babel is configured with `babel-preset-solid` for JSX transformation

### Naming Conventions

- **Files**: camelCase for utilities (`fileParser.ts`), PascalCase for components (`AppLayout.tsx`)
- **Components**: PascalCase (`Header`, `ReceiptList`, `AppLayout`)
- **Functions**: camelCase (`parseFilePaths`, `moveFileToReceipts`)
- **Variables**: camelCase (`footerText`, `receipts`)
- **Constants**: SCREAMING_SNAKE_CASE for module-level constants (`RECEIPTS_DIR`)
- **Types**: PascalCase (`AppLayoutProps`, `HeaderProps`)

### OpenTUI Component Guidelines

**Critical OpenTUI Rules:**
1. **Component naming**: Solid uses underscores for multi-word components: `<ascii_font>`, `<tab_select>`, `<line_number>` (NOT hyphens)
2. **Text styling**: Use nested modifier tags (`<strong>`, `<em>`, `<u>`, `<span>`) inside `<text>`, NOT props like `bold` or `italic`
3. **Never call `process.exit()`**: Always use `renderer.destroy()` to properly restore terminal state
4. **Props reactivity**: Don't destructure props - keep them reactive (`props.value`, not `{ value } = props`)

**Component Patterns:**
- **Props**: Define explicit type with `Props` suffix (e.g., `AppLayoutProps`)
- **Optional props**: Use `| undefined` explicitly in type definitions
- **OpenTUI primitives**: Use lowercase JSX tags (`<box>`, `<text>`, `<ascii_font>`)
- **Layout**: Use flexbox properties on `<box>` elements (`flexDirection`, `alignItems`, `justifyContent`, `padding`, `margin`)

**Example:**
```typescript
type HeaderProps = {
  subtitle?: string | undefined;
};

export function Header(props: HeaderProps) {
  return (
    <box marginBottom={2} flexDirection="column">
      <ascii_font font="tiny" text="Receipt Manager" />
      {props.subtitle ? (
        <text><span fg="#888">{props.subtitle}</span></text>
      ) : null}
    </box>
  );
}
```

**Available Components:**
- Layout: `<box>`, `<scrollbox>` (with `overflow="scroll"`)
- Text: `<text>` with nested modifiers (`<strong>`, `<em>`, `<u>`, `<span>`, `<br>`, `<a>`)
- Display: `<ascii_font>` (fonts: `tiny`, `block`, `slick`, `shade`)
- Input: `<input>`, `<textarea>`, `<select>`, `<tab_select>` (note underscore!)
- Code: `<code>`, `<line_number>`, `<diff>`

### SolidJS Patterns

- **Reactivity**: Use `createSignal()` for state, call signals as functions to access values
- **Effects**: Use `onMount()` for initialization, `createEffect()` for reactive effects
- **Lists**: Use `<For>` component for rendering arrays
- **Conditional rendering**: Use ternary operators or `&&` for conditional JSX

**Example:**
```typescript
const [receipts, setReceipts] = createSignal<string[]>([]);
const currentReceipts = receipts();  // Call signal to get value
setReceipts(newReceipts);            // Call setter to update
```

### Error Handling

- **Throw descriptive errors** with context (filename, operation, reason)
- **Catch at boundaries** - Catch errors at UI boundaries and display to user
- **Error messages**: Start with "Failed to..." or "Error:" for consistency
- **Type-check errors**: Use `instanceof Error` before accessing error properties

**Example:**
```typescript
try {
  await moveFileToReceipts(filePath);
} catch (err) {
  setFooterText(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
}

// In utility functions:
throw new Error(`Source file does not exist: ${sourcePath}`);
throw new Error(`Failed to move file: ${error.message}`);
```

### Testing Patterns

- **Framework**: Bun's native test runner (`bun:test`)
- **Imports**: `import { describe, expect, it, beforeEach, afterEach } from "bun:test"`
- **Structure**: Use `describe()` for grouping, `it()` for test cases
- **Test files**: Colocated with source (e.g., `fileParser.test.ts` next to `fileParser.ts`)
- **Concurrency**: Tests run concurrently by default (configured in `bunfig.test.toml`)

**Temporary file management:**
- Use `/tmp/` directory for test files
- Track created files in an array
- Clean up in `afterEach` hooks using `Bun.spawn(["rm", file])`
- Ignore cleanup errors (files may not exist)

**Example:**
```typescript
describe("fileParser", () => {
  let testFiles: string[] = [];

  beforeEach(async () => {
    const testDir = "/tmp/receipt-test";
    await Bun.write(join(testDir, "test1.txt"), "test content");
    testFiles.push(join(testDir, "test1.txt"));
  });

  afterEach(async () => {
    for (const file of testFiles) {
      try {
        await Bun.spawn(["rm", file]).exited;
      } catch {
        // Ignore errors
      }
    }
  });

  it("should parse a single file path", async () => {
    const result = await parseFilePaths(testFiles[0]!);  // null-check with !
    expect(result).toEqual([testFiles[0]]);
  });
});
```

### Documentation

- **JSDoc comments**: Use for exported functions with parameter descriptions
- **Inline comments**: Explain "why" not "what" - only when logic is non-obvious
- **Type annotations**: Required for function parameters and return types

**Example:**
```typescript
/**
 * Parses pasted text to extract file paths.
 * Handles multiple formats:
 * - Single file path
 * - Multiple file paths (newline or space-separated)
 * - Paths with spaces (quoted or escaped)
 * - macOS file URLs (file:// protocol)
 * 
 * @param pastedText - The text pasted into the terminal
 * @returns Array of valid file paths that exist
 */
export async function parseFilePaths(pastedText: string): Promise<string[]> {
  // Implementation
}
```

## Project Structure

```
src/
├── index.tsx              # Entry point, app state, event handlers
├── components/            # UI components (Header, Footer, ReceiptList, AppLayout)
│   └── *.tsx
└── utils/                 # Business logic (file parsing, receipt management)
    ├── *.ts
    └── *.test.ts         # Colocated test files
```

## Application Architecture

This application follows a **three-layer structure**:

### 1. Main Application (`src/index.tsx`)
- Manages application state with SolidJS signals (`receipts`, `footerText`)
- Initializes the `~/receipts` directory on mount using `ensureReceiptsDir()`
- Handles drag-and-drop via `usePaste()` hook (captures paste events when files are dragged from Finder)
- Orchestrates file parsing and moving operations
- Renders the `AppLayout` component tree

### 2. UI Components (`src/components/`)
- **AppLayout**: Top-level layout container with flexbox column layout
- **Header**: Application title with ASCII art font (`<ascii_font>`)
- **ReceiptList**: Displays list of receipt files using SolidJS `<For>` component
- **Footer**: Status messages for user feedback

### 3. Utilities (`src/utils/`)
- **fileParser.ts**: Parses pasted text to extract file paths
  - Handles multiple formats: `file://` URLs, quoted paths, escaped spaces, newline/space-separated paths
  - Validates file existence before returning paths
- **receipts.ts**: Manages the `~/receipts` directory
  - `ensureReceiptsDir()`: Creates directory if it doesn't exist
  - `moveFileToReceipts()`: Validates source, checks for duplicates, copies file, then deletes original
  - `getReceiptsDir()`: Returns the receipts directory path

**Key Patterns:**
- **SolidJS Reactivity**: `createSignal()` for state, `onMount()` for initialization, `<For>` for list rendering
- **File Operations**: All file I/O uses Bun's native APIs (`Bun.file()`, `Bun.write()`, `Bun.Glob()`, `Bun.spawn()`)
- **Error Handling**: Utility functions throw descriptive errors that are caught at UI boundaries and displayed to users

## OpenTUI-Specific Best Practices

### Text Styling Pattern

**WRONG - Props don't work:**
```typescript
<text bold italic>This doesn't work</text>
<text attributes={TextAttributes.BOLD}>Wrong framework</text>
```

**CORRECT - Use nested tags:**
```typescript
<text>
  <strong>Bold</strong>, <em>italic</em>, <u>underlined</u>
  <span fg="red">Colored</span>
</text>
```

### Layout with Flexbox

**Common layouts:**
```typescript
// Vertical stack with spacing
<box flexDirection="column" gap={1}>
  <text>Item 1</text>
  <text>Item 2</text>
</box>

// Horizontal row with even distribution
<box flexDirection="row" justifyContent="space-between">
  <text>Left</text>
  <text>Right</text>
</box>

// Centered content
<box width="100%" height="100%" alignItems="center" justifyContent="center">
  <text>Centered</text>
</box>
```

### Terminal Lifecycle

**WRONG - Breaks terminal:**
```typescript
useKeyboard((key) => {
  if (key.name === "escape") {
    process.exit(0);  // Terminal left in broken state!
  }
});
```

**CORRECT - Proper cleanup:**
```typescript
import { useRenderer } from "@opentui/solid";

function App() {
  const renderer = useRenderer();
  
  useKeyboard((key) => {
    if (key.name === "escape") {
      renderer.destroy();  // Restores terminal properly
    }
  });
}
```

### Reactive Props Pattern

**WRONG - Breaks reactivity:**
```typescript
function Component(props: { value: string }) {
  const { value } = props;  // Destructured - not reactive!
  return <text>{value}</text>;
}
```

**CORRECT - Keep props reactive:**
```typescript
function Component(props: { value: string }) {
  return <text>{props.value}</text>;  // Reactive access
}
```

## Common Pitfalls

1. **Don't use Node.js APIs** - Use Bun APIs instead (`Bun.file()` not `fs`)
2. **Don't import React** - This project uses SolidJS, not React
3. **Don't forget file extensions** - Import with `.ts`/`.tsx` extensions
4. **Don't skip null checks** - Array access requires null-checking due to strict TypeScript
5. **Don't call signals without ()** - Signals are functions: `receipts()` not `receipts`
6. **Don't modify jsxImportSource** - Must remain `@opentui/solid`
7. **Don't use `process.exit()`** - Always use `renderer.destroy()` to restore terminal
8. **Don't use hyphenated component names** - Use underscores: `<ascii_font>` not `<ascii-font>`
9. **Don't destructure props** - Keep them reactive: `props.value` not `{ value } = props`
10. **Don't use text style props** - Use nested tags: `<text><strong>Bold</strong></text>` not `<text bold>`
