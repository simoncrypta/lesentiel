# lesentiel

A local-first terminal UI for organizing and managing purchase receipts.

## Overview

**lesentiel** is a Terminal User Interface (TUI) application built with OpenTUI, SolidJS, and Bun. It provides a simple drag-and-drop interface directly in your terminal to organize receipts into a centralized location.

### Features

- 🗂️ **Drag & Drop**: Drop files from Finder directly into the terminal
- 📁 **Centralized Storage**: Automatically organizes receipts in `~/receipts`
- 🎨 **Terminal UI**: Clean, modern TUI with real-time updates
- ⚡ **Fast**: Built with Bun for near-instant startup and hot-reload
- 🔒 **Local-First**: All data stays on your machine

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) runtime installed
- macOS, Linux, or Windows with WSL

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd lesentiel

# Install dependencies
bun install
```

### Usage

```bash
# Start the application
bun dev
```

Once running, drag and drop receipt files from Finder into the terminal window. Files will be automatically moved to `~/receipts`.

## Development

### Running Tests

```bash
# Run all tests
bun test

# Run a specific test file
bun test src/utils/fileParser.test.ts
```

### Type Checking

```bash
bun run tsc --noEmit
```

## Technology Stack

- **[OpenTUI](https://opentui.dev)**: Framework for building terminal UIs with JSX
- **[SolidJS](https://www.solidjs.com)**: Reactive UI library
- **[Bun](https://bun.sh)**: Fast JavaScript runtime and toolkit

## Future Goals

- Extract and standardize receipt data (items, prices, dates)
- OCR integration for scanned receipts
- Receipt categorization and search
- Export to various formats (CSV, JSON)

## License

See [LICENSE.md](LICENSE.md) for details.
