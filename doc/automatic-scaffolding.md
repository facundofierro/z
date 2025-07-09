# Z Language Automatic Scaffolding System

## Overview

Z Language's automatic scaffolding system generates files and directory structures based on your code blocks and the language registry configuration. This eliminates the need for manual file management and ensures consistent project organization.

## Registry-Driven Scaffolding

### Child Mode Types

The registry defines two types of child modes:

#### 1. Single-Type Children (`childMode: "single"`)

All children are implicitly the same type. No type keywords required.

**Registry Configuration:**

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

**Code Example:**

```z
next MyApp {
  Routes {
    tasks        // → tasks.route.z (implicitly a route)
    customers {  // → customers.route.z + customers/ directory
      service1   // → customers/service1.route.z
      service2   // → customers/service2.route.z
    }
    admin {
      users {
        [id]     // → admin/users/[id].route.z
      }
    }
  }
}
```

**Generated Structure:**

```
/app/routes/
├── tasks.route.z
├── customers.route.z
├── customers/
│   ├── service1.route.z
│   └── service2.route.z
├── admin.route.z
└── admin/
    ├── users.route.z
    └── users/
        └── [id].route.z
```

#### 2. Multi-Type Children (`childMode: "multiple"`)

Children can be different types. Type keywords are required.

**Registry Configuration:**

```json
{
  "Schema": {
    "childMode": "multiple",
    "allowedChildren": [
      "table",
      "model",
      "enum",
      "index",
      "type"
    ],
    "scaffolding": {
      "fileExtensions": {
        "table": ".table.z",
        "model": ".model.z",
        "enum": ".enum.z",
        "index": ".index.z",
        "type": ".type.z"
      },
      "parseModes": {
        "table": "markup",
        "model": "markup",
        "enum": "markup",
        "index": "markup",
        "type": "code"
      },
      "directoryNesting": false
    }
  }
}
```

**Code Example:**

```z
Schema {
  table User {      // → User.table.z
    id: string @primary
    email: string @unique
  }

  enum Status {     // → Status.enum.z
    pending
    active
    inactive
  }

  index UserEmail { // → UserEmail.index.z
    fields: ["email"]
    unique: true
  }

  type UserProfile { // → UserProfile.type.z
    interface UserProfile {
      bio: string
      avatar: string
    }
  }
}
```

**Generated Structure:**

```
/schema/
├── User.table.z
├── Status.enum.z
├── UserEmail.index.z
└── UserProfile.type.z
```

## Parse Mode Examples

### Code Mode Files

Files with `parseMode: "code"` use TypeScript-like syntax:

#### Route Files (.route.z)

```z
// tasks.route.z
@doc("Task management route")
@context("Handles CRUD operations for tasks")

@params(request: Request)
@response(Task[])
fun GET(request) {
  const { completed = false } = request.query;
  return await db.task.findMany({
    where: { completed }
  });
}

@params(request: Request)
@response(Task)
fun POST(request) {
  const data = await request.json();
  return await db.task.create({ data });
}

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);

  return (
    <div className="tasks-page">
      <h1>Tasks</h1>
      <TaskList tasks={tasks} />
    </div>
  );
}
```

#### Component Files (.component.z)

```z
// TaskCard.component.z
@doc("Individual task card component")
@context("Displays task information with edit/delete actions")

@params({ task: Task, onUpdate: (task: Task) => void })
export default function TaskCard({ task, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return <TaskEditForm task={task} onSave={onUpdate} />;
  }

  return (
    <div className="task-card">
      <h3>{task.title}</h3>
      <p>{task.description}</p>
      <Button onClick={() => setIsEditing(true)}>
        Edit
      </Button>
    </div>
  );
}
```

#### Service Files (.service.z)

```z
// TaskService.service.z
@doc("Task management service")
@context("Business logic for task operations, validation, and notifications")

class TaskService {
  @params(data: CreateTaskInput)
  @response(Task)
  async createTask(data) {
    // Validate input
    if (!data.title || data.title.length < 3) {
      throw new Error('Title must be at least 3 characters');
    }

    // Create task
    const task = await db.task.create({
      data: {
        ...data,
        id: generateUUID(),
        createdAt: new Date()
      }
    });

    // Send notification
    await NotificationService.sendTaskCreated(task);

    return task;
  }

  @params(id: string, updates: UpdateTaskInput)
  @response(Task)
  async updateTask(id, updates) {
    const task = await db.task.update({
      where: { id },
      data: updates
    });

    await NotificationService.sendTaskUpdated(task);

    return task;
  }
}
```

### Markup Mode Files

Files with `parseMode: "markup"` use Z's specialized syntax:

#### Table Files (.table.z)

```z
// User.table.z
@doc("User table with authentication and profile data")
@context("Core user entity supporting OAuth, roles, and relationships")

id: string @primary @default(uuid())
email: string @unique @max(255) @index
name: string @max(100)
avatar: string? @max(500)
role: UserRole @default(user)
emailVerified: boolean @default(false)
createdAt: datetime @default(now())
updatedAt: datetime @updatedAt

// Relationships
profile: UserProfile? @relation(fields: [id], references: [userId])
posts: Post[] @relation("UserPosts")
sessions: Session[] @relation("UserSessions")

// Indexes
@@index([email, role])
@@index([createdAt])
```

#### Enum Files (.enum.z)

```z
// TaskStatus.enum.z
@doc("Task lifecycle status enumeration")
@context("Represents all possible states a task can be in")

pending @doc("Task is created but not yet started") @color("#FFA500")
active @doc("Task is currently being worked on") @color("#00FF00")
review @doc("Task is completed and under review") @color("#FFFF00")
completed @doc("Task has been finished and approved") @color("#0000FF")
cancelled @doc("Task was cancelled before completion") @color("#FF0000")
```

#### Config Files (.config.z)

```z
// Database.config.z
@doc("Database connection configuration")
@context("Environment-specific database settings")

host: process.env.DB_HOST @required
port: process.env.DB_PORT @default(5432) @type(number)
database: process.env.DB_NAME @required
username: process.env.DB_USER @required
password: process.env.DB_PASSWORD @required @sensitive
ssl: process.env.NODE_ENV === "production" @type(boolean)
maxConnections: 20 @type(number) @min(1) @max(100)
connectionTimeout: 30000 @type(number) @unit("ms")
```

## Directory Nesting Rules

### With Nesting (`directoryNesting: true`)

Children can have their own subdirectories:

```z
Routes {
  admin {          // → admin.route.z + admin/ directory
    users {        // → admin/users.route.z + admin/users/ directory
      [id] {       // → admin/users/[id].route.z + admin/users/[id]/ directory
        edit       // → admin/users/[id]/edit.route.z
        delete     // → admin/users/[id]/delete.route.z
      }
      create       // → admin/users/create.route.z
    }
    settings       // → admin/settings.route.z
  }
}
```

**Generated Structure:**

```
/routes/
├── admin.route.z
└── admin/
    ├── users.route.z
    ├── users/
    │   ├── [id].route.z
    │   ├── [id]/
    │   │   ├── edit.route.z
    │   │   └── delete.route.z
    │   └── create.route.z
    └── settings.route.z
```

### Without Nesting (`directoryNesting: false`)

All children are flat files:

```z
Schema {
  table User { ... }
  table Product { ... }
  table Order { ... }
  enum Status { ... }
  enum Priority { ... }
}
```

**Generated Structure:**

```
/schema/
├── User.table.z
├── Product.table.z
├── Order.table.z
├── Status.enum.z
└── Priority.enum.z
```

## Inline vs External Declaration

Children can be defined inline or in separate files:

### Inline Declaration

```z
Routes {
  tasks {
    // Inline definition - generates tasks.route.z with this content
    @doc("Task management page")

    fun GET() {
      return await db.task.findMany();
    }

    export default function TasksPage() {
      return <div>Tasks</div>;
    }
  }
}
```

### External Declaration

```z
Routes {
  tasks  // External reference - looks for tasks.route.z file
}
```

If `tasks.route.z` doesn't exist, the compiler will scaffold it with a basic template.

## Scaffolding Templates

The compiler generates different templates based on `scaffoldingType`:

### TSX-Like Template (`scaffoldingType: "tsx-like"`)

```z
// Generated route template
@doc("Generated route")
@context("Auto-generated route handler and page component")

fun GET() {
  // TODO: Implement GET handler
  return { message: "Hello from generated route" };
}

export default function GeneratedPage() {
  return (
    <div>
      <h1>Generated Page</h1>
      <p>This page was auto-generated. Update this content.</p>
    </div>
  );
}
```

### Field-List Template (`scaffoldingType: "field-list"`)

```z
// Generated table template
@doc("Generated table")
@context("Auto-generated database table schema")

id: string @primary @default(uuid())
createdAt: datetime @default(now())
updatedAt: datetime @updatedAt

// TODO: Add your table fields here
```

### Value-List Template (`scaffoldingType: "value-list"`)

```z
// Generated enum template
@doc("Generated enumeration")
@context("Auto-generated enum values")

value1 @doc("First enum value")
value2 @doc("Second enum value")

// TODO: Define your enum values here
```

## File Size Limits and Auto-Splitting

When files exceed 500 lines, they are automatically split:

### Original File (600 lines)

```z
// UserManagement.route.z (600 lines - exceeds limit)
// Contains: API handlers, React components, utility functions, types
```

### Auto-Split Result

```
/shared/types/
└── UserTypes.type.z          // Type definitions (50 lines)

/shared/utils/
├── UserValidation.function.z  // Validation functions (80 lines)
└── UserFormatting.function.z  // Formatting utilities (70 lines)

/routes/
├── UserManagement.route.z     // Main route file (150 lines)
└── UserManagement/
    ├── UserList.component.z   // User list component (120 lines)
    └── UserForm.component.z   // User form component (130 lines)
```

## Cross-Platform Scaffolding

Different targets generate appropriate file structures:

### Next.js Target

```z
next WebApp {
  Routes { users, products }
  API { auth, payments }
  Components { UserCard, ProductGrid }
}
```

**Generated:**

```
/app/
├── users/page.z
├── products/page.z
├── api/auth/route.z
├── api/payments/route.z
└── components/
    ├── UserCard.component.z
    └── ProductGrid.component.z
```

### SwiftUI Target

```z
swift MobileApp {
  App { MainApp }
  Components { UserView, ProductView }
}
```

**Generated:**

```
/Sources/
├── MainApp.view.z
└── Components/
    ├── UserView.view.z
    └── ProductView.view.z
```

### Rust Target

```z
rust LibraryModule {
}
```

**Generated:**

```
/src/
├── types/
│   ├── User.type.z
│   └── Product.type.z
├── functions/
│   ├── calculateTax.function.z
│   └── formatPrice.function.z
└── modules/
    ├── auth.module.z
    └── payments.module.z
```

## Registry Child Type Definitions

Complete child type configuration:

```json
{
  "childTypes": {
    "route": {
      "description": "Web application route",
      "parseMode": "code",
      "fileExtension": ".route.z",
      "allowsNesting": true,
      "scaffoldingType": "tsx-like",
      "template": "route-template.z"
    },
    "component": {
      "description": "Reusable UI component",
      "parseMode": "code",
      "fileExtension": ".component.z",
      "allowsNesting": false,
      "scaffoldingType": "tsx-like",
      "template": "component-template.z"
    },
    "table": {
      "description": "Database table",
      "parseMode": "markup",
      "fileExtension": ".table.z",
      "allowsNesting": false,
      "scaffoldingType": "field-list",
      "template": "table-template.z"
    },
    "enum": {
      "description": "Enumeration type",
      "parseMode": "markup",
      "fileExtension": ".enum.z",
      "allowsNesting": false,
      "scaffoldingType": "value-list",
      "template": "enum-template.z"
    },
    "service": {
      "description": "Backend service class",
      "parseMode": "code",
      "fileExtension": ".service.z",
      "allowsNesting": true,
      "scaffoldingType": "class-based",
      "template": "service-template.z"
    },
    "config": {
      "description": "Configuration object",
      "parseMode": "markup",
      "fileExtension": ".config.z",
      "allowsNesting": false,
      "scaffoldingType": "properties-only",
      "template": "config-template.z"
    }
  }
}
```

This automatic scaffolding system eliminates manual file management while maintaining consistent project structure and enabling rapid development through intelligent code generation.
