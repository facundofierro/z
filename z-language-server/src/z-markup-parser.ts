import { DiagnosticSeverity } from "vscode-languageserver";
import { loadRegistry } from "./z-registry.js";

export interface MarkupDiagnostic {
    severity: DiagnosticSeverity;
    range: {
        start: { line: number; character: number };
        end: { line: number; character: number };
    };
    message: string;
    source: string;
}

interface ValidationContext {
    elementType: string;
    elementName: string;
    allowedChildren: string[];
    mode: "markup" | "code";
    line: number;
}

interface ParsedElement {
    keyword: string;
    name: string;
    line: number;
    startChar: number;
    endChar: number;
    isClosing?: boolean;
}

export class ZMarkupParser {
    private registry: any;
    private contextStack: ValidationContext[] = [];
    private diagnostics: MarkupDiagnostic[] = [];

    constructor() {
        this.registry = loadRegistry();
    }

    public validateZMarkup(text: string): MarkupDiagnostic[] {
        this.diagnostics = [];
        this.contextStack = [];

        const lines = text.split(/\r?\n/);

        for (let i = 0; i < lines.length; i++) {
            this.validateLine(lines[i], i);
        }

        return this.diagnostics;
    }

    private validateLine(line: string, lineNumber: number): void {
        const trimmedLine = line.trim();

        // Skip empty lines and comments
        if (!trimmedLine || trimmedLine.startsWith("//")) {
            return;
        }

        // Check for closing braces
        if (trimmedLine === "}") {
            this.popContext();
            return;
        }

        // Parse element declaration: "keyword Name {" or "keyword Name"
        const elementMatch = line.match(
            /^(\s*)([a-zA-Z][a-zA-Z0-9_]*)\s+([a-zA-Z][a-zA-Z0-9_-]*)\s*(\{?)(.*)$/
        );

        if (elementMatch) {
            const [, indent, keyword, name, openBrace] = elementMatch;
            const indentLevel = Math.floor(indent.length / 2); // Assuming 2-space indentation

            const element: ParsedElement = {
                keyword,
                name,
                line: lineNumber,
                startChar: indent.length,
                endChar: indent.length + keyword.length,
            };

            this.validateElement(element, indentLevel);

            // If opening brace, push context
            if (openBrace === "{") {
                this.pushContext(keyword, name, lineNumber);
            }
            return;
        }

        // Parse simple child elements: "  childName" or dynamic routes "[slug]"
        const childMatch = line.match(
            /^(\s+)([a-zA-Z][a-zA-Z0-9_]*|\[[a-zA-Z][a-zA-Z0-9_]*\])\s*(\{?)(.*)$/
        );
        if (childMatch) {
            const [, indent, childName, openBrace] = childMatch;

            // Clean up dynamic route syntax
            const cleanChildName = childName.replace(/^\[|\]$/g, "");

            const element: ParsedElement = {
                keyword: cleanChildName,
                name: cleanChildName,
                line: lineNumber,
                startChar: indent.length,
                endChar: indent.length + childName.length,
            };

            this.validateChild(element);

            // If this child has opening brace, it becomes a context
            if (openBrace === "{") {
                this.pushContext(cleanChildName, cleanChildName, lineNumber);
            }
            return;
        }

        // Parse namespace declaration: "  Namespace {"
        const namespaceMatch = line.match(
            /^(\s+)([A-Z][a-zA-Z0-9_]*)\s*(\{?)(.*)$/
        );
        if (namespaceMatch) {
            const [, indent, namespaceName, openBrace] = namespaceMatch;

            const element: ParsedElement = {
                keyword: namespaceName,
                name: namespaceName,
                line: lineNumber,
                startChar: indent.length,
                endChar: indent.length + namespaceName.length,
            };

            this.validateChild(element);

            // If opening brace, push context for this namespace
            if (openBrace === "{") {
                this.pushContext(namespaceName, namespaceName, lineNumber);
            }
        }
    }

    private validateElement(element: ParsedElement, indentLevel: number): void {
        const currentContext = this.getCurrentContext();

        // Validate element name pattern
        this.validateElementName(element);

        // Root level validation
        if (indentLevel === 0) {
            this.validateRootElement(element);
        } else {
            // Child element validation
            this.validateChildElement(element, currentContext);
        }
    }

    private validateChild(element: ParsedElement): void {
        const currentContext = this.getCurrentContext();

        if (!currentContext) {
            this.addDiagnostic(
                element,
                `Unexpected child element '${element.keyword}' outside of any parent context`,
                DiagnosticSeverity.Error
            );
            return;
        }

        // Check if child is allowed in current context
        if (!this.isChildAllowed(element.keyword, currentContext)) {
            const allowedChildren = currentContext.allowedChildren.join(", ");
            this.addDiagnostic(
                element,
                `'${element.keyword}' is not allowed in '${currentContext.elementType}'. Allowed children: ${allowedChildren}`,
                DiagnosticSeverity.Error
            );
        }
    }

    private validateRootElement(element: ParsedElement): void {
        // Check if it's a valid workspace
        if (element.keyword === "workspace") {
            if (!this.registry.targets?.workspace) {
                this.addDiagnostic(
                    element,
                    "workspace is not supported in this Z language version",
                    DiagnosticSeverity.Error
                );
            }
            return;
        }

        // Check if it's a valid target that can be root element
        const targetDef = this.registry.targets?.[element.keyword];
        if (targetDef) {
            // All targets can be root elements by default
            return;
        }

        // Unknown root element
        const validRootElements = [
            "workspace",
            ...Object.keys(this.registry.targets || {}),
        ];

        this.addDiagnostic(
            element,
            `Unknown root element '${
                element.keyword
            }'. Valid root elements: ${validRootElements.join(", ")}`,
            DiagnosticSeverity.Error
        );
    }

    private validateChildElement(
        element: ParsedElement,
        context: ValidationContext | null
    ): void {
        if (!context) {
            this.addDiagnostic(
                element,
                `Unexpected element '${element.keyword}' - no parent context`,
                DiagnosticSeverity.Error
            );
            return;
        }

        // Check if child is allowed in current context
        if (!this.isChildAllowed(element.keyword, context)) {
            const allowedChildren = context.allowedChildren.join(", ");
            this.addDiagnostic(
                element,
                `'${element.keyword}' is not allowed in '${context.elementType}'. Allowed children: ${allowedChildren}`,
                DiagnosticSeverity.Error
            );
        }
    }

    private validateElementName(element: ParsedElement): void {
        // Basic element name validation - allow alphanumeric and underscore/dash
        const pattern = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
        if (!pattern.test(element.name)) {
            this.addDiagnostic(
                element,
                `Invalid element name '${element.name}'. Must start with a letter and contain only letters, numbers, underscores, and dashes`,
                DiagnosticSeverity.Error
            );
        }

        // Check reserved names
        const reservedNames = [
            "function",
            "class",
            "interface",
            "let",
            "const",
            "var",
        ];
        if (reservedNames.includes(element.name)) {
            this.addDiagnostic(
                element,
                `'${element.name}' is a reserved name and cannot be used`,
                DiagnosticSeverity.Error
            );
        }
    }

    private isChildAllowed(
        childKeyword: string,
        context: ValidationContext
    ): boolean {
        // If context allows all children
        if (context.allowedChildren.includes("*")) {
            return true;
        }

        // Direct match
        if (context.allowedChildren.includes(childKeyword)) {
            return true;
        }

        return false;
    }

    private pushContext(keyword: string, name: string, line: number): void {
        let allowedChildren: string[] = [];
        let mode: "markup" | "code" = "markup";

        // Determine allowed children and mode based on element type
        if (keyword === "workspace") {
            allowedChildren = Object.keys(this.registry.targets || {});
            mode = "markup";
        } else if (this.registry.targets?.[keyword]) {
            allowedChildren =
                this.registry.targets[keyword].allowedChildren || [];
            mode = this.registry.targets[keyword].mode || "markup";
        } else if (this.registry.namespaces?.[keyword]) {
            allowedChildren =
                this.registry.namespaces[keyword].allowedChildren || [];
            mode = "markup";
        } else {
            // For unrecognized elements (like route names), allow any children
            // This handles cases like "posts { [slug] }" where posts is a route
            allowedChildren = ["*"];
            mode = "markup";
        }

        const context: ValidationContext = {
            elementType: keyword,
            elementName: name,
            allowedChildren,
            mode,
            line,
        };

        this.contextStack.push(context);
    }

    private popContext(): void {
        this.contextStack.pop();
    }

    private getCurrentContext(): ValidationContext | null {
        return this.contextStack[this.contextStack.length - 1] || null;
    }

    private addDiagnostic(
        element: ParsedElement,
        message: string,
        severity: DiagnosticSeverity
    ): void {
        this.diagnostics.push({
            severity,
            range: {
                start: { line: element.line, character: element.startChar },
                end: { line: element.line, character: element.endChar },
            },
            message,
            source: "z-markup",
        });
    }
}
