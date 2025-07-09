use z_ast::{Element, Node};
use super::TargetCompiler;
use std::fs;
use std::path::Path;

pub struct NextJSCompiler;

impl NextJSCompiler {
    pub fn new() -> Self {
        Self
    }
}

impl TargetCompiler for NextJSCompiler {
    fn compile(&self, ast: &Element) -> Result<String, String> {
        // This method now just returns a summary, actual file creation happens in compile_to_directory
        Ok("Next.js project files generated successfully".to_string())
    }

    fn target_name(&self) -> &str {
        "NextJS"
    }

    fn file_extension(&self) -> &str {
        "tsx"
    }

    fn compile_to_directory(&self, ast: &Element, output_dir: &std::path::Path) -> Option<Result<(), String>> {
        Some(self.create_nextjs_project(ast, output_dir))
    }
}

impl NextJSCompiler {
    pub fn create_nextjs_project(&self, ast: &Element, output_dir: &Path) -> Result<(), String> {
        // Create the full Next.js project structure
        self.create_project_structure(output_dir)?;
        self.create_package_json(output_dir)?;
        self.create_pnpm_workspace(output_dir)?;
        self.create_next_config(output_dir)?;
        self.create_tailwind_config(output_dir)?;
        self.create_postcss_config(output_dir)?;
        self.create_typescript_config(output_dir)?;
        self.create_app_structure(output_dir, ast)?;
        self.create_shadcn_config(output_dir)?;
        self.create_globals_css(output_dir)?;

        Ok(())
    }

        fn create_project_structure(&self, output_dir: &Path) -> Result<(), String> {
        let dirs = [
            "app",
            "app/api",
            "app/globals",
            "components",
            "components/ui",
            "lib",
            "public",
            "styles",
        ];

        for dir in &dirs {
            let dir_path = output_dir.join(dir);
            fs::create_dir_all(&dir_path)
                .map_err(|e| format!("Failed to create directory {}: {}", dir_path.display(), e))?;
        }

        Ok(())
    }

    fn create_package_json(&self, output_dir: &Path) -> Result<(), String> {
        let package_json = r#"{
  "name": "z-generated-nextjs",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-icons": "^1.3.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "lucide-react": "^0.294.0",
    "tailwind-merge": "^2.0.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@types/node": "^20.9.0",
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.53.0",
    "eslint-config-next": "14.0.0",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "typescript": "^5.2.2"
  },
  "packageManager": "pnpm@8.10.0"
}"#;

        let file_path = output_dir.join("package.json");
        fs::write(file_path, package_json)
            .map_err(|e| format!("Failed to write package.json: {}", e))?;

        Ok(())
    }

    fn create_pnpm_workspace(&self, output_dir: &Path) -> Result<(), String> {
        let pnpm_workspace = r#"packages:
  - "."
"#;

        let file_path = output_dir.join("pnpm-workspace.yaml");
        fs::write(file_path, pnpm_workspace)
            .map_err(|e| format!("Failed to write pnpm-workspace.yaml: {}", e))?;

        Ok(())
    }

    fn create_next_config(&self, output_dir: &Path) -> Result<(), String> {
        let next_config = r#"/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
}

module.exports = nextConfig
"#;

        let file_path = output_dir.join("next.config.js");
        fs::write(file_path, next_config)
            .map_err(|e| format!("Failed to write next.config.js: {}", e))?;

        Ok(())
    }

    fn create_tailwind_config(&self, output_dir: &Path) -> Result<(), String> {
        let tailwind_config = r#"/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
"#;

        let file_path = output_dir.join("tailwind.config.js");
        fs::write(file_path, tailwind_config)
            .map_err(|e| format!("Failed to write tailwind.config.js: {}", e))?;

        Ok(())
    }

    fn create_postcss_config(&self, output_dir: &Path) -> Result<(), String> {
        let postcss_config = r#"module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
"#;

        let file_path = output_dir.join("postcss.config.js");
        fs::write(file_path, postcss_config)
            .map_err(|e| format!("Failed to write postcss.config.js: {}", e))?;

        Ok(())
    }

    fn create_typescript_config(&self, output_dir: &Path) -> Result<(), String> {
        let tsconfig = r#"{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
"#;

        let file_path = output_dir.join("tsconfig.json");
        fs::write(file_path, tsconfig)
            .map_err(|e| format!("Failed to write tsconfig.json: {}", e))?;

        Ok(())
    }

    fn create_app_structure(&self, output_dir: &Path, ast: &Element) -> Result<(), String> {
        // Create layout.tsx
        let layout_tsx = r#"import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Z Generated App',
  description: 'Generated by Z compiler',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
"#;

        let layout_path = output_dir.join("app/layout.tsx");
        fs::write(layout_path, layout_tsx)
            .map_err(|e| format!("Failed to write app/layout.tsx: {}", e))?;

        // Create main page.tsx
        let page_tsx = self.generate_main_page(ast)?;
        let page_path = output_dir.join("app/page.tsx");
        fs::write(page_path, page_tsx)
            .map_err(|e| format!("Failed to write app/page.tsx: {}", e))?;

        // Create utils
        self.create_utils(output_dir)?;

        Ok(())
    }

    fn generate_main_page(&self, ast: &Element) -> Result<String, String> {
        let mut imports = Vec::new();
        let mut components = Vec::new();

        // Extract components from AST
        for child in &ast.children {
            if let Node::Element(element) = child {
                match element.name.split(':').next().unwrap_or("") {
                    "next" => {
                        // This is our target, process its children
                        for app_child in &element.children {
                            if let Node::Element(section) = app_child {
                                match section.name.as_str() {
                                    "Routes" => {
                                        imports.push("import { Button } from '@/components/ui/button'");
                                        components.push(self.generate_routes_section(section));
                                    },
                                    "API" => {
                                        components.push(self.generate_api_section(section));
                                    },
                                    "Components" => {
                                        components.push(self.generate_components_section(section));
                                    },
                                    _ => {}
                                }
                            }
                        }
                    },
                    _ => {}
                }
            }
        }

        let mut page = String::new();

        if !imports.is_empty() {
            for import in imports {
                page.push_str(&format!("{}\n", import));
            }
            page.push('\n');
        }

        page.push_str("export default function Home() {\n");
        page.push_str("  return (\n");
        page.push_str("    <div className=\"min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800\">\n");
        page.push_str("      <div className=\"container mx-auto px-4 py-8\">\n");
        page.push_str("        <div className=\"text-center mb-12\">\n");
        page.push_str("          <h1 className=\"text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4\">\n");
        page.push_str("            Welcome to Your Z Generated App\n");
        page.push_str("          </h1>\n");
        page.push_str("          <p className=\"text-xl text-slate-600 dark:text-slate-400\">\n");
        page.push_str("            Built with Next.js, Tailwind CSS, and shadcn/ui\n");
        page.push_str("          </p>\n");
        page.push_str("        </div>\n\n");

        for component in components {
            page.push_str("        <div className=\"mb-8\">\n");
            page.push_str(&format!("          {}\n", component));
            page.push_str("        </div>\n");
        }

        page.push_str("      </div>\n");
        page.push_str("    </div>\n");
        page.push_str("  )\n");
        page.push_str("}\n");

        Ok(page)
    }

    fn generate_routes_section(&self, _element: &Element) -> String {
        r#"<div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">🛣️ Routes</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">Your application routes are ready to be implemented.</p>
            <Button variant="outline">Explore Routes</Button>
          </div>"#.to_string()
    }

    fn generate_api_section(&self, _element: &Element) -> String {
        r#"<div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">🔌 API</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">API endpoints are configured and ready for development.</p>
            <div className="bg-slate-50 dark:bg-slate-700 rounded p-3">
              <code className="text-sm text-slate-700 dark:text-slate-300">GET /api/example</code>
            </div>
          </div>"#.to_string()
    }

    fn generate_components_section(&self, _element: &Element) -> String {
        r#"<div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">🧩 Components</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">Reusable components with shadcn/ui integration.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-700 rounded p-4 text-center">
                <div className="text-2xl mb-2">📱</div>
                <p className="text-sm font-medium">Responsive</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700 rounded p-4 text-center">
                <div className="text-2xl mb-2">🎨</div>
                <p className="text-sm font-medium">Styled</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700 rounded p-4 text-center">
                <div className="text-2xl mb-2">⚡</div>
                <p className="text-sm font-medium">Fast</p>
              </div>
            </div>
          </div>"#.to_string()
    }

    fn create_utils(&self, output_dir: &Path) -> Result<(), String> {
        let utils_ts = r#"import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
"#;

        let file_path = output_dir.join("lib/utils.ts");
        fs::write(file_path, utils_ts)
            .map_err(|e| format!("Failed to write lib/utils.ts: {}", e))?;

        Ok(())
    }

    fn create_shadcn_config(&self, output_dir: &Path) -> Result<(), String> {
        let components_json = r#"{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
"#;

        let file_path = output_dir.join("components.json");
        fs::write(file_path, components_json)
            .map_err(|e| format!("Failed to write components.json: {}", e))?;

        // Create a basic Button component
        self.create_button_component(output_dir)?;

        Ok(())
    }

    fn create_button_component(&self, output_dir: &Path) -> Result<(), String> {
        let button_tsx = r#"import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
"#;

        let file_path = output_dir.join("components/ui/button.tsx");
        fs::write(file_path, button_tsx)
            .map_err(|e| format!("Failed to write components/ui/button.tsx: {}", e))?;

        Ok(())
    }

    fn create_globals_css(&self, output_dir: &Path) -> Result<(), String> {
        let globals_css = r#"@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;

    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --accent: 210 40% 96%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;

    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;

    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
"#;

        let file_path = output_dir.join("app/globals.css");
        fs::write(file_path, globals_css)
            .map_err(|e| format!("Failed to write app/globals.css: {}", e))?;

        Ok(())
    }

}