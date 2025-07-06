pub mod nextjs;
pub mod swiftui;
pub mod rust;
pub mod tauri;

use z_ast::Element;

/// Trait that all target compilers must implement
pub trait TargetCompiler {
    /// Generate code for the given AST element
    fn compile(&self, ast: &Element) -> Result<String, String>;

    /// Get the target name this compiler handles
    fn target_name(&self) -> &str;

    /// Get the file extension for generated files
    fn file_extension(&self) -> &str;

    /// Compile directly to a directory (for complex project structures)
    /// Returns None if the compiler doesn't support directory compilation
    fn compile_to_directory(&self, _ast: &Element, _output_dir: &std::path::Path) -> Option<Result<(), String>> {
        None
    }
}

/// Factory function to get the appropriate compiler for a target
pub fn get_compiler(target: &str) -> Option<Box<dyn TargetCompiler>> {
    match target {
        "next" => Some(Box::new(nextjs::NextJSCompiler::new())),
        "swift" => Some(Box::new(swiftui::SwiftUICompiler::new())),
        "rust" => Some(Box::new(rust::RustCompiler::new())),
        "tauri" => Some(Box::new(tauri::TauriCompiler::new())),
        _ => None,
    }
}