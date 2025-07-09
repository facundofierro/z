# Z Programming Language

A revolutionary "target-first" programming language that compiles to multiple platforms (Next.js, SwiftUI, Rust, Tauri, etc.) from a single codebase.

## 🏗️ Monorepo Structure

This is a **hybrid monorepo** supporting both Rust and TypeScript ecosystems:

```
z-lang/
├── 📦 Cargo.toml              # Rust workspace
├── 📦 package.json            # TypeScript workspace
├── 🔧 turbo.json              # Build orchestration
├── 📁 shared/                 # Shared assets
│   ├── registry.json          # Language registry (single source of truth)
│   └── grammar.pegjs          # PEG grammar definition
├── 📁 crates/                 # Rust packages (Cargo workspace)
│   ├── ast/                   # AST data structures
│   ├── parser/                # PEG-powered parser
│   ├── core/                  # Semantic analysis & code generation
│   └── cli/                   # Command-line interface
├── 📁 packages/               # TypeScript packages (pnpm workspace)
│   ├── language-server/       # LSP implementation
│   └── vscode-extension/      # VS Code extension
├── 📁 examples/               # Example Z programs
└── 📁 doc/                    # Documentation
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥18 with **pnpm** ≥8
- **Rust** ≥1.70 with **Cargo**
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/facundofierro/z-lang.git
cd z-lang

# Install TypeScript dependencies
pnpm install

# Build Rust components
cargo build --release

# Build TypeScript components
pnpm build:ts
```

### Development Commands

```bash
# 🔨 Build everything
pnpm build                    # Build all (Rust + TypeScript)
pnpm build:rust              # Build only Rust components
pnpm build:ts                # Build only TypeScript components

# 🔍 Development & Testing
pnpm dev                     # Start all development servers
pnpm dev:rust                # Watch-build Rust compiler
pnpm test                    # Run all tests
pnpm test:rust               # Run Rust tests
pnpm test:ts                 # Run TypeScript tests

# 🧹 Code Quality
pnpm lint                    # Lint all code
pnpm lint:rust               # Clippy for Rust
pnpm format                  # Format all code
pnpm format:rust             # rustfmt for Rust
pnpm format:ts               # Prettier for TypeScript

# 🧪 Try the Compiler
pnpm compile:example examples/hello.z

# 📦 Package VS Code Extension
pnpm package:extension
```

## 🎯 Core Architecture

### Target-First Development

Code is organized into explicit compilation blocks that declare their intended output:

```z
next WebApp {
    Routes { home, admin }
    Components { Button, Modal }
    Schema { User, Product }
}

swift MobileApp {
    App { MainView }
    Components { UserCard }
}

rust ComputeModule {
    type { User, Product }
    fun { process_data }
}
```

### Shared Registry System

The `shared/registry.json` file is the **single source of truth** for:

- Valid target types (`next`, `swift`, `rust`, etc.)
- Namespace definitions (`Routes`, `Components`, `Schema`, etc.)
- Scaffolding rules and file generation
- Validation patterns

Both the Rust compiler and TypeScript language server read from this shared registry.

### Compiler Inheritance System

Child blocks inherit parent compilation context:

```z
@database(postgres)
next ECommerceApp {
    Schema { User, Product }      # Inherits TypeScript + PostgreSQL
    Routes { shop, admin }        # Inherits all parent context + Schema types
}
```

## 🛠️ Component Overview

### Rust Components (`crates/`)

| Crate        | Purpose                               |
| ------------ | ------------------------------------- |
| **z-ast**    | Core AST data structures (zero logic) |
| **z-parser** | PEG-powered parser (source → AST)     |
| **z-core**   | Semantic analysis & code generation   |
| **z-cli**    | Command-line interface                |

```bash
# Development
cargo watch -x "run -p z-cli -- examples/hello.z"

# Testing
cargo test --workspace

# Production build
cargo build --release -p z-cli
```

### TypeScript Components (`packages/`)

| Package                      | Purpose                            |
| ---------------------------- | ---------------------------------- |
| **@z-lang/language-server**  | LSP implementation for IDE support |
| **@z-lang/vscode-extension** | VS Code extension                  |

```bash
# Language server development
cd packages/language-server
pnpm dev                     # Watch mode

# VS Code extension development
cd packages/vscode-extension
pnpm compile                 # Build extension
pnpm package                 # Create .vsix
```

## 📝 Examples

Explore the `examples/` directory for sample Z programs:

- **`hello.z`** - Basic syntax demonstration
- **`MultiTargetDemo/`** - Cross-platform app (Next.js + SwiftUI + Rust)
- **`SocialPlatform/`** - Complex multi-target social platform
- **`GameDev/`** - Game development with multiple targets

## 🔧 Development Guide

### Adding New Target Support

1. **Update Registry**: Add target definition in `shared/registry.json`
2. **Rust Compiler**: Implement `TargetCompiler` trait in `crates/core/src/compilers/`
3. **Language Server**: Registry changes are automatically picked up
4. **VS Code Extension**: Add syntax highlighting if needed

### Modifying the Grammar

1. **Edit Grammar**: Update `shared/grammar.pegjs`
2. **Regenerate Parser**: Build the parser crate
3. **Update AST**: Modify `crates/ast/` if needed
4. **Test**: Run compiler tests

### Registry-Driven Features

The shared registry enables:

- **Auto-completion** in VS Code
- **Validation** of target/namespace combinations
- **Scaffolding** of new files based on parent context
- **Documentation** generation

## 🏃‍♂️ CI/CD & Deployment

```bash
# Full CI pipeline
pnpm lint && pnpm test && pnpm build

# Release process
pnpm changeset              # Create changeset
pnpm version-packages       # Bump versions
pnpm release               # Publish packages
```

### Build Orchestration

Turborepo coordinates builds across both ecosystems:

- **Rust builds** use native Cargo for performance
- **TypeScript builds** use Rollup/TypeScript
- **Dependencies** are properly tracked across languages
- **Caching** optimizes repeated builds

## 📖 Documentation

- **`doc/`** - Language specification and guides
- **`doc/compiler.md`** - Compiler architecture
- **`packages/language-server/docs/`** - LSP documentation
- **`INSTALLATION_GUIDE.md`** - Detailed setup instructions

## 🤝 Contributing

1. **Fork & Clone** the repository
2. **Install Dependencies**: `pnpm install`
3. **Create Branch**: `git checkout -b feature/my-feature`
4. **Make Changes**: Follow the component structure
5. **Test**: `pnpm test` (both Rust and TypeScript)
6. **Submit PR**: With clear description

### Development Tips

- **Rust changes**: Run `cargo check` frequently
- **TypeScript changes**: Use `pnpm typecheck`
- **Registry changes**: Restart language server in VS Code
- **Mixed changes**: Use `pnpm build` to ensure everything works together

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🌟 Vision

_"One syntax, any target - with AI whispering context into every compilation."_

Z Language aims to eliminate the friction of multi-platform development while maintaining the power and performance characteristics of each target platform.

---

**Z Language Team** | [GitHub](https://github.com/facundofierro/z-lang) | [Documentation](./doc/)
