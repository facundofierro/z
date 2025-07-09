# Z Compiler (Rust Workspace)

This directory contains the **reference compiler implementation** for the Z language.
It is a Rust workspace composed of small, focused crates that can be worked on and published independently.

## Workspace layout

```
compiler/
├── Cargo.toml             # Workspace manifest
├── README.md              # <— you are here
└── crates/
    ├── ast/               # Core AST data structures shared by all stages
    │   ├── Cargo.toml
    │   └── src/lib.rs
    ├── parser/            # PEG-powered parser that converts source → AST
    │   ├── Cargo.toml
    │   └── src/lib.rs
    ├── core/              # Semantic analysis, optimisation & code-gen façade
    │   ├── Cargo.toml
    │   └── src/lib.rs
    └── cli/               # Binary crate that exposes `z compile <file>` interface
        ├── Cargo.toml
        └── src/main.rs
```

### Crate responsibilities

| Crate               | Purpose                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **z-ast**           | Serializable AST structs (`Element`, `Annotation`, `Node`, …). Zero logic.                                               |
| **z-parser**        | Wraps the PEG grammar (eventually generated from `doc/grammar.pegjs`) and produces `z_ast` values.                       |
| **z-compiler-core** | Performs semantic analysis, optimisation passes and dispatches to platform-specific code generators (to be implemented). |
| **z-cli**           | Thin CLI wrapper built with `clap` that reads a `.z` file, calls the core compiler and prints diagnostics.               |

## Building & running

```bash
# build all crates in release mode
cargo build --release -p z-cli

# compile a source file (stub)
cargo run -p z-cli -- path/to/file.z
```

During early development you may prefer incremental builds:

```bash
cargo watch -x "run -p z-cli -- examples/hello.z"
```

## Regenerating the parser

The formal PEG grammar lives in `doc/grammar.pegjs`. When the grammar changes you can embed the new rules into the `z-parser` crate by running:

```bash
peg src/grammar.pegjs -o crates/parser/src/generated.rs
```

(We'll automate this step using a `build.rs` script once the grammar stabilises.)

## Testing

Each crate can have its own unit tests. Run the full test-suite with:

```bash
cargo test --workspace
```

## Contributing workflow

1. Pick or open an issue (parser, semantic analysis, code-gen, …).
2. Make changes in the relevant crate.
3. Ensure `cargo test --all` passes.
4. Open a PR.

Happy hacking! 🎉

## Canonical Z project layout

```
my-project/
├── main.z            # Required entry file – top-level `NextJS`, `SwiftUI`, … blocks
├── main/             # Optional directory for additional source files (auto-imported)
└── out/              # Compiler output (one sub-folder per target)
    ├── nextjs/
    ├── swiftui/
    └── rust/
```

The CLI respects this layout:

```bash
# compile default main.z to ./out
cargo run -p z-cli        # or `z` once installed

# specify custom entry or output directory
z compile src/app.z --out build
```

`main/` is **optional**—the compiler will parse any `.z` files it finds there when resolving imports. The `out/` directory is created automatically if missing.
