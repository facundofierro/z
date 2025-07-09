use z_parser::parse_source;
use z_ast::{Element, Node};
use std::collections::HashMap;
use std::fs;
use std::path::Path;

mod compilers;
use compilers::{get_compiler, TargetCompiler};

// Load the standard library registry from shared location
fn load_registry() -> serde_json::Value {
    let registry_json = include_str!("../../../shared/registry.json");
    serde_json::from_str(registry_json).expect("Invalid registry.json")
}

pub fn compile(source: &str, output_base_dir: &std::path::Path) {
    let registry = load_registry();

    // Parse source to get top-level elements
    match parse_source(source) {
        Ok(ast) => {
            let targets = detect_targets(&ast);

            if targets.is_empty() {
                eprintln!("No target blocks found in entry file.");
                return;
            }

            println!("Detected targets: {}", targets.join(", "));

                        // Validate and compile each target
            for target_with_name in &targets {
                // Parse target:name format
                let parts: Vec<&str> = target_with_name.split(':').collect();
                if parts.len() != 2 {
                    eprintln!("  ❌ Invalid target format: {} (expected target:name)", target_with_name);
                    continue;
                }

                let target_type = parts[0];
                let app_name = parts[1];

                if let Some(target_info) = registry["targets"][target_type].as_object() {
                    println!("  {} {} - {}", target_type, app_name, target_info["description"].as_str().unwrap_or(""));

                    // Get the appropriate compiler for this target type
                    if let Some(compiler) = get_compiler(target_type) {
                        match compile_target(&ast, &*compiler, target_type, app_name, output_base_dir) {
                            Ok(_) => println!("  ✅ {} {} compilation successful", target_type, app_name),
                            Err(e) => eprintln!("  ❌ {} {} compilation failed: {}", target_type, app_name, e),
                        }
                    } else {
                        eprintln!("  ❌ No compiler available for target: {}", target_type);
                    }
                } else {
                    eprintln!("  {} - Unknown target type (not in registry)", target_type);
                }
            }
        }
        Err(e) => {
            eprintln!("Parse error: {}", e);
        }
    }
}

fn compile_target(ast: &Element, compiler: &dyn TargetCompiler, _target_type: &str, app_name: &str, output_base_dir: &std::path::Path) -> Result<(), String> {
    // Create app-specific output directory
    let output_dir = output_base_dir.join(app_name);
    fs::create_dir_all(&output_dir)
        .map_err(|e| format!("Failed to create output directory {}: {}", output_dir.display(), e))?;

    // Try directory-based compilation first (for complex project structures like Next.js)
    if let Some(result) = compiler.compile_to_directory(ast, &output_dir) {
        result?;
        println!("  📁 Project created in: {}", output_dir.display());
        return Ok(());
    }

    // Fallback to standard single-file compilation
    let generated_code = compiler.compile(ast)?;

    // Write the generated code to appropriate files
    let output_file = output_dir.join(format!("generated.{}", compiler.file_extension()));
    fs::write(&output_file, generated_code)
        .map_err(|e| format!("Failed to write {}: {}", output_file.display(), e))?;

    println!("  📁 Output written to: {}", output_file.display());
    Ok(())
}

fn detect_targets(ast: &Element) -> Vec<String> {
    ast.children.iter()
        .filter_map(|node| match node {
            Node::Element(element) => Some(element.name.clone()), // This is already in "target:name" format
            _ => None,
        })
        .collect()
}