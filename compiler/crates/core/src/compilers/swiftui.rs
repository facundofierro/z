use z_ast::{Element, Node};
use super::TargetCompiler;

pub struct SwiftUICompiler;

impl SwiftUICompiler {
    pub fn new() -> Self {
        Self
    }
}

impl TargetCompiler for SwiftUICompiler {
    fn compile(&self, ast: &Element) -> Result<String, String> {
        let mut output = String::new();

        // Generate main App structure
        output.push_str(&self.generate_app_file(ast)?);
        output.push_str("\n\n");

        // Generate ContentView
        output.push_str(&self.generate_content_view(ast)?);
        output.push_str("\n\n");

        // Generate Package.swift
        output.push_str(&self.generate_package_swift());

        Ok(output)
    }

    fn target_name(&self) -> &str {
        "SwiftUI"
    }

    fn file_extension(&self) -> &str {
        "swift"
    }
}

impl SwiftUICompiler {
    fn generate_app_file(&self, _ast: &Element) -> Result<String, String> {
        let app_swift = r#"// ZGeneratedApp.swift
import SwiftUI

@main
struct ZGeneratedApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}"#;
        Ok(app_swift.to_string())
    }

    fn generate_content_view(&self, ast: &Element) -> Result<String, String> {
        let mut content_view = String::new();
        content_view.push_str("// ContentView.swift\n");
        content_view.push_str("import SwiftUI\n\n");
        content_view.push_str("struct ContentView: View {\n");
        content_view.push_str("    var body: some View {\n");
        content_view.push_str("        NavigationView {\n");
        content_view.push_str("            VStack(spacing: 20) {\n");
        content_view.push_str("                Text(\"Z Generated App\")\n");
        content_view.push_str("                    .font(.largeTitle)\n");
        content_view.push_str("                    .fontWeight(.bold)\n");
        content_view.push_str("                    .foregroundColor(.primary)\n\n");

        // Extract and generate child components
        for child in &ast.children {
            if let Node::Element(element) = child {
                match element.name.as_str() {
                    "App" => content_view.push_str(&self.generate_app_component(element)),
                    "Components" => content_view.push_str(&self.generate_components_component(element)),
                    _ => content_view.push_str(&format!("                // Unknown component: {}\n", element.name)),
                }
            }
        }

        content_view.push_str("                Spacer()\n");
        content_view.push_str("            }\n");
        content_view.push_str("            .padding()\n");
        content_view.push_str("            .navigationTitle(\"Z App\")\n");
        content_view.push_str("        }\n");
        content_view.push_str("    }\n");
        content_view.push_str("}\n\n");
        content_view.push_str("#Preview {\n");
        content_view.push_str("    ContentView()\n");
        content_view.push_str("}\n");

        Ok(content_view)
    }

    fn generate_app_component(&self, _element: &Element) -> String {
        r#"                VStack {
                    Image(systemName: "app.badge")
                        .font(.system(size: 40))
                        .foregroundColor(.blue)
                    Text("App Component")
                        .font(.headline)
                }
                .padding()
                .background(Color.blue.opacity(0.1))
                .cornerRadius(10)

"#.to_string()
    }

    fn generate_components_component(&self, _element: &Element) -> String {
        r#"                VStack {
                    Image(systemName: "puzzlepiece.extension")
                        .font(.system(size: 40))
                        .foregroundColor(.green)
                    Text("Components")
                        .font(.headline)
                }
                .padding()
                .background(Color.green.opacity(0.1))
                .cornerRadius(10)

"#.to_string()
    }

    fn generate_package_swift(&self) -> String {
        r#"// Package.swift
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "ZGeneratedApp",
    platforms: [
        .iOS(.v15),
        .macOS(.v12)
    ],
    products: [
        .executable(
            name: "ZGeneratedApp",
            targets: ["ZGeneratedApp"]
        ),
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "ZGeneratedApp",
            dependencies: []
        ),
    ]
)"#.to_string()
    }
}