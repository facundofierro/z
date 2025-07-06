# Z Language Examples

This directory contains example Z projects demonstrating the multi-target compilation system. Each example is a self-contained project with its own `main.z` file and generated output.

## Project Structure

```
examples/
├── README.md                    # This file
├── MultiTargetDemo/            # Demo of multiple platforms working together
│   ├── main.z                 # Z source code
│   └── out/                   # Generated applications
│       ├── WebApp/            # Next.js web application
│       ├── MobileApp/         # SwiftUI iOS app
│       ├── BackendAPI/        # Rust backend service
│       └── DesktopApp/        # Tauri desktop application
├── SocialPlatform/            # Social media platform example
│   ├── main.z
│   └── out/
│       ├── SocialWeb/         # Next.js web frontend
│       └── SocialMobile/      # SwiftUI mobile app
└── GameDev/                   # Game development project
    ├── main.z
    └── out/
        ├── GameEngine/        # Rust game engine
        ├── GameEditor/        # Tauri editor tool
        └── GameWebsite/       # Next.js marketing site
```

## Supported Target Keywords

The Z compiler supports the following target platforms:

| Keyword   | Description                               | File Extension | Example                   |
| --------- | ----------------------------------------- | -------------- | ------------------------- |
| `next`    | React-based web applications with Next.js | `.tsx`         | `next MySite { ... }`     |
| `swift`   | iOS/macOS applications with SwiftUI       | `.swift`       | `swift MyApp { ... }`     |
| `rust`    | Native Rust applications or WebAssembly   | `.rs`          | `rust MyService { ... }`  |
| `tauri`   | Cross-platform desktop apps               | `.rs`          | `tauri MyTool { ... }`    |
| `android` | Android applications (planned)            | `.kt`          | `android MyApp { ... }`   |
| `harmony` | HarmonyOS applications (planned)          | `.ets`         | `harmony MyApp { ... }`   |
| `qt`      | Cross-platform Qt applications (planned)  | `.cpp`         | `qt MyApp { ... }`        |
| `java`    | Java applications (planned)               | `.java`        | `java MyApp { ... }`      |
| `python`  | Python applications (planned)             | `.py`          | `python MyScript { ... }` |
| `bash`    | Bash shell scripts (planned)              | `.sh`          | `bash MyScript { ... }`   |

## Syntax Overview

Each Z project uses the following syntax:

```z
target_keyword ApplicationName {
    // Application structure
    ComponentType {
        // Component details
    }
}
```

### Example:

```z
next MySocialApp {
    Routes {
        home
        profile
        feed
        settings
    }

    API {
        auth
        users
        posts
    }

    Components {
        Header
        PostCard
        UserProfile
    }
}

swift MobileApp {
    App {
        ContentView
        TabView
    }

    Components {
        LoginView
        ProfileView
        SettingsView
    }
}
```

## How to Compile

From the compiler directory, use the Z CLI to compile any example:

```bash
# Compile a specific example
cd compiler
cargo run -p z-cli -- ../examples/MultiTargetDemo/main.z

# This will create output in:
# ../examples/MultiTargetDemo/out/WebApp/generated.tsx
# ../examples/MultiTargetDemo/out/MobileApp/generated.swift
# ../examples/MultiTargetDemo/out/BackendAPI/generated.rs
# ../examples/MultiTargetDemo/out/DesktopApp/generated.rs
```

## Generated Output

Each target generates complete, runnable code:

### Next.js (`next`)

- **Output**: Complete React/TypeScript application
- **Includes**: `package.json`, component files, Tailwind config
- **Features**: Modern UI with responsive design, API routes, component structure

### SwiftUI (`swift`)

- **Output**: Complete iOS/macOS application
- **Includes**: App structure, ContentView, Package.swift
- **Features**: Native iOS components with proper navigation

### Rust (`rust`)

- **Output**: Complete Rust project
- **Includes**: `Cargo.toml`, main application, WebAssembly support
- **Features**: Both native and WASM compilation targets

### Tauri (`tauri`)

- **Output**: Cross-platform desktop application
- **Includes**: Rust backend, web frontend, Tauri configuration
- **Features**: Native desktop app with web UI, system integration

## Example Projects

### 1. MultiTargetDemo

Demonstrates how a single Z definition can generate applications for web, mobile, desktop, and backend services. Perfect for understanding the cross-platform capabilities.

### 2. SocialPlatform

Shows a focused social media platform with web and mobile frontends sharing the same core structure and API definitions.

### 3. GameDev

Illustrates a game development workflow with a Rust game engine, Tauri-based editor tools, and a Next.js marketing website.

## Creating New Examples

1. Create a new directory in `examples/`:

   ```bash
   mkdir examples/MyNewProject
   ```

2. Create a `main.z` file with your target definitions:

   ```z
   next MyApp {
       // Your app structure
   }
   ```

3. Compile from the compiler directory:

   ```bash
   cd compiler
   cargo run -p z-cli -- ../examples/MyNewProject/main.z
   ```

4. Find your generated code in `examples/MyNewProject/out/`

## Contributing

When adding new examples:

- Keep each project focused on demonstrating specific features
- Include comprehensive component structures
- Document any unique patterns or approaches
- Test that all targets compile successfully

---

**Note**: This is an early preview of the Z language compiler. The syntax and features are actively being developed and may change.
