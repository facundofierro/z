# Z Language Scaffolding System Usage

## Overview

The Z Language Server provides automatic scaffolding functionality that generates files based on your code structure and the language registry configuration. This enables rapid development by automatically creating properly structured files with appropriate extensions and content.

## Available Commands

The scaffolding system provides several VSCode/Cursor commands:

-   `z.scaffoldChild` - Create a child file based on parent context
-   `z.createRoute` - Create a new route file
-   `z.createComponent` - Create a new component file
-   `z.createTable` - Create a new database table file
-   `z.createEnum` - Create a new enumeration file
-   `z.createFromTemplate` - Create file from a specific template

## Usage Examples

### 1. Automatic Child Scaffolding

When you have a parent block, you can automatically scaffold children:

```z
next MyApp {
  Routes {
    // Cursor here -> trigger z.scaffoldChild
    // Will prompt for child name and create tasks.route.z
  }
}
```

**Generated file: `app/routes/tasks.route.z`**

```z
@doc('tasks route')
@context('Auto-generated route for tasks')

@params(request: Request)
@response(any)
fun GET(request) {
    // TODO: Implement GET handler
    return { message: 'Hello from tasks' };
}

export default function TasksPage() {
    return (
        <div className='tasks-page'>
            <h1>Tasks</h1>
            <p>This page was auto-generated. Update this content.</p>
        </div>
    );
}
```

### 2. Nested Directory Scaffolding

For nested structures with directory support:

```z
next MyApp {
  Routes {
    admin {
      // Will create admin.route.z + admin/ directory
      users {
        // Will create admin/users.route.z
        [id] {
          // Will create admin/users/[id].route.z
        }
      }
    }
  }
}
```

**Generated structure:**

```
app/routes/
├── admin.route.z
└── admin/
    ├── users.route.z
    └── users/
        └── [id].route.z
```

### 3. Multi-Type Children

For blocks that allow multiple child types:

```z
Schema {
  // Cursor here -> z.scaffoldChild will prompt for type selection
  // Options: table, model, enum, index, type
}
```

If you select "table" and name it "User":

**Generated file: `schema/User.table.z`**

```z
@doc('User table definition')
@context('Auto-generated database table schema')

id: string @primary @default(uuid())
createdAt: datetime @default(now())
updatedAt: datetime @updatedAt

// TODO: Add your table fields here
```

If you select "enum" and name it "Status":

**Generated file: `schema/Status.enum.z`**

```z
@doc('Status enumeration')
@context('Auto-generated enum values')

value1 @doc('First enum value')
value2 @doc('Second enum value')

// TODO: Define your enum values here
```

### 4. Component Scaffolding

```z
next MyApp {
  Components {
    // z.scaffoldChild -> "TaskCard" creates TaskCard.component.z
  }
}
```

**Generated file: `app/components/TaskCard.component.z`**

```z
@doc('TaskCard component')
@context('Auto-generated component component')

@params({ className?: string })
export default function TaskCard({ className }) {
    return (
        <div className={`TaskCard ${className || ''}`}>
            <h2>TaskCard</h2>
            <p>Auto-generated component. Add your content here.</p>
        </div>
    );
}
```

### 5. Cross-Platform Scaffolding

The system adapts to different targets:

#### Swift/iOS Target

```z
swift MobileApp {
  Components {
    // Creates UserView.view.z in appropriate iOS structure
  }
}
```

#### Rust Target

```z
rust ComputeModule {
  type {
    // Creates Calculator.type.z with Rust-specific structure
  }

  fun {
    // Creates fibonacci.function.z with Rust function template
  }
}
```

## How to Trigger Scaffolding

### 1. Command Palette

1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type "Z Language: Scaffold Child"
3. Select the command
4. Follow the prompts

### 2. Context Menu (if configured)

Right-click inside a parent block and select "Scaffold Child" from the context menu.

### 3. Keyboard Shortcuts (if configured)

You can configure keyboard shortcuts in VSCode:

```json
{
    "key": "ctrl+shift+n",
    "command": "z.scaffoldChild",
    "when": "editorLangId == z"
}
```

## Configuration

### Registry Configuration

The scaffolding behavior is driven by the registry configuration in `compiler/stdlib/registry.json`:

```json
{
    "namespaces": {
        "Routes": {
            "childType": "route",
            "childMode": "single",
            "scaffolding": {
                "fileExtension": ".route.z",
                "parseMode": "code",
                "directoryNesting": true
            }
        },
        "Schema": {
            "childMode": "multiple",
            "scaffolding": {
                "fileExtensions": {
                    "table": ".table.z",
                    "enum": ".enum.z"
                },
                "parseModes": {
                    "table": "markup",
                    "enum": "markup"
                },
                "directoryNesting": false
            }
        }
    }
}
```

### Custom Templates

You can customize the generated templates by modifying the template functions in `z-registry.ts`:

```typescript
function generateTsxLikeTemplate(name: string, type: string): string {
    // Custom template logic here
    return `// Your custom template for ${name}`;
}
```

## File Naming Conventions

The scaffolding system follows these naming conventions:

| Child Type | File Extension | Example                 |
| ---------- | -------------- | ----------------------- |
| route      | `.route.z`     | `tasks.route.z`         |
| component  | `.component.z` | `TaskCard.component.z`  |
| table      | `.table.z`     | `User.table.z`          |
| enum       | `.enum.z`      | `Status.enum.z`         |
| service    | `.service.z`   | `AuthService.service.z` |
| config     | `.config.z`    | `Database.config.z`     |

## Validation and Parsing

Generated files are automatically validated based on their parse mode:

-   **Code mode** files (`.route.z`, `.component.z`) use TypeScript-like syntax
-   **Markup mode** files (`.table.z`, `.enum.z`) use Z markup syntax

The language server provides appropriate syntax highlighting, validation, and autocompletion for each mode.

## Troubleshooting

### Common Issues

1. **Command not found**: Ensure the Z Language Server is running and properly configured
2. **No parent type detected**: Make sure you're inside a valid parent block (Routes, Schema, etc.)
3. **Invalid child name**: Child names must be valid identifiers (`[a-zA-Z][a-zA-Z0-9_]*`)
4. **Registry not found**: Ensure `compiler/stdlib/registry.json` is accessible

### Debug Tips

1. Check the Language Server output panel for error messages
2. Verify the registry configuration matches your expected structure
3. Ensure workspace folder is properly set up
4. Check file permissions for the target directory

This scaffolding system significantly speeds up Z Language development by automating the creation of properly structured files with appropriate content and validation.
