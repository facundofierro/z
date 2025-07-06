# Z Language Specification

## Table of Contents

1. [Overview](#overview)
2. [Core Principles](#core-principles)
3. [Syntax and Grammar](#syntax-and-grammar)
4. [Target Blocks](#target-blocks)
5. [Compiler Inheritance System](#compiler-inheritance-system)
6. [AI-Optimized Context](#ai-optimized-context)
7. [Zero-Config Scaffolding](#zero-config-scaffolding)
8. [Modifier System](#modifier-system)
9. [Standard Library](#standard-library)
10. [Compiler Architecture](#compiler-architecture)

## Overview

Z Language is a meta-programming language designed around **target-first development**. Unlike traditional languages that compile to a single target, Z organizes code into explicit compilation blocks that declare their intended output platform.

## Core Principles

### 1. Target-First Development

Code is organized into explicit compilation blocks that declare their targets:

```z
next AppName { ... }    // → Next.js application
@target(wasm)
rust AppName { ... }    // → WebAssembly module
@targets([all])
Lib { ... }             // → Cross-platform code
swift AppName { ... }   // → iOS/macOS application
```

**Key Benefits:**

- Clear separation of concerns
- Platform-specific optimization
- Automatic toolchain selection
- Predictable output structure

### 2. Compiler Inheritance System

Child blocks inherit their parent's compilation context and toolchain:

```z
@database(postgres)
next ECommerceApp {
  // Parent context: TypeScript, Next.js, React, PostgreSQL

  Schema {
    // Inherits: TS types + Drizzle ORM + SQL generation
    model User { ... }
  }

  Routes {
    // Inherits: Next.js routing + React components
    admin
  }
}
```

**Inheritance Rules:**

- Child blocks inherit parent's target environment
- Modifiers can override inherited behavior
- Context annotations flow down the hierarchy
- Toolchain plugins are automatically selected

### 3. AI-Optimized Context

Every module, function, and block must include context annotations:

```z
@doc("User authentication and authorization")
@context("Handles JWT tokens, OAuth2 flows, session management")
module Auth {
  @doc("Validates JWT token and extracts user claims")
  @context("Used by middleware to protect routes")
  function validateToken(token: string): UserClaims { ... }
}
```

**Context Hierarchy:**

- Module-level context describes overall purpose
- Function-level context explains specific behavior
- Block-level context defines compilation targets
- Annotations are inherited and composed

### 4. Zero-Config Scaffolding

Automatic file and folder generation based on block structure:

```z
Routes {
  admin          // → /app/admin/page.z
  users {        // → /app/users/page.z
    [id]         // → /app/users/[id]/page.z
  }
  api {
    auth       // → /app/api/auth/route.z
  }
}
```

**Scaffolding Rules:**

- 500-line file limit (auto-splits when exceeded)
- Shared code → `/shared` directory
- Platform-specific code → `/targets/{name}` directory
- Generated files use `.z` extension
- Build artifacts use target-specific extensions

### 5. Unified Extensible Syntax

TypeScript-like base syntax with custom control structures and DSL blocks:

```z
// Custom control structures
@attempts(3) @delay(1000)
Retry {
  apiCall()
}

@ttl(300)
Cache {
  expensiveComputation()
}

// DSL blocks
@doc("Container configuration")
Docker {
  from: "node:20"
  workdir: "/app"
  copy: ["package*.json", "./"]
  run: "npm install"
  cmd: ["npm", "start"]
}

Routes {
  api {
    users
  }
}
```

## Syntax and Grammar

### Basic Syntax

Z Language uses a TypeScript-like syntax with additional constructs:

```z
// Variables and constants
let userName: string = "Alice"
const MAX_RETRIES: number = 3

// Functions
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// Classes
class UserService {
  constructor(private db: Database) {}

  async findUser(id: string): Promise<User | null> {
    return await this.db.users.findUnique({ where: { id } })
  }
}
```

### Block Syntax

Blocks are the fundamental organizational unit:

```z
// Basic block
BlockName {
  // Block content
}

// Block with parameters
BlockName(param1: value1, param2: value2) {
  // Block content
}

// Block with modifiers
@modifier(options)
BlockName {
  // Block content
}

// Block with documentation
@doc("Description of the block")
@context("Context for AI understanding")
BlockName {
  // Block content
}
```

### Annotation System

Annotations provide metadata for compilation and AI context:

```z
@doc(description: string)           // Human-readable description
@context(context: string)           // AI context information
@target(platform: string)          // Compilation target
@orm(type: string)                  // ORM system to use
@database(type: string)             // Database type
@auth(required: boolean)            // Authentication requirement
@cache(ttl: number)                 // Caching configuration
@retry(attempts: number)            // Retry configuration
@deprecated(reason: string)         // Deprecation notice
```

## Target Blocks

### NextJS Block

Generates complete Next.js applications:

```z
@doc("E-commerce platform")
@database(postgres)
next ECommerceApp {
  Routes {
    home
    products {
      [id]
    }
    cart
    admin {
      @auth(required)
      dashboard
    }
  }

  @orm(drizzle)
  Schema {
    model User {
      id: string @primary @default(uuid())
      email: string @unique
      name: string
      createdAt: datetime @default(now())
    }

    model Product {
      id: string @primary @default(uuid())
      name: string @max(100)
      price: number @min(0)
      categoryId: string
      category: Category @relation(fields: [categoryId], references: [id])
    }
  }

  API {
    users
    products
  }
}
```

**Generated Structure:**

```
my-app/
├── app/
│   ├── page.z
│   ├── products/
│   │   ├── page.z
│   │   └── [id]/
│   │       └── page.z
│   ├── cart/
│   │   └── page.z
│   └── api/
│       ├── users/
│       │   └── route.z
│       └── products/
│           └── route.z
├── lib/
│   ├── db/
│   │   └── schema.ts
│   └── types/
│       └── index.ts
└── migrations/
    └── 20240707_001_initial.sql
```

### Rust Block

Generates Rust code with optional WebAssembly target:

```z
@doc("High-performance computation module")
@context("Handles CPU-intensive calculations for web frontend")
@target(wasm)
rust CalculationModule {
  type Calculator {
        precision: u32

        // constructor
        fun new(precision: u32): Self {
            return { precision }
        }

        // method
        fun fibonacci(n: u32): u64 {
            if (n <= 1) { return n as u64 }
            // …
        }
  }

  // WebAssembly export
  @export
  fun calculate_fibonacci(n: u32): number @u64 {
    let calc = Calculator.new(10)
    return calc.fibonacci(n)
  }
}
```

### SwiftUI Block

Generates iOS/macOS applications:

```z
@doc("Mobile task management app")
@context("iOS app for managing personal tasks and projects")
swift TaskApp {
  App {
    WindowGroup {
      ContentView()
    }
  }

  Components {
    @state tasks: Task[] = []
    ContentView(tasks) {
      NavigationView(navigationTitle: 'Tasks', toolbar: Toolbar) {
        List{
            tasks.map(task:Task) {
              TaskRow(task)
            }
        }
      }
    }
  }
}
```

### Lib Block

Generates cross-platform libraries:

```z
@doc("Utility functions")
@context("Common utilities used across all platforms")
@targets([js, rust, python, swift])
Lib {
  @doc("Formats currency values with proper locale")
  @params(amount: number, currency: string = "USD")
  @response(string)
  fun formatMoney(amount, currency = "USD") {
    return Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount)
  }

  @doc("Validates email addresses using RFC 5322 specification")
  @params(email: string)
  @response(boolean)
  fun validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  @doc("Generates secure random UUIDs")
  @response(string)
  fun generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, fun(c) {
      const r = Math.random() * 16 | 0
      const v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }
}
```

## Compiler Inheritance System

### Inheritance Rules

1. **Toolchain Inheritance**: Child blocks inherit parent's compilation toolchain
2. **Context Inheritance**: Annotations flow down the block hierarchy
3. **Modifier Inheritance**: Child blocks can override parent modifiers
4. **Dependency Inheritance**: Parent dependencies are available to children

### Example Inheritance Chain

```z
@database(postgres)
next ECommerceApp {
  // Parent context: TypeScript, React, Next.js, PostgreSQL

  @orm(drizzle)
  Schema {
    // Inherits: TS + React + Next.js + PostgreSQL + Drizzle
    // Generates: TypeScript types, Drizzle schema, SQL migrations

    model User {
      id: string @primary
      email: string @unique
    }
  }

  Routes {
    // Inherits: TS + React + Next.js + PostgreSQL (for data fetching)
    // Generates: Next.js pages and API routes

    users {
      // Inherits: All parent contexts
      // Has access to: User model, database connection, TypeScript types
      @component(UserList)
      @data(async () => {
        return await db.user.findMany()
      })
      list
    }
  }
}
```

### Modifier Override System

```z
@database(postgres)
next WebApp {
  // Default database: PostgreSQL

  @database(mysql)
  Schema {
    // Override: Uses MySQL instead of PostgreSQL
    // Generates: MySQL-specific schema and migrations

    model Product { ... }
  }

  @database(redis)
  CacheLayer {
    // Override: Uses Redis for caching
    // Generates: Redis connection and cache utilities

    cache ProductCache {
      ttl: 3600
      keyPrefix: "product:"
    }
  }
}
```

## AI-Optimized Context

### Context Annotation System

Z Language requires comprehensive context annotations to enable AI-assisted development:

```z
@doc("User authentication and session management")
@context("Handles login, logout, JWT tokens, OAuth2 flows, and session persistence")
module Auth {
  @doc("Validates JWT token and extracts user claims")
  @context("Called by middleware to protect routes; returns null for invalid tokens")
  function validateToken(token: string): UserClaims | null {
    // Implementation
  }

  @doc("Generates secure JWT token for authenticated user")
  @context("Used after successful login; includes user ID and permissions")
  function generateToken(user: User): string {
    // Implementation
  }
}
```

### Context Hierarchy

Context flows through the compilation tree:

```text
Application Level
├── @doc("E-commerce platform")
├── @context("Full-stack web app with product catalog, shopping cart, payments, admin panel")
│
├── Auth Module
│   ├── @context("JWT authentication, OAuth2, session management, user registration")
│   ├── validateToken() → "Route protection, JWT validation, security logging"
│   └── generateToken() → "Post-login token creation, user claims, expiration"
│
├── Products Module
│   ├── @context("Product catalog, search, filtering, categories, inventory management")
│   ├── searchProducts() → "Full-text search, filters, pagination, SEO optimization"
│   └── updateInventory() → "Stock management, low-stock alerts, supplier integration"
│
└── Orders Module
    ├── @context("Shopping cart, checkout, payments, order fulfillment, shipping")
    ├── processPayment() → "Payment processing, fraud detection, transaction logging"
    └── calculateShipping() → "Shipping cost calculation, carrier integration, delivery estimates"
```

### AI Context Generation

The compiler generates AI-friendly context trees:

```json
{
  "module": "Auth",
  "description": "User authentication and session management",
  "context": "Handles login, logout, JWT tokens, OAuth2 flows, and session persistence",
  "dependencies": [
    "jwt",
    "bcrypt",
    "oauth2"
  ],
  "functions": [
    {
      "name": "validateToken",
      "description": "Validates JWT token and extracts user claims",
      "context": "Called by middleware to protect routes; returns null for invalid tokens",
      "signature": "validateToken(token: string): UserClaims | null",
      "usedBy": [
        "authMiddleware",
        "protectedRoutes"
      ],
      "calls": [
        "jwt.verify",
        "db.user.findUnique"
      ]
    }
  ]
}
```

## Zero-Config Scaffolding

### Automatic File Generation

Z Language automatically generates file structures based on block organization:

```z
next BlogApp {
  Routes {
    home
    about
    blog {
      [slug]
    }
    admin
    api {
      posts
    }
  }
}
```

**Generated Structure:**

```
/app
├── page.z              # home
├── about/
│   └── page.z          # about
├── blog/
│   ├── page.z          # blog
│   └── [slug]/
│       └── page.z      # blog post
├── admin/
│   └── page.z          # admin
└── api/
    └── posts/
        └── route.z     # posts API
```

### File Organization Rules

1. **500-Line Limit**: Files are automatically split when they exceed 500 lines
2. **Shared Code**: Common utilities placed in `/shared` directory
3. **Platform Code**: Target-specific code in `/targets/{platform}` directory
4. **Generated Files**: Build artifacts use appropriate extensions (`.ts`, `.js`, `.rs`, etc.)

### Auto-Splitting Example

```z
// Original file: user-management.z (600 lines)
// Automatically split into:

// /shared/types/user.z
@doc("User data types and interfaces")
export interface User {
  id: string
  email: string
  profile: UserProfile
}

// /shared/utils/validation.z
@doc("User validation utilities")
export function validateUser(user: User): boolean {
  // Validation logic
}

// /targets/nextjs/components/user-list.z
@doc("User list component")
export function UserList() {
  // Component logic
}
```

## Modifier System

### Database Modifiers

```z
@database(postgres) @orm(drizzle)
Schema {
  // PostgreSQL with Drizzle ORM
  model User { ... }
}

@database(mysql) @orm(prisma)
Schema {
  // MySQL with Prisma ORM
  model Product { ... }
}

@database(sqlite) @orm(native)
Schema {
  // SQLite with native SQL
  model Session { ... }
}
```

### Target Modifiers

```z
@target(wasm) @optimize(size)
rust ComputeModule {
  // WebAssembly optimized for size
}

@target(native) @optimize(speed)
rust ComputeModule {
  // Native binary optimized for speed
}

@target(node) @runtime(bun)
JavaScript {
  // Node.js compatible, runs on Bun
}
```

### Feature Modifiers

```z
@auth(jwt) @rate_limit(100) @cache(redis)
API {
  users {
    @method("GET") get: listUsers
    @method("POST") post: createUser
  }
}

@middleware([auth, logging, cors])
Routes {
  admin
  dashboard
}
```

## Standard Library

### Built-in Functions

```z
// String utilities
string.format(template: string, ...args: any[]): string
string.validate(pattern: RegExp): boolean
string.sanitize(options: SanitizeOptions): string

// Array utilities
array.chunk<T>(size: number): T[][]
array.unique<T>(): T[]
array.groupBy<T, K>(keyFn: (item: T) => K): Map<K, T[]>

// Async utilities
async.retry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T>
async.timeout<T>(fn: () => Promise<T>, ms: number): Promise<T>
async.parallel<T>(fns: (() => Promise<T>)[]): Promise<T[]>

// Date utilities
date.now(): DateTime
date.format(format: string): string
date.add(duration: Duration): DateTime
date.isValid(): boolean
```

### Custom Control Structures

```z
// Retry with exponential backoff
@attempts(3) @backoff(exponential)
Retry {
  await apiCall()
}

// Cache with TTL
@ttl(300) @key("user:profile")
Cache {
  return await fetchUserProfile()
}

// Rate limiting
@requests(100) @window(60)
RateLimit {
  await processRequest()
}

// Circuit breaker
@failure_threshold(5) @timeout(30)
CircuitBreaker {
  await externalService.call()
}
```

## Compiler Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Z Language Compiler                     │
├─────────────────────────────────────────────────────────────┤
│  Frontend: Lexer → Parser → AST → Semantic Analysis        │
├─────────────────────────────────────────────────────────────┤
│  Middle: Block Resolution → Context Engine → Optimization  │
├─────────────────────────────────────────────────────────────┤
│  Backend: Target Routers → Code Generators → File Writers  │
└─────────────────────────────────────────────────────────────┘
```

### Compilation Pipeline

1. **Lexical Analysis**: Parse Z source files into tokens
2. **Syntax Analysis**: Build Abstract Syntax Tree (AST)
3. **Semantic Analysis**: Type checking and context validation
4. **Block Resolution**: Identify target blocks and inheritance chains
5. **Code Generation**: Compile to target-specific output
6. **Context Generation**: Create AI-friendly metadata
7. **File Organization**: Apply scaffolding rules and generate structure

### Compiler Plugins

```z
// Plugin architecture allows custom targets
plugin NextJSCompiler {
  target: "nextjs"
  fileExtensions: [".tsx", ".ts", ".js"]

  compile(block: NextJSBlock): GeneratedFiles {
    // NextJS-specific compilation logic
  }
}

plugin RustCompiler {
  target: "rust"
  fileExtensions: [".rs"]

  compile(block: RustBlock): GeneratedFiles {
    // Rust-specific compilation logic
  }
}
```

### Error Handling

```z
// Compile-time error checking
CompileError: {
  InvalidTarget: "Target 'xamarin' not found. Available targets: nextjs, rust, swiftui"
  MissingContext: "Function 'processPayment' missing @context annotation"
  InheritanceConflict: "Child block database modifier conflicts with parent"
  FileSizeExceeded: "File 'user-service.z' exceeds 500 lines. Auto-splitting enabled."
}

// Runtime error handling
RuntimeError: {
  TargetGenerationFailed: "NextJS compilation failed: Missing required dependency"
  ContextValidationFailed: "AI context validation failed: Insufficient documentation"
  ScaffoldingFailed: "Failed to create directory structure: Permission denied"
}
```

### Markup Element Syntax

Z's React-style markup DSL has three concise forms:

1. **Property-only element (no children)**

```z
element_name {
  property1: value1 @annotation
}
```

Use this when the element doesn't render children – you just configure it.

2. **Element with children**

```z
element_name {
  child1
  [optional_modifier] child2
  child3   // can be declared inline or live in its own file
}
```

3. **Element with both properties _and_ children**

```z
element_name(prop1: value1) {
  child1
  child2
  child3   // unresolved identifier ⇒ compiler scaffolds component `child3/child3.z`
}
```

The compiler recognises these forms, generates the appropriate JSX/HTML (or platform equivalent), wires up imports, and scaffolds missing child components automatically.

### Component Declaration & Parameter Binding

Z components are declared with the `component` keyword. Parameters are specified separately with an `@params` block to keep the signature clean and to give the compiler a single source of truth for prop-types:

```z
import Post from "../types"

@params {
  posts: Post[]
}
component HomePage(posts) {
  // ^ parameter name(s) must match entries in @params
  return Section {
    /* … */
  }
}
```

- `@params` accepts either an inline object literal or a reference to another type definition.
- Inside the component body the parameter variables are in scope directly (no destructuring needed).

### Rendering Collections

When you need to render a collection you pair `@params <ItemType>` with `<array>.map(item) { … }` – this simultaneously

1. tells the compiler the element type, and 2) gives you a concise loop body:

```z
@params Post
posts.map(post) {
  Article {
    H2 { text: post.title }
  }
}
```

If you want to use a different iterator name just change the alias:

```z
@params Post as p
posts.map(p) { /* … */ }
```

Under the hood this compiles to a keyed React `.map()` while preserving full type-safety.

This specification provides the foundation for implementing the Z Language compiler and toolchain. The language's unique combination of target-first development, AI-optimized context, and zero-config scaffolding makes it ideal for modern full-stack development workflows.
