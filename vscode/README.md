# Z Language VSCode Extension

This extension provides rich language support for the Z Language in Visual Studio Code.

## Features

- **Syntax Highlighting**: Full syntax highlighting for Z Language constructs
- **IntelliSense**: Auto-completion for targets, keywords, and annotations
- **Real-time Diagnostics**: Error checking and validation
- **Target-aware Completion**: Context-sensitive suggestions based on compilation targets
- **Language Server Integration**: Powered by the Z Language Server Protocol

## Installation

### Method 1: Install from Source (Current)

1. **Build the Language Server**:

   ```bash
   cd ../lsp
   npm install
   npm run build
   ```

2. **Build the Extension**:

   ```bash
   cd ../vscode
   npm install
   npm run compile
   ```

3. **Install the Extension**:

   ```bash
   # Package the extension
   npm run package

   # Install the generated .vsix file
   code --install-extension z-language-0.1.0.vsix
   ```

### Method 2: Development Installation

1. **Open in VSCode**:

   ```bash
   cd vscode
   code .
   ```

2. **Press F5** to launch a new Extension Development Host window with the extension loaded

3. **Create or open a `.z` file** to test the language support

## Supported File Extensions

- `.z` - Z Language source files

## Configuration

You can configure the extension in your VSCode settings:

```json
{
  "z-language.server.path": "/custom/path/to/z-language-server",
  "z-language.trace.server": "verbose"
}
```

### Settings

- `z-language.server.path`: Path to a custom Z Language Server executable (leave empty to use bundled server)
- `z-language.trace.server`: Controls LSP communication tracing (`off`, `messages`, `verbose`)

## Usage

### Basic Z Code Example

```z
@doc("Simple web application")
@context("Blog platform with posts and comments")
next BlogApp {
  Routes {
    home
    blog {
      [slug]
    }
    admin
  }

  Schema {
    model Post {
      id: string @primary
      title: string
      content: string
    }
  }
}
```

### Features in Action

- **Target Completion**: Type `Next` and get `NextJS` completion
- **Child Validation**: Inside `NextJS`, get completions for `Routes`, `Schema`, `API`, `Components`
- **Error Highlighting**: Unknown targets or invalid children are highlighted
- **Annotation Support**: Auto-complete `@doc`, `@context`, `@params`, etc.

## Troubleshooting

### Extension Not Working

1. **Check Output Panel**: View → Output → Z Language Server
2. **Restart Extension**: Command Palette → "Developer: Reload Window"
3. **Verify LSP Build**: Ensure `../lsp/dist/server.js` exists

### Language Server Issues

1. **Build the LSP**:

   ```bash
   cd ../lsp
   npm run build
   ```

2. **Test LSP Directly**:

   ```bash
   node ../lsp/dist/server.js --stdio
   ```

3. **Enable Tracing**:
   ```json
   {
     "z-language.trace.server": "verbose"
   }
   ```

## Development

### Building

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch

# Package extension
npm run package
```

### Structure

```
vscode/
├── package.json              # Extension manifest
├── tsconfig.json            # TypeScript config
├── language-configuration.json # Language features
├── src/
│   └── extension.ts         # Main extension code
├── syntaxes/
│   └── z.tmLanguage.json    # Syntax highlighting
└── out/                     # Compiled JavaScript
```

## Contributing

1. Make changes to the extension code
2. Test with F5 (Extension Development Host)
3. Update version in `package.json`
4. Run `npm run package` to create `.vsix`
5. Submit pull request

## License

MIT License - see the root project license for details.
