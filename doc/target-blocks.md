# Z Language Target Blocks

Target blocks are the fundamental building blocks of Z Language, defining where your code will be compiled and deployed. Each target block provides a specific compilation context with its own set of tools, libraries, and conventions.

## Available Target Blocks

### NextJS Block

**Purpose**: Full-stack web applications with React and TypeScript
**Output**: Complete Next.js application with pages, API routes, and components

#### Basic Usage

```z
@doc("E-commerce web application")
@database(postgres)
next ECommerceApp {
  Routes {
    home
    products {
      [id]
    }
    cart
  }

  @orm(drizzle)
  Schema {
    model Product {
      id: string @primary
      name: string
      price: number
    }
  }
}
```

#### Features

- **App Router**: Next.js 13+ app directory structure
- **TypeScript**: Full TypeScript support with strict type checking
- **Tailwind CSS**: Utility-first CSS framework integration
- **API Routes**: Type-safe API endpoints
- **Database Integration**: Automatic ORM setup and configuration
- **Authentication**: Built-in auth providers (NextAuth.js)
- **Deployment**: Vercel, Netlify, and Docker support

#### Generated Structure

```
my-app/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── products/
│   │   └── page.tsx
│   └── api/
│       └── products/
│           └── route.ts
├── components/
│   ├── ui/
│   └── layout/
├── lib/
│   ├── db/
│   └── auth/
└── styles/
    └── globals.css
```

#### Modifiers

- `@database(postgres|mysql|sqlite)`: Database type
- `@orm(drizzle|prisma)`: ORM preference
- `@auth(nextauth|auth0|supabase)`: Authentication provider
- `@css(tailwind|styled-components|emotion)`: CSS solution
- `@deployment(vercel|netlify|docker)`: Deployment target

### Rust Block

**Purpose**: High-performance systems programming and WebAssembly
**Output**: Rust source code, Cargo configuration, and optional WASM bindings

#### Basic Usage

```z
@doc("High-performance calculations")
@context("CPU-intensive computations for web frontend")
@target(wasm)
rust CalculationModule {
  pub struct Calculator {
    precision: u32,
  }

  impl Calculator {
    pub fn new(precision: u32) -> Self {
      Self { precision }
    }

    pub fn fibonacci(&self, n: u32) -> u64 {
      // Implementation
    }
  }

  @export
  pub fn calculate_fibonacci(n: u32) -> u64 {
    let calc = Calculator::new(10);
    calc.fibonacci(n)
  }
}
```

#### Features

- **WebAssembly**: Compile to WASM for web integration
- **Native Binary**: Compile to native executables
- **Memory Safety**: Rust's ownership system
- **Performance**: Zero-cost abstractions
- **Concurrency**: Async/await and thread safety
- **Package Management**: Cargo integration

#### Generated Structure

```
my-rust-lib/
├── Cargo.toml
├── src/
│   ├── lib.rs
│   └── main.rs
├── pkg/                  # WASM output
│   ├── my_rust_lib.js
│   └── my_rust_lib.wasm
└── bindings/
    └── typescript/
        └── index.d.ts
```

#### Modifiers

- `@target(wasm|native|both)`: Compilation target
- `@optimize(size|speed)`: Optimization preference
- `@async(tokio|async-std)`: Async runtime
- `@serialization(serde|bincode)`: Serialization library

### SwiftUI Block

**Purpose**: Native iOS and macOS applications
**Output**: Swift source code and Xcode project configuration

#### Basic Usage

```z
@doc("Task management app")
@context("iOS app for personal productivity")
swift TaskApp {
  struct ContentView: View {
    @State private var tasks: [Task] = []

    var body: some View {
      NavigationView {
        List(tasks) { task in
          TaskRow(task: task)
        }
        .navigationTitle("Tasks")
      }
    }
  }

  struct Task: Identifiable {
    let id = UUID()
    var title: String
    var isCompleted: Bool
  }
}
```

#### Features

- **Native Performance**: Compiled Swift code
- **SwiftUI**: Modern declarative UI framework
- **Core Data**: Built-in data persistence
- **CloudKit**: iCloud synchronization
- **App Store**: Ready for App Store submission
- **Platform Integration**: Deep iOS/macOS integration

#### Generated Structure

```
MyApp/
├── MyApp.xcodeproj/
├── MyApp/
│   ├── ContentView.swift
│   ├── Models/
│   │   └── Task.swift
│   └── Views/
│       └── TaskRow.swift
└── MyApp/
    └── Info.plist
```

#### Modifiers

- `@platform(ios|macos|both)`: Target platform
- `@deployment(15.0|16.0|17.0)`: Minimum OS version
- `@data(coredata|swiftdata)`: Data persistence
- `@cloud(cloudkit|none)`: Cloud synchronization

### React Native Block

**Purpose**: Cross-platform mobile applications
**Output**: React Native project with platform-specific code

#### Basic Usage

```z
@doc("Mobile social app")
@context("Cross-platform social media application")
ReactNative {
  Components {
    @params({ posts: Post[] })
    HomeScreen: ({ posts }) => {
      const [postsState, setPosts] = useState(posts);

      return (
        <SafeAreaView>
          <FlatList
            data={postsState}
            renderItem={({ item }) => <PostCard post={item} />}
          />
        </SafeAreaView>
      );
    }
  }

  Navigation {
    Stack {
      @screen("Home", HomeScreen)
      home

      @screen("Profile", ProfileScreen)
      profile
    }
  }
}
```

#### Features

- **Cross-Platform**: iOS and Android from single codebase
- **Native Performance**: Native components and APIs
- **Hot Reload**: Fast development cycle
- **React**: Familiar React development model
- **TypeScript**: Full TypeScript support
- **Navigation**: Built-in navigation system

#### Generated Structure

```
MyMobileApp/
├── App.tsx
├── src/
│   ├── screens/
│   ├── components/
│   └── navigation/
├── ios/
│   └── MyMobileApp.xcodeproj/
└── android/
    └── app/
        └── build.gradle
```

#### Modifiers

- `@platform(ios|android|both)`: Target platforms
- `@navigation(stack|tab|drawer)`: Navigation type
- `@state(redux|zustand|context)`: State management
- `@native(expo|bare)`: Development workflow

### Lib Block

**Purpose**: Cross-platform libraries and utilities
**Output**: Multiple target implementations with consistent API

#### Basic Usage

```z
@doc("Utility functions")
@context("Common utilities used across all platforms")
@targets([js, rust, python, swift])
Lib {
  @doc("Formats currency values with proper locale")
  function formatMoney(amount: number, currency: string = "USD"): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  @doc("Validates email addresses")
  function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
```

#### Features

- **Multi-Target**: Single source, multiple outputs
- **Consistent API**: Same interface across platforms
- **Platform Optimization**: Target-specific optimizations
- **Package Publishing**: Automatic package configuration
- **Type Definitions**: Generated type definitions for all targets

#### Generated Structure

```
my-lib/
├── dist/
│   ├── js/
│   │   ├── index.js
│   │   └── index.d.ts
│   ├── rust/
│   │   └── src/lib.rs
│   ├── python/
│   │   └── __init__.py
│   └── swift/
│       └── MyLib.swift
└── package.json
```

#### Modifiers

- `@targets([js, rust, python, swift])`: Target platforms
- `@package(npm|cargo|pypi|spm)`: Package registries
- `@testing(jest|pytest|cargo)`: Testing frameworks

### API Block

**Purpose**: RESTful APIs and GraphQL endpoints
**Output**: API server with routes, middleware, and documentation

#### Basic Usage

```z
@doc("Blog API server")
@context("RESTful API for blog management")
API {
  posts {
    @doc("List all posts")
    @params({ page?: number, limit?: number })
    @response({ posts: Post[], total: number })
    @handler(async ({ page = 1, limit = 10 }) => {
      return await db.post.findMany({
        skip: (page - 1) * limit,
        take: limit
      });
    })
    get

    @doc("Create new post")
    @auth(required)
    @body({ title: string, content: string })
    @response(Post)
    @handler(async ({ title, content }) => {
      return await db.post.create({
        data: { title, content }
      });
    })
    post
  }
}
```

#### Features

- **REST APIs**: Full RESTful API generation
- **GraphQL**: Optional GraphQL endpoint
- **Authentication**: Built-in auth middleware
- **Validation**: Request/response validation
- **Documentation**: Auto-generated API docs
- **Testing**: Automatic test generation

#### Generated Structure

```
my-api/
├── src/
│   ├── routes/
│   │   └── posts.ts
│   ├── middleware/
│   │   └── auth.ts
│   └── server.ts
├── docs/
│   └── openapi.json
└── tests/
    └── api.test.ts
```

#### Modifiers

- `@runtime(node|deno|bun)`: JavaScript runtime
- `@auth(jwt|oauth2|apikey)`: Authentication method
- `@docs(openapi|graphql)`: Documentation format
- `@testing(jest|vitest|deno)`: Testing framework

### Schema Block

**Purpose**: Database schema definition and ORM generation
**Output**: Database schema, migrations, and ORM code

#### Basic Usage

```z
@doc("Blog database schema")
@orm(drizzle) @database(postgres)
Schema {
  model User {
    id: string @primary @default(uuid())
    email: string @unique
    name: string
    createdAt: datetime @default(now())

    posts: Post[] @relation("UserPosts")
  }

  model Post {
    id: string @primary @default(uuid())
    title: string @max(200)
    content: text
    published: boolean @default(false)
    authorId: string

    author: User @relation("UserPosts", fields: [authorId], references: [id])
  }
}
```

#### Features

- **Multiple ORMs**: Drizzle, Prisma, TypeORM support
- **Database Types**: PostgreSQL, MySQL, SQLite
- **Migrations**: Automatic migration generation
- **Type Safety**: Full TypeScript type generation
- **Relationships**: Foreign keys and joins
- **Validation**: Schema validation rules

#### Generated Structure

```
database/
├── schema.ts
├── migrations/
│   ├── 001_initial.sql
│   └── 002_add_posts.sql
├── types/
│   └── index.ts
└── queries/
    └── generated.ts
```

#### Modifiers

- `@orm(drizzle|prisma|typeorm)`: ORM preference
- `@database(postgres|mysql|sqlite)`: Database type
- `@migrations(auto|manual)`: Migration strategy
- `@validation(zod|yup|joi)`: Validation library

### Docker Block

**Purpose**: Container configuration and deployment
**Output**: Dockerfile, docker-compose, and deployment scripts

#### Basic Usage

```z
@doc("Application containerization")
@context("Docker configuration for production deployment")
Docker {
  services {
    app: {
      from: "node:18-alpine"
      workdir: "/app"
      copy: ["package*.json", "./"]
      run: "npm install --production"
      copy: [".", "."]
      expose: 3000
      cmd: ["npm", "start"]
    }

    database: {
      from: "postgres:15"
      environment: {
        POSTGRES_DB: "myapp"
        POSTGRES_USER: "user"
        POSTGRES_PASSWORD: "password"
      }
      volumes: ["postgres_data:/var/lib/postgresql/data"]
    }
  }
}
```

#### Features

- **Multi-Service**: Docker Compose support
- **Environment Variables**: Secure configuration
- **Volume Management**: Persistent data storage
- **Networking**: Service communication
- **Production Ready**: Optimized for deployment

#### Generated Structure

```
docker/
├── Dockerfile
├── docker-compose.yml
├── docker-compose.prod.yml
└── scripts/
    ├── build.sh
    └── deploy.sh
```

#### Modifiers

- `@environment(development|production)`: Target environment
- `@registry(dockerhub|ghcr|private)`: Container registry
- `@orchestration(compose|kubernetes)`: Orchestration platform

## Block Composition

### Nested Blocks

Blocks can be nested to create hierarchical compilation contexts:

```z
@database(postgres)
next WebApp {
  // Parent context: Next.js + PostgreSQL

  @orm(drizzle)
  Schema {
    // Inherits: Next.js + PostgreSQL + Drizzle
    model User { ... }
  }

  API {
    // Inherits: Next.js + PostgreSQL + User model
    users {
      @handler(listUsers)
      get
    }
  }

  Routes {
    // Inherits: Next.js + PostgreSQL + User model + API routes
    users
  }
}
```

### Block Inheritance

Child blocks inherit parent context and can override modifiers:

```z
@database(postgres)
next WebApp {
  // Default: PostgreSQL for all children

  UserService {
    // Inherits: PostgreSQL
  }

  @database(redis)
  CacheService {
    // Override: Uses Redis instead
  }

  @database(clickhouse)
  AnalyticsService {
    // Override: Uses ClickHouse
  }
}
```

### Cross-Block References

Blocks can reference types and functions from other blocks:

```z
// Shared library
@doc("Common utilities")
@targets([all])
Lib {
  function formatDate(date: Date): string { ... }
  interface User { ... }
}

// Web application
next WebApp {
  import { formatDate, User } from "../lib";

  Components {
    @params({ user: User })
    UserProfile: ({ user }) => {
      return <div>{formatDate(user.createdAt)}</div>;
    }
  }
}

// Mobile application
swift MobileApp {
  import { User } from "../lib";

  struct UserProfile: View {
    let user: User
    // Uses shared User type
  }
}
```

## Best Practices

### 1. Target Selection

Choose the right target for your needs:

- **NextJS**: Full-stack web applications
- **Rust**: High-performance computing, WebAssembly
- **SwiftUI**: Native iOS/macOS applications
- **React Native**: Cross-platform mobile apps
- **API**: Backend services and APIs
- **Lib**: Shared utilities and libraries

### 2. Block Organization

Structure blocks logically:

```z
// Good: Logical hierarchy
next WebApp {
  Schema { ... }      // Database first
  API { ... }         // API uses database
  Routes { ... }      // Routes use API
  Components { ... }  // Components use routes
}

// Avoid: Circular dependencies
next WebApp {
  Routes { ... }      // Routes defined first
  API { ... }         // API tries to use routes
  Schema { ... }      // Database defined last
}
```

### 3. Modifier Usage

Use modifiers to customize behavior:

```z
// Development configuration
@database(sqlite) @env(development)
next WebApp {
  // Fast local development
}

// Production configuration
@database(postgres) @env(production)
next WebApp {
  // Scalable production setup
}
```

### 4. Documentation

Always include comprehensive documentation:

```z
@doc("User authentication system")
@context("Handles registration, login, password reset, and session management")
next AuthApp {
  @doc("User registration endpoint")
  @context("Creates new user account with email verification")
  API {
    auth {
      register {
        // Implementation
      }
    }
  }
}
```

## Advanced Features

### Conditional Compilation

Use conditions to include/exclude code:

```z
next WebApp {
  @if(env.NODE_ENV === 'development')
  DevTools { ... }

  @if(features.includes('analytics'))
  Analytics { ... }
}
```

### Custom Targets

Define custom compilation targets:

```z
plugin MyFrameworkCompiler {
  target: "myframework"
  extends: "javascript"

  compile(block: Block): GeneratedFiles {
    // Custom compilation logic
  }
}

// Usage
MyFramework {
  // Custom target block
}
```

### Performance Optimization

Optimize for specific targets:

```z
@optimize(speed)
rust ComputeModule {
  // Optimized for performance
}

@optimize(size)
rust ComputeModule {
  // Optimized for binary size
}
```

## Migration Guide

### From Traditional Development

**Before (Traditional):**

```typescript
// Multiple configuration files
// package.json, tsconfig.json, next.config.js, etc.

// Separate schema definition
// schema.prisma

// Manual API routes
// pages/api/users.ts

// Component files
// components/UserList.tsx
```

**After (Z Language):**

```z
@database(postgres)
next WebApp {
  @orm(prisma)
  Schema {
    model User { ... }
  }

  API {
    users {
      @handler(listUsers)
      get
    }
  }

  Components {
    @params({ users: User[] })
    UserList: ({ users }) => { ... }
  }
}
```

### Incremental Adoption

Start with a single target and gradually add more:

```z
// Step 1: Start with API
API {
  users {
    @handler(listUsers)
    get
  }
}

// Step 2: Add database
next WebApp {
  Schema { ... }
  API { ... }
}

// Step 3: Add frontend
next WebApp {
  Schema { ... }
  API { ... }
  Routes { ... }
  Components { ... }
}
```

## Troubleshooting

### Common Issues

1. **Target Not Found**

   ```
   Error: Target 'xamarin' not found
   Solution: Use available targets or install custom target plugin
   ```

2. **Inheritance Conflicts**

   ```
   Error: Child block database modifier conflicts with parent
   Solution: Use explicit override or remove conflicting modifier
   ```

3. **Missing Dependencies**
   ```
   Error: NextJS compilation failed: Missing required dependency
   Solution: Run `z install` or check package.json
   ```

### Debug Commands

```bash
# Check available targets
z targets list

# Validate block structure
z validate src/app.z

# Debug compilation
z build --debug --verbose

# Check inheritance chain
z analyze --inheritance src/app.z
```

---

Target blocks are the foundation of Z Language's power, providing a unified way to target any platform while maintaining consistency and type safety across your entire application stack.
