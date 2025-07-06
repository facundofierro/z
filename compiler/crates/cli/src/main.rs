use clap::Parser;
use regex::Regex;

/// Z language compiler CLI
#[derive(Parser)]
#[command(author, version, about = "Z language compiler CLI")]
struct Args {
    /// First argument: either a source file to compile or a project name for package manager commands
    #[arg(value_name = "SOURCE_OR_PROJECT")]
    first_arg: String,

    /// Additional arguments: for compilation this is ignored, for project commands these are passed to the package manager
    #[arg(trailing_var_arg = true, allow_hyphen_values = true)]
    additional_args: Vec<String>,

    /// Output directory (defaults to ./out) - only used for compilation
    #[arg(short, long, default_value = "out")]
    out: String,
}

fn main() {
    let args = Args::parse();

    // Check if the first argument is a project directory (for package manager commands)
    let examples_project_path = std::path::Path::new("../examples").join(&args.first_arg);
    let current_project_path = std::path::Path::new("examples").join(&args.first_arg);

    // Try both relative paths (from compiler/ and from root)
    let project_path = if examples_project_path.exists() {
        Some(examples_project_path)
    } else if current_project_path.exists() {
        Some(current_project_path)
    } else {
        None
    };

    if let Some(project_dir) = project_path {
        if !args.additional_args.is_empty() {
            // This is a project management command
            handle_project_command(&project_dir, &args.additional_args);
            return;
        }
    }

    // This is a compilation command
    handle_compilation(&args.first_arg, &args.out);
}

fn handle_project_command(project_dir: &std::path::Path, command_args: &[String]) {
    println!("🔧 Running command in project: {}", project_dir.display());

    // Detect project types and their corresponding package managers
    let project_types = detect_project_types(project_dir);

    if project_types.is_empty() {
        eprintln!("❌ No recognized project types found in {}", project_dir.display());
        return;
    }

    // For each project type, run the appropriate package manager command
    for (project_name, project_type) in project_types {
        let project_path = project_dir.join("out").join(&project_name);

        if !project_path.exists() {
            println!("⚠️  Project {} does not exist yet. Run compilation first.", project_name);
            continue;
        }

        match project_type.as_str() {
            "next" => run_pnpm_command(&project_path, command_args, &project_name),
            "tauri" => run_tauri_command(&project_path, command_args, &project_name),
            "rust" => run_cargo_command(&project_path, command_args, &project_name),
            _ => println!("ℹ️  No package manager configured for {} ({})", project_name, project_type),
        }
    }
}

fn detect_project_types(project_dir: &std::path::Path) -> Vec<(String, String)> {
    let mut project_types = Vec::new();

    // Read the main.z file to detect project types
    let main_z_path = project_dir.join("main.z");
    if let Ok(content) = std::fs::read_to_string(&main_z_path) {
        let mut brace_depth = 0;

        for line in content.lines() {
            let trimmed = line.trim();

            // Check for top-level project declarations BEFORE updating brace count
            if brace_depth == 0 {
                if let Some(caps) = Regex::new(r"^([a-z]+)\s+([A-Za-z0-9_]+)\s*\{")
                    .unwrap()
                    .captures(trimmed)
                {
                    let target_type = caps[1].to_string();
                    let app_name = caps[2].to_string();
                    project_types.push((app_name, target_type));
                }
            }

            // Count braces to track nesting depth
            for char in trimmed.chars() {
                match char {
                    '{' => brace_depth += 1,
                    '}' => brace_depth -= 1,
                    _ => {}
                }
            }
        }
    }

    project_types
}

fn run_pnpm_command(project_path: &std::path::Path, args: &[String], project_name: &str) {
    println!("📦 Running pnpm {} in {} (Next.js)", args.join(" "), project_name);

    let mut cmd = std::process::Command::new("pnpm");
    cmd.current_dir(project_path);
    cmd.args(args);

    match cmd.status() {
        Ok(status) => {
            if status.success() {
                println!("✅ Command completed successfully for {}", project_name);
            } else {
                eprintln!("❌ Command failed for {} with exit code: {:?}", project_name, status.code());
            }
        }
        Err(e) => {
            eprintln!("❌ Failed to execute pnpm command for {}: {}", project_name, e);
            eprintln!("   Make sure pnpm is installed and available in your PATH");
        }
    }
}

fn run_tauri_command(project_path: &std::path::Path, args: &[String], project_name: &str) {
    if args.is_empty() {
        println!("📱 No command provided for Tauri project {}", project_name);
        return;
    }

    let first_arg = &args[0];
    let remaining_args = if args.len() > 1 { &args[1..] } else { &[] };

    // Determine the effective command based on the first argument
    let (base_cmd, effective_args) = match first_arg.as_str() {
        // Tauri-specific commands that need the tauri prefix
        "dev" | "build" | "info" | "init" | "icon" => {
            ("pnpm", vec!["tauri".to_string(), first_arg.to_string()])
        },
        // Package management commands that go directly to pnpm
        "install" | "add" | "remove" | "update" => {
            ("pnpm", vec![first_arg.to_string()])
        },
        // Pass through other commands as-is
        _ => {
            ("pnpm", vec![first_arg.to_string()])
        }
    };

    // Combine effective args with remaining args
    let mut all_args = effective_args;
    all_args.extend(remaining_args.iter().map(|s| s.to_string()));

    println!("📱 Running {} {} in {} (Tauri)", base_cmd, all_args.join(" "), project_name);

    let mut cmd = std::process::Command::new(base_cmd);
    cmd.current_dir(project_path);
    cmd.args(&all_args);

    match cmd.status() {
        Ok(status) => {
            if status.success() {
                println!("✅ Command completed successfully for {}", project_name);
            } else {
                eprintln!("❌ Command failed for {} with exit code: {:?}", project_name, status.code());
            }
        }
        Err(e) => {
            eprintln!("❌ Failed to execute {} command for {}: {}", base_cmd, project_name, e);
            eprintln!("   Make sure {} is installed and available in your PATH", base_cmd);
        }
    }
}

fn run_cargo_command(project_path: &std::path::Path, args: &[String], project_name: &str) {
    // Map common commands to appropriate cargo equivalents
    let effective_args = if args.is_empty() {
        vec!["build".to_string()]
    } else {
        let first_arg = &args[0];
        let mapped_args = match first_arg.as_str() {
            "install" => {
                // For Rust projects, "install" should map to building dependencies
                vec!["build".to_string()]
            },
            "start" | "dev" => {
                // Map start/dev to run
                vec!["run".to_string()]
            },
            _ => args.to_vec()
        };
        mapped_args
    };

    println!("🦀 Running cargo {} in {} (Rust)", effective_args.join(" "), project_name);

    let mut cmd = std::process::Command::new("cargo");
    cmd.current_dir(project_path);
    cmd.args(&effective_args);

    match cmd.status() {
        Ok(status) => {
            if status.success() {
                println!("✅ Command completed successfully for {}", project_name);
            } else {
                eprintln!("❌ Command failed for {} with exit code: {:?}", project_name, status.code());
            }
        }
        Err(e) => {
            eprintln!("❌ Failed to execute cargo command for {}: {}", project_name, e);
            eprintln!("   Make sure cargo is installed and available in your PATH");
        }
    }
}

fn handle_compilation(src_file: &str, out_dir: &str) {
    let src_path = std::path::Path::new(src_file);
    let out_path = std::path::Path::new(out_dir);

    let src_code = std::fs::read_to_string(src_path)
        .unwrap_or_else(|_| panic!("failed to read source {}", src_path.display()));

    // Get the directory containing the source file
    let src_dir = src_path.parent().unwrap_or(std::path::Path::new("."));

    // If output directory is relative and matches default, use source directory
    let effective_out_dir = if out_dir == "out" {
        src_dir.join("out")
    } else {
        out_path.to_path_buf()
    };

    // Ensure output directory exists
    std::fs::create_dir_all(&effective_out_dir).expect("failed to create output directory");

    z_compiler_core::compile(&src_code, &effective_out_dir);

    println!(
        "Compiled {} -> {}",
        src_path.display(),
        effective_out_dir.display()
    );
}