# Z Language – Syntax Overview

> **Purpose**
> This document provides a comprehensive overview of Z language syntax, which is fundamentally similar to TSX/TypeScript with specific extensions and modifications for multi-target compilation.

---

## Overview: TSX-Like Syntax with Extensions

Z language syntax is **intentionally similar to TSX/TypeScript** to leverage existing developer knowledge while adding powerful extensions for cross-platform development. The core JavaScript/TypeScript syntax remains familiar, with targeted enhancements for the unique requirements of multi-target compilation.

### Key Differences from TSX/TypeScript

#### 1. Function Declaration

```typescript
// TSX/TypeScript
function getUser(id: string): Promise<User | null> { ... }

// Z Language
@params(id: string)
@response(User | null)
fun getUser(id) { ... }
```

#### 2. Extended Type System

Z includes all Rust primitive types alongside TypeScript types:

**Rust-inspired types:**

- Integer types: `i8`, `i16`, `i32`, `i64`, `i128`, `u8`, `u16`, `u32`, `u64`, `u128`, `isize`, `usize`
- Floating point: `f32`, `f64`
- Other: `char`, `decimal`

**Type compilation behavior:**

- When compiling to **TypeScript**: Rust types map to TypeScript equivalents (`i32` → `number`, `String` → `string`)
- When compiling to **Rust**: TypeScript types get default mappings (`number` → `i32`, `string` → `String`)

#### 3. Target-Specific Keywords

```z
next MyWebApp {
  Routes { ... }
  API { ... }
  Components { ... }
}

swift MyMobileApp {
  App { ... }
  Components { ... }
}

rust MyLibrary {
}
```

#### 3.1. Workspace Organization

For organizing multiple related applications, use `workspace`:

```z
// Standalone application
next MyPersonalSite {}

// Collection of related applications
workspace internal-tools {
  @doc("VPN management application")
  tauri fpn {}

  @doc("Command-line interface for VPN")
  rust fpnCli {}

  @doc("Marketing website for VPN service")
  next fpnSite {}
}

// Real-world example
workspace ecommerce-platform {
  next customerApp {}
  next adminDashboard {}
  rust paymentService {}
  rust inventoryService {}
  swift mobileApp {}
}
```

**Workspace Benefits:**

- **Shared Dependencies**: Common packages and configurations
- **Coordinated Building**: Build all applications together
- **Cross-References**: Applications can reference each other's types and APIs
- **Unified Deployment**: Deploy entire stack as one unit

#### 4. Implicit Async/Await

```z
// Promises are automatically awaited by default
fun getUser(id) {
  return db.user.findUnique({ where: { id } })  // implicit await
}

// Can be controlled with annotations
@sync
fun synchronousFunction() { ... }
```

#### 5. Annotations on Types and Declarations

```z
@doc("User table with authentication")
@index(["email", "created_at"])
table User {
  id: string @primary @default(uuid())
  email: string @unique @max(255)
  age: u8 @min(0) @max(150)
}
```

#### 6. Element-Based Markup System

Unlike JSX which is primarily for React components, Z uses a generalized element system:

```z
// Single-type children (all children are routes)
Routes {
  tasks        // implicitly a route
  customers    // implicitly a route
  [slug]       // dynamic route
}

// Multi-type children (requires type keywords)
Schema(database: postgres) {
  table Product {     // 'table' keyword specifies child
    id: string @primary
    name: string @max(100)
  }

  enum Status {       // 'enum' keyword specifies child type
    pending
    completed
  }
}
```

> **Note:** The typing system for children is currently defined in the **language registry**, which tells the compiler what child types are allowed for each parent element and whether type keywords are required.

---

## 1. Building Blocks

| Concept          | Glyph | Description                                                       |
| ---------------- | ----- | ----------------------------------------------------------------- |
| _Element_        | `{}`  | Primary unit of code & compilation. Comparable to an HTML tag.    |
| _Annotation_     | `@`   | Metadata that modifies behaviour or provides context.             |
| _Modifier_       | word⁺ | A _leading_ word that categorises a child (e.g. `table`, `enum`). |
| _Child_          | —     | Nested element or value inside a parent element.                  |
| _Registry Entry_ | —     | Static description of an element recorded in _language registry_. |

### 1.1. Identifiers

```
Identifier ::= /[A-Za-z_][A-Za-z0-9_]*/
```

- Unicode letters beyond the basic Latin set are allowed but discouraged in tooling.

### 1.2. Keywords vs. Modifiers

Z reserves **zero** keywords at the grammar level.
Words such as `fun`, `type`, `import`, `model`, `contract`, `message` _become keywords_ **only** when used as **modifiers** at the start of a line **inside an element that expects Z-code children** (see §3.2).

---

## 2. Annotations

Annotations attach metadata **above** an element or statement:

```z
@doc("User table")
Schema(database: postgres) {
  ...
}
```

Grammar

```
Annotation       ::= "@" Identifier (Arguments)?
Arguments        ::= "(" ArgumentList? ")"
ArgumentList     ::= Argument ("," Argument)*
Argument         ::= Identifier ":" Value | Value
Value            ::= String | Number | Boolean | Array | Object
```

Ordering rules:

1. Any number of annotations may precede an element.
2. Compiler defines precedence when multiple annotations conflict.

> **Executable Annotations** > `@params` and `@response` are reserved for handlers & functions.
> They declare the _parameter types_ and _response type_ without cluttering the signature.

```z
@doc("User table")
Schema(database: postgres) {
  ...
}
```

---

## 3. Element Forms

Every _Element_ has a **name** followed by an **element body**:

```
Element          ::= Identifier (Parameters)? ElementBody
ElementBody      ::= "{" ElementContent* "}"
```

`ElementContent` depends on the _element kind_ registered in the language registry.

### 3.1. Property-Only Element

A configuration block **without children**.

```z
docker_image {
  from: "node:20"  @required
  workdir: "/app"
}
```

Rules:

- Body must contain _only_ key–value pairs (no nested elements).
- Keys follow `Identifier ":" Expression` grammar.

### 3.2. Element with Children (Markup Mode)

```z
Routes {
  home
  about
  blog {
    [slug]
  }
}
```

Rules:

- Bare identifiers (`home`, `about`) become **child elements** of type _Route_.
  The compiler auto-scaffolds files for unresolved identifiers (§4).
- Square-bracket syntax `[slug]` is shorthand for a _dynamic_ route child.

### 3.3. Z-Code Element (Code Mode)

Elements such as `Schema`, `Lib`, `module` and target blocks allow **code children**:

```z
Schema(database: postgres) {
  table User {
    id: string  @primary  @default(uuid())
    email: string  @unique
  }
}
```

Parsing rules inside a _code-mode_ body:

1. **Leading modifier** (e.g. `model`) selects the _child kind_.
2. Next token is the **identifier** (`User`).
3. Remainder of the line until `{` is parsed as **signature**.
4. Nested `{ … }` contains _fields_ or _statements_ depending on the modifier.

---

## 4. Children Declaration

There are two orthogonal axes that define a child line:

| Syntax                        | Meaning                              | Example                       |
| ----------------------------- | ------------------------------------ | ----------------------------- |
| _Bare Identifier_             | Child inherits parent element kind   | `home`                        |
| _Modifier_ **Identifier**     | Child kind forced by modifier        | `table User`                  |
| _Modifier_ **Signature** `{}` | Structured child with nested content | `fun login(req, res) { ... }` |

### 4.1. Table Field (Schema-specific)

When the parent element is `Schema > table`, each child line represents a **column field**:

```
field_line ::= Identifier ":" Type  Annotation*
```

### 4.2. Passing Properties to Markup Children

Markup children can receive _properties_ using a **function-call** style immediately after the child name.

```z
HeroSection(title: "Welcome to Z", subtitle: "Target-first development")

Button(size: "lg", variant: "primary") {
  "Get Started"
}
```

Rules:

1. The syntax mirrors parameter lists on elements: `ChildName(prop1: value1, prop2: value2)`.
2. Values may be primitives, arrays, objects, or references.
3. When the child also has nested children (see `Button` above) the property list precedes the `{ … }` body.
4. The compiler treats these properties as _props_ when generating target code (e.g., React props for NextJS).

Grammar addition:

```
ChildWithProps   ::= Identifier "(" KeyValueList? ")" (ElementBody)?
```

`ChildWithProps` is accepted anywhere a _Bare Identifier_ is allowed.

---

## 5. Registry-Driven Validation

The **Language Registry** is a JSON/toml/yaml manifest that specifies, **per element**:

```json
{
  "Schema": {
    "mode": "code",
    "allowedChildren": [
      "table",
      "enum",
      "index"
    ],
    "compiler": "@z-compiler/schema"
  },
  "Routes": {
    "mode": "markup",
    "allowedChildren": ["*"],
    "compiler": "@z-compiler/routes"
  }
}
```

Rules enforced at parse time:

1. Parent element must exist in registry.
2. Child modifier must be listed in `allowedChildren` (or `"*"`).
3. Annotations must satisfy the element's annotation schema.

Target blocks (e.g., `next`, `swift`, `rust`) expose their own **namespaces**—special child elements that organise code according to the conventions of that platform.
Examples: `Routes`, `API`, `Components`, `Schema` for next; `App`, `Components` for swift; `type`, `fun`, `mod` for rust.

These namespaces are regular elements whose behaviour is fully described in the _language registry_. They can be:

- True element kinds with custom compilers, **or**
- Thin aliases mapping to an underlying element (see `aliasOf` below).

### Extended Registry Example

```json
{
  "targets": {
    "swift": {
      "mode": "markup",
      "allowedChildren": [
        "App",
        "Components"
      ],
      "compiler": "@z-compiler/swiftui"
    },
    "next": {
      "mode": "markup",
      "allowedChildren": [
        "Routes",
        "API",
        "Components",
        "Schema"
      ],
      "compiler": "@z-compiler/nextjs"
    }
  },
  "namespaces": {
    "App": {
      "aliasOf": "component",
      "role": "root"
    },
    "Components": {
      "aliasOf": "namespace",
      "allowedChildren": ["component"]
    },
    "Schema": {
      "aliasOf": "element",
      "allowedChildren": [
        "table",
        "enum",
        "index",
        "type"
      ]
    }
  }
}
```

Rules added:

1. **Namespace Resolution** – When an `aliasOf` is present the parser swaps the alias for its target kind _before_ further validation.
2. **Target-Specific Children** – A child element is valid only if it appears in the parent's `allowedChildren` list (or that list contains `"*"`).
3. **Role Metadata** – Optional `role` hints (`"root"`, `"layout"`, etc.) help downstream generators decide file locations and import patterns.

With this model a swift target block in the specification is parsed as:

```
swift MyApp
└─ App (alias → component root)
   └─ WindowGroup { … }
└─ Components (alias → namespace)
   └─ ContentView (component)
```

Adding new platform namespaces becomes a registry edit—no grammar change required.

---

## 6. Function / Handler Syntax

Inside _code-mode_ elements, Z embeds a TypeScript-like language with extensions:

- Extra primitive types (`i8`, `u64`, `decimal`, ...)
- Multiple return type variants (`-> js`, `-> rust`, ...)
- `fun` keyword declares a function (replacing the classic `function` keyword).
- **Parameter and response types are supplied via `@params` / `@response`.**
- Promise-returning expressions are _implicitly awaited_; writing `await` is optional.

```z
@params(id: string)
@response(User | null)
fun getUser(id) {
  return db.user.findUnique({ where: { id } })
}
```

The embedded language obeys standard TypeScript grammar **plus**:

```
ExtendedType   ::= BasicType ("|" BasicType)*
ReturnVariant  ::= "->" Identifier
```

### 6.1. Flow-Control & Inline Handlers

Z offers a terse, expression-friendly syntax for the most common control constructs.
Each form is treated as _sugar_ that expands to the equivalent JavaScript/TypeScript (or target-specific) code during compilation.

#### Conditional Blocks

```z
if (user.isAdmin) {
  AdminDashboard()
} else {
  GuestDashboard()
}
```

Grammar

```
IfStmt ::= "if" "(" Expression ")" ElementBody ("else" ElementBody)?
```

#### Iteration

```z
for product in products {
  ProductCard(product)
}
```

Equivalent to `products.forEach(product => …)`.

Grammar

```
ForStmt ::= "for" Identifier "in" Expression ElementBody
```

#### Inline Handlers (Lambda Syntax)

Higher-order array helpers such as `map`, `filter`, `reduce`, or any custom API accept a _handler_ using the familiar `items.map(item) { … }` form:

```z
posts.map(post) {
  ArticleCard(post)
}

numbers.filter(n) { n % 2 == 0 }
```

Rules:

1. The identifier between parenthesis is the **handler parameter**.
2. The trailing `{ … }` is the handler **body**; a single expression body returns that value implicitly.
3. Multiple parameters use comma separation: `pairs.map(key, value) { KeyValue(key, value) }`.

Grammar

```
CallWithHandler ::= Expression "." Identifier "(" ParamList? ")" ElementBody
ParamList       ::= Identifier ("," Identifier)*
```

The compiler emits an inline arrow-function for the handler.

---

## 7. Summary of Grammar (EBNF)

```
Program           ::= Element*
Element           ::= Annotation* Identifier (Parameters)? "{" ElementContent* "}"
Parameters        ::= "(" KeyValueList? ")"
KeyValueList      ::= KeyValue ("," KeyValue)*
KeyValue          ::= Identifier ":" Expression
ElementContent    ::= Child | KeyValue | Comment
Child             ::= ChildLine | Element
ChildLine         ::= (Modifier? Identifier Signature?) (Annotation*) ("{" ChildBody "}")?
Modifier          ::= Identifier
Signature         ::= /[^@{}\n]+/
Comment           ::= "//" /[^\n]*/
```

---

## 8. Examples by Category

### 8.1. Component with Markup Children

```z
component HomePage {
  Header
  main {
    HeroSection(classname: 'mt-10')
    FeatureList
  }
  Footer
}
```

### 8.2. Component with Code Children

```z
Schema(database: postgres) {
  table Product {
    id: string  @primary @default(uuid())
    name: string  @max(100)
    price: number @min(0)
  }
}
```

### 8.3. Handler Function

```z
@params(req: Request)
@response(Response)
fun POST(req) {
  const data = req.json()  // implicit await
  return new Response(JSON.stringify(doHeavyWork(data)))
}
```

---

## Appendix A – Formal PEG.js Grammar (work-in-progress)

The formal grammar has moved to `doc/grammar.pegjs` for easier editing and tooling integration.
