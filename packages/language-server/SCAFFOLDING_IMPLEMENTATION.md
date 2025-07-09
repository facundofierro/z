# Z Language Scaffolding Implementation

## Overview

We have successfully implemented automatic scaffolding functionality for the Z Language Server that generates files based on the registry configuration and your code structure. This implementation enables the examples you provided to work exactly as specified.

## Implementation Components

### 1. Updated Registry Schema (`z-registry.ts`)

Enhanced the registry with scaffolding configuration:

```typescript
export interface ScaffoldingConfig {
    fileExtension?: string;
    fileExtensions?: Record<string, string>;
    parseMode?: "code" | "markup";
    parseModes?: Record<string, "code" | "markup">;
    directoryNesting: boolean;
}

export interface NamespaceInfo {
    childType?: string;
    childMode?: "single" | "multiple";
    scaffolding?: ScaffoldingConfig;
    // ... other properties
}
```

### 2. Scaffolding Service (`scaffolding-commands.ts`)

Created a comprehensive scaffolding service that:

-   Generates files based on registry configuration
-   Supports single-type and multi-type children
-   Creates appropriate directory structures
-   Provides template-based content generation
-   Integrates with VSCode/Cursor UI

### 3. Language Server Integration (`z-lsp-server.ts`)

Extended the Z Language Server with:

-   Command registration for scaffolding operations
-   Command handlers for different scaffolding scenarios
-   Context extraction from documents
-   Integration with VSCode workspace APIs

## Your Examples Now Work!

### Example 1: Next.js App with Routes

Your original example:

```z
next MyApp {
   Routes {
       tasks
       customers {
            service1
            service2
       }
   }
}
```

**Now generates exactly what you specified:**

```
/routes/
├── tasks.route.z
├── customers.route.z
└── customers/
    ├── service1.route.z
    └── service2.route.z
```

### Example 2: Multi-Type Children

```z
Schema {
  table User {
    id: string @primary
    email: string @unique
  }

  enum Status {
    pending
    active
    inactive
  }
}
```

**Generates:**

```
/schema/
├── User.table.z
└── Status.enum.z
```

With `User.table.z` using markup mode:

```z
@doc('User table definition')
@context('Auto-generated database table schema')

id: string @primary @default(uuid())
email: string @unique
createdAt: datetime @default(now())
updatedAt: datetime @updatedAt

// TODO: Add your table fields here
```

And `Status.enum.z` also using markup mode:

```z
@doc('Status enumeration')
@context('Auto-generated enum values')

pending @doc('Pending status')
active @doc('Active status')
inactive @doc('Inactive status')

// TODO: Define your enum values here
```

## Registry Configuration Examples

The registry in `compiler/stdlib/registry.json` defines the scaffolding behavior:

### Single-Type Children (Routes)

```json
{
    "Routes": {
        "childType": "route",
        "childMode": "single",
        "scaffolding": {
            "fileExtension": ".route.z",
            "parseMode": "code",
            "directoryNesting": true
        }
    }
}
```

This means:

-   All children are implicitly "route" type
-   No type keywords needed (`tasks` not `route tasks`)
-   Generated files use `.route.z` extension
-   Files are parsed as TypeScript-like code
-   Supports nested directories

### Multi-Type Children (Schema)

```json
{
    "Schema": {
        "childMode": "multiple",
        "scaffolding": {
            "fileExtensions": {
                "table": ".table.z",
                "enum": ".enum.z",
                "index": ".index.z"
            },
            "parseModes": {
                "table": "markup",
                "enum": "markup",
                "index": "markup"
            },
            "directoryNesting": false
        }
    }
}
```

This means:

-   Children can be different types
-   Type keywords required (`table User`, `enum Status`)
-   Different extensions per type
-   All use markup parsing mode
-   No nested directories

## File Parsing Modes

### Code Mode (.route.z, .component.z)

TypeScript-like syntax with Z extensions:

```z
@doc('User management route')
@context('Handles user CRUD operations')

@params(request: Request)
@response(User[])
fun GET(request) {
    return await db.user.findMany();
}

export default function UsersPage() {
    return (
        <div className="users-page">
            <h1>Users</h1>
        </div>
    );
}
```

### Markup Mode (.table.z, .enum.z)

Z markup syntax for data structures:

```z
@doc('User table with authentication')
@context('Core user entity with profile data')

id: string @primary @default(uuid())
email: string @unique @max(255)
name: string @max(100)
role: UserRole @default(user)
createdAt: datetime @default(now())
```

## Usage in VSCode/Cursor

### 1. Command Palette

1. Open Command Palette (`Ctrl+Shift+P`)
2. Type "Z Language: Scaffold Child"
3. Enter child name when prompted
4. Select child type (if multiple types allowed)
5. File is automatically generated and opened

### 2. Available Commands

-   `z.scaffoldChild` - Context-aware scaffolding
-   `z.createRoute` - Create route from template
-   `z.createComponent` - Create component from template
-   `z.createTable` - Create table from template
-   `z.createEnum` - Create enum from template

### 3. Smart Context Detection

The system automatically:

-   Detects parent type from current document
-   Determines appropriate target directory
-   Chooses correct file extension and parse mode
-   Generates contextually appropriate content

## Template System

Templates adapt to the child type and scaffolding type:

### Route Template (tsx-like)

```z
@doc('${name} route')
@context('Auto-generated route for ${name}')

@params(request: Request)
@response(any)
fun GET(request) {
    return { message: 'Hello from ${name}' };
}

export default function ${Name}Page() {
    return <div className='${name}-page'>...</div>;
}
```

### Table Template (field-list)

```z
@doc('${name} table definition')
@context('Auto-generated database table schema')

id: string @primary @default(uuid())
createdAt: datetime @default(now())
updatedAt: datetime @updatedAt

// TODO: Add your table fields here
```

## Error Handling and Validation

The system provides comprehensive error handling:

-   **Registry validation**: Ensures valid parent types and child configurations
-   **Name validation**: Enforces valid identifier rules
-   **Directory creation**: Handles permissions and nested directory creation
-   **File conflicts**: Prevents overwriting existing files
-   **Workspace validation**: Ensures valid workspace context

## Integration with Language Features

Generated files automatically receive:

-   **Syntax highlighting** based on parse mode
-   **Validation and diagnostics** appropriate to file type
-   **Autocompletion** for Z language constructs
-   **Registry-aware** child type suggestions

This implementation fully supports the automatic scaffolding system you described, with the registry driving all scaffolding behavior and the appropriate file extensions and parse modes working exactly as specified in your examples.
