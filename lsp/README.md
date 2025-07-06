# Z Language Server (LSP)

> **Language Server Protocol implementation providing IntelliSense, diagnostics, and code completion for the Z Language.**

## Overview

The Z Language Server is a **Language Server Protocol (LSP)** implementation that provides rich editor support for the [Z Language](../doc/README.md) - a revolutionary meta-programming language designed around target-first development. This LSP enables intelligent code completion, real-time diagnostics, and context-aware suggestions in any LSP-compatible editor.

## Features

### 🎯 **Target-Aware Completion**

- Smart completion for target blocks (`NextJS`, `SwiftUI`, `Rust`, `Tauri`)
- Context-sensitive suggestions based on compilation target
- Registry-based validation of allowed children and structures

### 🔍 **Real-Time Diagnostics**

- Validates target block syntax and structure
- Checks for unknown targets and suggests alternatives
- Warns about missing documentation (`@doc`, `@context` annotations)
- Highlights TODO comments for task tracking

### 📝 **Intelligent IntelliSense**

- Auto-completion for Z Language keywords (`fun`, `if`, `else`, `for`, `in`)
- Target-specific child element suggestions
- Annotation support (`@params`, `@response`, `@doc`, `@context`)

### 🏗️ **Multi-Target Support**

- **NextJS**: React-based web applications with TypeScript
- **SwiftUI**: iOS/macOS native applications
- **Rust**: High-performance systems programming and WebAssembly
- **Tauri**: Cross-platform desktop applications

## Supported Targets

| Target    | Description                 | Children                                | Use Case                               |
| --------- | --------------------------- | --------------------------------------- | -------------------------------------- |
| `NextJS`  | React web apps with Next.js | `Routes`, `API`, `Components`, `Schema` | Full-stack web applications            |
| `SwiftUI` | Native iOS/macOS apps       | `App`, `Components`                     | Mobile and desktop apps                |
| `Rust`    | Systems programming         | `type`, `fun`, `mod`                    | High-performance services, WebAssembly |
| `Tauri`   | Desktop apps                | `Frontend`, `Backend`, `Config`         | Cross-platform desktop applications    |

## Installation

### Prerequisites

- **Node.js** 18+
- **TypeScript** 5.0+
- LSP-compatible editor (VSCode, Neovim, Emacs, etc.)

### Build from Source

```bash
# Clone the repository
git clone <repository-url>
cd z/lsp

# Install dependencies
npm install

# Build the language server
npm run build

# Start the language server
npm start
```

### Development Mode

```bash
# Start in development mode with auto-reload
npm run watch
```

## Editor Integration

### Visual Studio Code

The Z Language includes a VSCode extension that automatically uses this language server.

**Quick Installation**:

```bash
# Build the language server
cd lsp && npm install && npm run build

# Build and install the extension
cd ../vscode && npm install && npm run compile && npm run package
code --install-extension z-language-0.1.0.vsix
```

See the [VSCode Extension README](../vscode/README.md) for detailed instructions.

### Other Editors

Configure your editor to use the Z Language Server:

**Server Command**: `node /path/to/z/lsp/dist/server.js`
**File Extensions**: `.z`
**Language ID**: `z`

#### Neovim (nvim-lspconfig)

```lua
require'lspconfig'.z_language_server.setup{
  cmd = {"node", "/path/to/z/lsp/dist/server.js", "--stdio"},
  filetypes = {"z"},
  root_dir = require'lspconfig'.util.root_pattern("main.z", ".git"),
}
```

#### Emacs (lsp-mode)

```elisp
(add-to-list 'lsp-language-id-configuration '(z-mode . "z"))
(lsp-register-client
 (make-lsp-client :new-connection (lsp-stdio-connection '("node" "/path/to/z/lsp/dist/server.js"))
                  :major-modes '(z-mode)
                  :server-id 'z-language-server))
```

## Usage Examples

### Basic Z Code with LSP Support

```z
@doc("E-commerce web application")
@context("Full-stack shopping platform with products, cart, and checkout")
next ECommerceApp {
  Routes {
    home
    products {
      [id]
    }
    cart
    checkout
  }

  @orm(drizzle)
  Schema {
    model Product {
      id: string @primary
      name: string @max(100)
      price: number
    }
  }

  API {
    products
    cart
    auth
  }
}
```

The LSP provides:

- ✅ **Auto-completion** for `Routes`, `Schema`, `API` within `next` blocks
- ✅ **Validation** that `model` is valid inside `Schema`
- ✅ **Diagnostics** for missing `@doc` annotations
- ✅ **Suggestions** for available targets and children

### Multi-Target Example

```z
@doc("Cross-platform task management app")
next WebApp {
  Routes {
    dashboard
    tasks
  }
}

swift MobileApp {
  App {
    TaskListView
    TaskDetailView
  }
}

rust ComputeModule {
  @target(wasm)
  fun processTaskData(data: TaskData) -> ProcessedData {
    // High-performance data processing
  }
}
```

## Project Structure

```
lsp/
├── package.json              # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── README.md                # This file
└── src/
    ├── server.ts            # Main LSP server implementation
    ├── registry.ts          # Z Language target registry loader
    └── embedded-registry.json # Fallback target definitions
```

### Key Files

- **`server.ts`**: Main LSP server with completion and diagnostics
- **`registry.ts`**: Loads target definitions and validation rules
- **`embedded-registry.json`**: Embedded registry with target specifications

## Configuration

The language server automatically loads the target registry from:

1. `./compiler/stdlib/registry.json` (workspace-relative)
2. `../compiler/stdlib/registry.json` (LSP-relative)
3. `./src/embedded-registry.json` (embedded fallback)

## Development

### Scripts

| Command         | Description                       |
| --------------- | --------------------------------- |
| `npm run build` | Compile TypeScript to JavaScript  |
| `npm start`     | Start the language server         |
| `npm run watch` | Development mode with auto-reload |

### Adding New Targets

1. Update `../compiler/stdlib/registry.json` with new target definition
2. Restart the language server to reload the registry
3. The LSP will automatically provide completion and validation for the new target

### Testing

```bash
# Test with a Z file
echo '@doc("Test app")
next TestApp {
  Routes {
    home
  }
}' > test.z

# Start LSP and open test.z in your editor
```

## Integration with Z Toolchain

This LSP is part of the complete Z Language toolchain:

- **[Z Compiler](../compiler/)**: Rust-based compiler that generates target-specific code
- **[VSCode Extension](../vscode/)**: Syntax highlighting and editor integration
- **[Documentation](../doc/)**: Language specification and examples
- **[Examples](../examples/)**: Sample Z projects showcasing multi-target development

## Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/new-target-support`
3. **Make** your changes and add tests
4. **Commit** with clear messages: `git commit -m 'Add support for Flutter target'`
5. **Push** to your branch: `git push origin feature/new-target-support`
6. **Submit** a pull request

### Development Guidelines

- Follow the existing TypeScript style and conventions
- Add comprehensive error handling for new features
- Update the embedded registry when adding new targets
- Test with multiple editors to ensure LSP compatibility

## License

This project is licensed under the **MIT License** - see the [LICENSE](../LICENSE) file for details.

## Support

- **Documentation**: [Z Language Docs](../doc/README.md)
- **Issues**: [GitHub Issues](https://github.com/z-lang/z/issues)
- **Discussions**: [GitHub Discussions](https://github.com/z-lang/z/discussions)

---

_"Intelligent code assistance for the last language you'll need."_
