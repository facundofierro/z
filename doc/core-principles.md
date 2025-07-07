# Z Language Core Principles

## Design Philosophy

Z Language is built on five fundamental principles that guide every aspect of its design and implementation. These principles work together to create a unified development experience that bridges the gap between intention and implementation.

## 1. Target-First Development

### The Problem

Traditional languages require developers to think about implementation before thinking about the destination. You write JavaScript, then figure out how to deploy it. You write Rust, then figure out how to integrate it with your web frontend.

### The Z Solution

Z Language flips this paradigm. You start by declaring where your code is going, then write the logic:

```z
// Traditional approach (implementation-first)
const users = await fetchUsers();
// Where does this run? How does it deploy? What's the context?

// Z approach (target-first)
next WebApp {
  // This code knows it's becoming a Next.js app
  // It has access to React, TypeScript, and web APIs
  // It will generate proper file structure and deployment config

  Routes {
    users {
      list{
        fun GET() {
          return db.user.findMany();
        }
      }
    }
  }
}
```

### Key Benefits

1. **Automatic Toolchain Selection**: The compiler knows what tools to use based on your target
2. **Context-Aware Optimization**: Code is optimized for its specific deployment target
3. **Predictable Output**: You always know exactly what will be generated
4. **Reduced Configuration**: No need to configure webpack, babel, or deployment settings

### Target Block Examples

```z
// Web application
next WebApp {
  // Automatic: TypeScript, React, Next.js routing, SSR/SSG
}

// Mobile application
swift MobileApp {
  // Automatic: Swift, iOS SDK, App Store deployment
}

// High-performance computing
@target(wasm)
rust ComputeModule {
  // Automatic: Rust compiler, WebAssembly toolchain, JS bindings
}

// Cross-platform library
@targets([js, rust, python])
Lib {
  // Automatic: Multiple compiler targets, consistent API
}
```

## 2. Compiler Inheritance System

### The Problem

Modern applications require coordination between multiple technologies. Your database schema should match your TypeScript types, which should match your API endpoints, which should match your frontend components. Maintaining this consistency manually is error-prone and time-consuming.

### The Z Solution

Child blocks inherit their parent's compilation context, creating a cascading system of shared knowledge:

```z
@database(postgres)
next ECommerceApp {
  // Parent context: TypeScript, React, Next.js, PostgreSQL

  @orm(drizzle)
  Schema {
    // Inherits: All parent context + Drizzle ORM
    // Generates: TypeScript types, SQL schema, migrations

    model User {
      id: string @primary
      email: string @unique
      name: string
    }
  }

  Routes {
    // Inherits: All parent context + User model types
    // Has access to: db.user, User type, PostgreSQL connection

    users {
      @data(async () => {
        // TypeScript knows about User type
        // Database connection is automatically available
        // Drizzle ORM is pre-configured
        return await db.user.findMany();
      })
      list
    }
  }

  Components {
    // Inherits: All parent context + User types + API endpoints
    // Has access to: User type, /users endpoint, React

    @params({ users: User[] })
    UserList: ({ users }) => {
      // Full type safety from database to UI
      return <div>{users.map(user => <div key={user.id}>{user.name}</div>)}</div>;
    }
  }
}
```

### Inheritance Rules

1. **Toolchain Inheritance**: Child blocks get parent's compilation tools
2. **Type Inheritance**: Types defined in parent are available to children
3. **Context Inheritance**: Documentation and AI context flow down
4. **Modifier Inheritance**: Children can override parent modifiers

### Override System

```z
@database(postgres)
next WebApp {
  // Default: PostgreSQL for all children

  UserService {
    // Inherits: PostgreSQL
    // Uses: PostgreSQL connection
  }

  @database(redis)
  CacheService {
    // Override: Uses Redis instead
    // Uses: Redis connection
  }

  @database(clickhouse)
  AnalyticsService {
    // Override: Uses ClickHouse for analytics
    // Uses: ClickHouse connection
  }
}
```

## 3. AI-Optimized Context

### The Problem

AI assistants struggle with codebases because they lack context about what code does, why it exists, and how it relates to other parts of the system. This leads to generic, unhelpful suggestions.

### The Z Solution

Z Language requires comprehensive context annotations at every level, creating a rich semantic understanding of your codebase:

```z
@doc("User authentication and session management system")
@context("Handles login/logout, JWT tokens, OAuth2 flows, password reset, 2FA")
module Auth {
  @doc("Validates JWT token and extracts user claims")
  @context("Called by middleware to protect routes; returns null for invalid tokens; handles token expiration")
  function validateToken(token: string): UserClaims | null {
    // AI knows: This is for route protection, handles JWT, returns user info
    // AI can suggest: Error handling, token refresh, logging

    try {
      return jwt.verify(token, process.env.JWT_SECRET) as UserClaims;
    } catch (error) {
      logSecurityEvent('invalid_token', { token: token.slice(0, 10) });
      return null;
    }
  }

  @doc("Generates secure JWT token for authenticated user")
  @context("Called after successful login; includes user ID, roles, permissions; expires in 24h")
  function generateToken(user: User): string {
    // AI knows: This creates tokens after login, includes user data, has expiration
    // AI can suggest: Token payload optimization, expiration strategies, security headers

    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        roles: user.roles
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }
}
```

### Context Hierarchy

Context flows through the compilation tree, creating rich semantic understanding:

```text
Application: E-commerce Platform
├── Context: "Full-stack web app with product catalog, shopping cart, payments, admin panel"
│
├── Auth Module
│   ├── Context: "JWT authentication, OAuth2, session management, user registration"
│   ├── validateToken() → "Route protection, JWT validation, security logging"
│   └── generateToken() → "Post-login token creation, user claims, expiration"
│
├── Products Module
│   ├── Context: "Product catalog, search, filtering, categories, inventory management"
│   ├── searchProducts() → "Full-text search, filters, pagination, SEO optimization"
│   └── updateInventory() → "Stock management, low-stock alerts, supplier integration"
│
└── Orders Module
    ├── Context: "Shopping cart, checkout, payments, order fulfillment, shipping"
    ├── processPayment() → "Payment processing, fraud detection, transaction logging"
    └── calculateShipping() → "Shipping cost calculation, carrier integration, delivery estimates"
```

### AI Context Benefits

1. **Intelligent Suggestions**: AI understands what your code does and suggests relevant improvements
2. **Better Error Messages**: Compiler can provide context-aware error explanations
3. **Automated Documentation**: Generate comprehensive docs from context annotations
4. **Refactoring Assistance**: AI can suggest safe refactoring based on usage context

## 4. Zero-Config Scaffolding

### The Problem

Modern development requires extensive boilerplate: project structure, build configuration, deployment setup, file organization. This setup is time-consuming and error-prone.

### The Z Solution

Z Language automatically generates all necessary files and folders based on your code structure:

```z
next BlogApp {
  Routes {
    home
    about
    products {
      [id]
    }
    admin
  }

  Schema {
    model User { ... }
    model Product { ... }
  }

  API {
    users
    products
  }
}
```

**Automatically Generates:**

```
my-app/
├── app/
│   ├── page.z              # home
│   ├── about/
│   │   └── page.z          # about
│   ├── products/
│   │   ├── page.z          # products
│   │   └── [id]/
│   │       └── page.z      # product detail
│   ├── admin/
│   │   └── page.z          # admin
│   └── api/
│       ├── users/
│       │   └── route.z     # users API
│       └── products/
│           └── route.z     # products API
├── lib/
│   ├── db/
│   │   └── schema.ts       # Generated from Schema
│   └── types/
│       └── index.ts        # Generated TypeScript types
├── migrations/
│   └── 001_initial.sql     # Database migrations
├── package.json            # Dependencies and scripts
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── drizzle.config.ts       # Drizzle ORM configuration
```

### Scaffolding Rules

1. **500-Line Limit**: Files exceeding 500 lines are automatically split
2. **Shared Code**: Common utilities go in `/shared` directory
3. **Platform Code**: Target-specific code goes in `/targets/{platform}`
4. **Convention-Based**: Follows established patterns for each platform

### Auto-Splitting Example

```z
// When UserManagement.z exceeds 500 lines:

// Original: /src/UserManagement.z (600 lines)
//
// Automatically splits into:
// /shared/types/User.z          (User interfaces and types)
// /shared/utils/validation.z    (User validation functions)
// /shared/utils/formatting.z    (User display formatting)
// /targets/nextjs/components/UserList.z     (React components)
// /targets/nextjs/pages/users.z             (Next.js pages)
```

### Smart Defaults

Z Language provides intelligent defaults based on your target:

```z
next WebApp {
  // Automatically includes:
  // - TypeScript configuration
  // - ESLint and Prettier
  // - Tailwind CSS
  // - Next.js optimizations
  // - Deployment configuration
}

@target(wasm)
rust ComputeModule {
  // Automatically includes:
  // - Cargo.toml with wasm-pack
  // - WebAssembly bindings
  // - JavaScript wrapper
  // - TypeScript definitions
}

swift MobileApp {
  // Automatically includes:
  // - Xcode project file
  // - App Store configuration
  // - SwiftUI framework
  // - iOS deployment settings
}
```

## 5. Unified Extensible Syntax

### The Problem

Different platforms require different programming paradigms. Web development uses JavaScript/TypeScript, mobile uses Swift/Kotlin, systems programming uses Rust/C++. Learning multiple syntaxes and paradigms slows development.

### The Z Solution

Z Language uses **TSX/TypeScript syntax as its foundation**, making it immediately familiar to web developers while adding powerful extensions for multi-target development:

#### TSX-Like Base with Key Extensions

```typescript
// Standard TSX/TypeScript - works as expected
function calculateTax(
  amount: number,
  rate: number
): number {
  return amount * rate;
}

class UserService {
  async findUser(
    id: string
  ): Promise<User | null> {
    return await this.db.users.findUnique(
      { where: { id } }
    );
  }
}
```

#### Key Differences from TSX/TypeScript

**1. Function Declaration - Uses `fun` instead of `function`**

```z
// Z Language
@params(id: string)
@response(User | null)
fun getUser(id) { ... }

// vs TSX/TypeScript
function getUser(id: string): Promise<User | null> { ... }
```

**2. Extended Type System - Includes Rust primitive types**

```z
// Rust-inspired types available in Z
age: u8          // unsigned 8-bit integer
price: f32       // 32-bit float
count: i64       // signed 64-bit integer
balance: decimal // high-precision decimal

// Automatic type mapping:
// Z → TypeScript: u8 → number, String → string
// Z → Rust: number → i32, string → String
```

**3. Implicit Async/Await**

```z
// Promises are automatically awaited
fun getUser(id) {
  return db.user.findUnique({ where: { id } });  // implicit await
}

// Can be controlled with annotations
@sync
fun synchronousFunction() { ... }
```

**4. Target-Specific Blocks & Workspace Organization**

```z
// Standalone applications
next WebApp {
  // React-like components with enhanced syntax
  @params({ product: Product })
  ProductCard: ({ product }) => {
    return (
      <div className="card">
        <h3>{product.name}</h3>
        <p>${product.price}</p>
      </div>
    );
  }
}

swift MobileApp {
  // SwiftUI-like views
  struct ProductCard: View {
    let product: Product

    var body: some View {
      VStack {
        Text(product.name)
        Text("$\(product.price)")
      }
    }
  }
}

// Multi-application workspaces
workspace ecommerce-platform {
  @doc("Customer-facing web application")
  next customerApp {
    Routes { shop, cart, checkout }
    Components { ProductCard, ShoppingCart }
  }

  @doc("High-performance payment processing")
  rust paymentService {
    fun processPayment(amount, method) { ... }
    fun handleRefund(transactionId) { ... }
  }

  @doc("Mobile shopping app")
  swift mobileApp {
    App { ShoppingApp }
    Components { ProductList, CartView }
  }
}
```

**Workspace Benefits:**

- **Shared Types**: All applications share the same type definitions
- **Cross-References**: Services can call each other's APIs with full type safety
- **Coordinated Building**: Build and deploy entire stack together
- **Unified Configuration**: Shared environment variables and settings

**5. Element-Based Markup System**

```z
// Single-type children (all children are routes)
Routes {
  tasks        // implicitly a route
  customers    // implicitly a route
  [slug]       // dynamic route
}

// Multi-type children (requires type keywords)
Schema(database: postgres) {
  table Product {     // 'table' keyword specifies child type
    id: string @primary
    name: string @max(100)
  }

  enum Status {       // 'enum' keyword specifies child type
    pending
    completed
  }
}
```

> **Note:** The typing system for children is defined in the **language registry**, which tells the compiler what child types are allowed and whether type keywords are required.

````

### Custom Control Structures

Z Language allows you to define custom control structures that work across platforms:

```z
// Define once, use anywhere
@attempts(3) @delay(1000)
Retry {
  await apiCall();
}

// Compiles to JavaScript:
// let attempts = 0;
// while (attempts < 3) {
//   try {
//     await apiCall();
//     break;
//   } catch (error) {
//     attempts++;
//     if (attempts < 3) await new Promise(resolve => setTimeout(resolve, 1000));
//   }
// }

// Compiles to Rust:
// for attempt in 0..3 {
//     match api_call().await {
//         Ok(result) => return Ok(result),
//         Err(e) if attempt < 2 => {
//             tokio::time::sleep(Duration::from_millis(1000)).await;
//             continue;
//         }
//         Err(e) => return Err(e),
//     }
// }
````

### DSL Blocks

Domain-specific languages for common tasks:

```z
// Infrastructure as Code
@doc("Container configuration")
Docker {
  from: "node:20"
  workdir: "/app"
  copy: ["package*.json", "./"]
  run: "npm install"
  copy: [".", "."]
  expose: 3000
  cmd: ["npm", "start"]
}

// Database Schema
Schema {
  table User {
    id: string @primary @default(uuid())
    email: string @unique @length(max: 255)
    name: string @length(max: 100)
    createdAt: datetime @default(now())

    // Relationships
    posts: Post[] @relation("UserPosts")
    profile: Profile? @relation("UserProfile")
  }
}

// API Routes
API {
  users {
    @auth(required)
    @params({ page: number, limit: number })
    @response({ users: User[], total: number })
    @handler(listUsers)
    get

    @auth(required)
    @body(CreateUserRequest)
    @response(User)
    @handler(createUser)
    post
  }
}
```

## Principle Integration

These five principles work together to create a unified development experience:

1. **Target-First** tells the compiler where your code is going
2. **Inheritance** ensures consistency across all layers
3. **AI Context** provides rich semantic understanding
4. **Zero-Config** eliminates boilerplate and setup
5. **Unified Syntax** allows one language for all platforms

The result is a development experience where you:

- Write less code
- Make fewer mistakes
- Deploy faster
- Maintain consistency
- Get better AI assistance

This foundation enables Z Language to be truly "the last language you'll need."
