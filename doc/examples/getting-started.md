# Getting Started with Z Language

Welcome to Z Language! This guide will walk you through creating your first Z Language project and understanding the core concepts.

## What We'll Build

In this tutorial, we'll create a simple blog application with:

- **Frontend**: Next.js web app with React components
- **Backend**: API routes for blog posts
- **Database**: PostgreSQL with Drizzle ORM
- **Types**: Full TypeScript type safety from database to UI

All from a single Z Language file!

## Prerequisites

- Basic knowledge of JavaScript/TypeScript
- Node.js 18+ installed
- PostgreSQL database (or Docker)

## Installation

```bash
# Install Z Language CLI (coming soon)
npm install -g z-lang

# Verify installation
z --version
```

## Your First Z Project

### Step 1: Create Project Structure

```bash
# Create new project
z create my-blog --template=minimal

# Navigate to project
cd my-blog
```

### Step 2: Write Your First Z Code

Create `src/blog.z`:

```z
@doc("Simple blog application")
@context("Full-stack blog with posts, comments, and admin interface")
@database(postgres)
next BlogApp {

  @doc("Database schema for blog application")
  @orm(drizzle)
  Schema {
    model Post {
      id: string @primary @default(uuid())
      title: string @max(200)
      content: text
      published: boolean @default(false)
      createdAt: datetime @default(now())
      updatedAt: datetime @updatedAt

      // Relationships
      comments: Comment[] @relation("PostComments")
    }

    model Comment {
      id: string @primary @default(uuid())
      content: text @max(1000)
      author: string @max(100)
      postId: string
      createdAt: datetime @default(now())

      // Relationships
      post: Post @relation("PostComments", fields: [postId], references: [id])
    }
  }

  @doc("API routes for blog operations")
  API {
    @doc("Blog posts API")
    posts   // handlers live in `app/api/posts/posts.z`
  }

  @doc("Frontend routes and pages")
  Routes {
    @doc("Homepage route")
    home   // lives in app/routes/home.z

    posts {
      [id] {
        @doc("Post detail route")
        detail   // lives in app/routes/posts/[id]/detail.z
      }
    }

    admin {
      @doc("Admin dashboard route")
      dashboard   // lives in app/routes/admin/dashboard.z
    }
  }

  @doc("React components for the blog")
  Components {
    @doc("Homepage component")
    HomePage   // defined in components/HomePage/HomePage.z

    @doc("Post page component")
    PostPage   // defined in components/PostPage/PostPage.z

    @doc("Admin dashboard component")
    AdminDashboard   // defined in components/AdminDashboard/AdminDashboard.z
  }
}
```

### Step 3: Compile Your Z Code

```bash
# Compile to Next.js
z build --target=nextjs

# This generates:
# - Next.js application structure
# - TypeScript types
# - Database schema
# - API routes
# - React components
```

### Step 4: Run Your Application

```bash
# Install dependencies
npm install

# Set up database
npm run db:migrate

# Start development server
npm run dev
```

Open `http://localhost:3000` to see your blog!

## Understanding the Generated Code

Let's examine what Z Language generated from our single file:

### Generated File Structure

```
my-blog/
├── app/
│   ├── routes/
│   │   ├── home.z                    # Route definition for `/`
│   │   ├── posts/
│   │   │   └── [id]/detail.z         # Route definition for `/posts/[id]`
│   │   └── admin/
│   │       └── dashboard.z           # Route definition for `/admin`
│   └── api/
│       └── posts/
│           ├── posts.z               # GET /api/posts, POST /api/posts
│           └── [id]/
│               └── posts.z           # GET /api/posts/[id]
├── components/
│   ├── HomePage/
│   │   └── HomePage.z
│   ├── PostPage/
│   │   └── PostPage.z
│   └── AdminDashboard/
│       └── AdminDashboard.z
├── lib/
│   ├── db/
│   │   ├── schema.ts         # Drizzle schema
│   │   └── index.ts          # Database connection
│   └── types/
│       └── index.ts          # TypeScript types
├── migrations/
│   └── 0000_initial.sql      # Database migration
└── package.json              # Dependencies and scripts
```

### Generated TypeScript Types

```typescript
// lib/types/index.ts (generated)
export interface Post {
  id: string;
  title: string;
  content: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  comments: Comment[];
}

export interface Comment {
  id: string;
  content: string;
  author: string;
  postId: string;
  createdAt: Date;
  post: Post;
}
```

### Generated Database Schema

```typescript
// lib/db/schema.ts (generated)
import {
  pgTable,
  text,
  boolean,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const posts = pgTable("posts", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: varchar("title", {
    length: 200,
  }).notNull(),
  content: text("content").notNull(),
  published: boolean(
    "published"
  ).default(false),
  createdAt: timestamp(
    "created_at"
  ).defaultNow(),
  updatedAt: timestamp(
    "updated_at"
  ).defaultNow(),
});

export const comments = pgTable(
  "comments",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    content: varchar("content", {
      length: 1000,
    }).notNull(),
    author: varchar("author", {
      length: 100,
    }).notNull(),
    postId: text("post_id").references(
      () => posts.id
    ),
    createdAt: timestamp(
      "created_at"
    ).defaultNow(),
  }
);
```

## Key Concepts Explained

### 1. Target-First Development

Notice how we started with `NextJS` - this told the compiler:

- Use TypeScript
- Generate Next.js application structure
- Include React components
- Set up API routes

### 2. Inheritance in Action

The `Schema` block inherited the Next.js context:

- Generated TypeScript types automatically
- Created Drizzle ORM schema
- Set up database connections

### 3. AI Context Annotations

Every function has `@doc` and `@context` annotations:

- `@doc`: Human-readable description
- `@context`: AI-specific context about usage and purpose

### 4. Zero-Config Setup

From our single Z file, we got:

- Complete project structure
- Build configuration
- Type definitions
- Database setup
- Development scripts

## Next Steps

### Add More Features

Try extending your blog with:

```z
// Add user authentication
@provider(jwt)
Auth {
  model User {
    id: string @primary
    email: string @unique
    name: string
  }
}

// Add file uploads
@provider(s3)
Storage {
  bucket: "blog-images"
  allowedTypes: ["image/jpeg", "image/png"]
}

// Add search functionality
@provider(elasticsearch)
Search {
  index: "blog_posts"
  fields: ["title", "content"]
}
```

### Deploy Your Blog

```bash
# Build for production
z build --target=nextjs --env=production

# Deploy to Vercel
npm run deploy
```

### Cross-Platform Development

Create mobile and desktop versions:

```z
// Mobile app
@doc("iOS blog reader")
swift BlogReaderApp {
  // Share the same data models
  // Generate native iOS app
}

// Desktop app
@doc("Desktop blog editor")
Electron {
  // Share the same components
  // Generate Electron app
}
```

## Common Patterns

### 1. Error Handling

```z
// app/api/posts/posts.z

type PostsQuery {
  page?: number
  limit?: number
}

GET({ page = 1, limit = 10 }: PostsQuery) {
  try {
    const posts = await db.post.findMany({
      where: { published: true },
      skip: (page - 1) * limit,
      take: limit,
    })

    return { posts, total: posts.length }
  } catch (error) {
    throw new ApiError(500, 'Failed to fetch posts')
  }
}
```

### 2. Validation

```z
// app/api/posts/posts.z

type NewPostBody {
  title: string @min(1) @max(200)
  content: string @min(10)
  published?: boolean @default(false)
}

POST(body: NewPostBody) {
  // Validation is automatically handled
  return await db.post.create({
    data: body
  })
}
```

### 3. Middleware

```z
@middleware([auth, logging, cors])
Routes {
  admin
  api {
    admin {
      "*"
    }
  }
}
```

### 4. Component Example (HomePage)

The snippet below shows how to write a functional React-style component in Z. It returns a `Section` that uses the new markup DSL forms described earlier:

```z
import Post from some_file
@params {
  posts: Post[]
}
component HomePage(posts) {
  return Section(class: "container mx-auto px-4 py-8") {
    // 1️⃣  Property-only element
    H1 { text: "My Blog" }

    // 3️⃣  Element with props *and* children
    Grid(class: "gap-6") {
      // 2️⃣  Child elements generated in a loop
      @params Post
      posts.map(post) {
        Article(class: "bg-white rounded-lg shadow-md p-6") {
          H2 {
            Link(href: `/posts/${post.id}`, class: "text-blue-600 hover:underline") {
              text: post.title
            }
          }

          P { text: `${post.content.substring(0, 200)}...` }

          Flex(class: "justify-between items-center text-sm text-gray-500") {
            Span { text: `Published ${formatDate(post.createdAt)}` }
            Span { text: `${post.comments.length} comments` }
          }
        }
      }
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**

   ```bash
   # Check your database connection
   z db:status

   # Reset database
   z db:reset
   ```

2. **Type Errors**

   ```bash
   # Regenerate types
   z generate:types
   ```

3. **Build Errors**
   ```bash
   # Clean build cache
   z clean
   z build
   ```

### Getting Help

- **Documentation**: [Z Language Docs](./README.md)
- **Examples**: [More Examples](../examples/)
- **Community**: [Discord Server](https://discord.gg/z-language) (Coming Soon)
- **Issues**: [GitHub Issues](https://github.com/z-lang/z/issues) (Coming Soon)

## What's Next?

You've successfully created your first Z Language application! You learned:

- ✅ Target-first development with `next` blocks
- ✅ Database modeling with `Schema`
- ✅ API creation with type-safe handlers
- ✅ Component development with inherited context
- ✅ AI-optimized documentation with `@doc` and `@context`

Continue learning with:

- [Advanced Examples](./advanced-examples.md)
- [Cross-Platform Development](./cross-platform.md)
- [Performance Optimization](./performance.md)
- [Deployment Guide](./deployment.md)

Welcome to the future of programming with Z Language! 🚀
