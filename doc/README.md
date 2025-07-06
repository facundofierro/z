# Z Language Documentation

## The "Last Language You'll Need"

Welcome to the Z Language documentation! Z is a revolutionary programming language designed around **target-first development** and **AI-optimized context**, enabling developers to write once and compile to any target platform.

## 🚀 Quick Start

Z Language allows you to write code that automatically generates platform-specific outputs:

```z
@doc("E-commerce platform")
next WebApp {
  Routes {
    products
    users {
      [id]
    }
  }

  Schema {
    model Product {
      id: string @primary
      name: string @max(100)
      price: number
    }
  }
}
```

This single block generates:

- ✅ Complete Next.js application structure
- ✅ Database schemas and migrations
- ✅ TypeScript types
- ✅ ORM models and queries
- ✅ Route handlers and components

## 📚 Documentation Structure

- **[Language Specification](./specification.md)** - Complete language syntax and semantics
- **[Core Principles](./core-principles.md)** - Design philosophy and architecture
- **[Target Blocks](./target-blocks.md)** - Available compilation targets
- **[Examples](./examples/)** - Practical code examples
- **[Implementation Roadmap](./roadmap.md)** - Development timeline and milestones

## 🎯 Key Features

### Target-First Development

- **Explicit Compilation Blocks**: `next AppName { ... }`, `rust AppName { ... }`, `swift AppName { ... }`
- **Declarative Targets**: Code knows where it's going
- **Automatic Scaffolding**: Files and folders generated automatically

### AI-Optimized Context

- **Mandatory Documentation**: `@doc` and `@context` annotations
- **Hierarchical Inheritance**: Context flows through the compilation tree
- **LLM-Ready**: Perfect for AI-assisted development

### Zero-Config Experience

- **Smart Defaults**: Sensible configurations out of the box
- **Automatic Organization**: 500-line file limits with auto-splitting
- **Convention-Based**: Predictable project structure

### Unified Syntax

- **TypeScript-like Base**: Familiar syntax for developers
- **Custom Control Structures**: `Retry(3) { ... }`, `Cache { ... }`
- **DSL Blocks**: `Dockerfile { ... }`, `Routes { ... }`

## 🛠️ Installation (Coming Soon)

```bash
# Install Z Language CLI
npm install -g z-lang

# Create new project
z create my-app --template=nextjs

# Build targets
z build --target=nextjs
z build --target=rust
z build --target=all
```

## 🌟 Why Z Language?

1. **Write Once, Run Anywhere**: Single codebase, multiple targets
2. **AI-First Design**: Built for the age of AI-assisted development
3. **Zero Configuration**: Sensible defaults, minimal setup
4. **Type Safety**: Full TypeScript-like type system
5. **Extensible**: Custom compiler plugins and modifiers

## 📖 Learn More

- [Getting Started Tutorial](./examples/getting-started.md)
- [Language Specification](./specification.md)
- [Community Discord](https://discord.gg/z-language) (Coming Soon)
- [GitHub Repository](https://github.com/z-lang/z) (Coming Soon)

## 📄 License

Z Language is open source and available under the MIT License.

---

_"One syntax, any target - with AI whispering context into every compilation."_
