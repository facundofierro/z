import { workspace, Uri, window, TextDocument } from "vscode";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import {
    generateScaffoldedFile,
    getScaffoldingOptionsForParent,
    getNamespaceInfo,
    type ScaffoldRequest,
    type ScaffoldResult,
} from "./z-registry.js";

export interface ScaffoldingContext {
    workspaceRoot: string;
    currentFile: string;
    parentType: string;
    targetDirectory: string;
}

export interface CreateChildOptions {
    childName: string;
    childType?: string;
    parentType: string;
    targetDirectory: string;
    openAfterCreate?: boolean;
}

export class ZScaffoldingService {
    async createChildFile(options: CreateChildOptions): Promise<Uri | null> {
        try {
            const request: ScaffoldRequest = {
                parentType: options.parentType,
                childName: options.childName,
                childType: options.childType,
                targetDirectory: options.targetDirectory,
                includeContent: true,
            };

            const result = await this.generateFile(request);
            if (!result) {
                return null;
            }

            // Create directory if needed
            if (result.shouldCreateDirectory) {
                const childDir = join(
                    options.targetDirectory,
                    options.childName
                );
                if (!existsSync(childDir)) {
                    mkdirSync(childDir, { recursive: true });
                }
            }

            // Write the file
            const fileUri = Uri.file(result.filePath);
            await workspace.fs.writeFile(
                fileUri,
                Buffer.from(result.content, "utf8")
            );

            // Open the file if requested
            if (options.openAfterCreate) {
                const document = await workspace.openTextDocument(fileUri);
                await window.showTextDocument(document);
            }

            return fileUri;
        } catch (error) {
            window.showErrorMessage(
                `Failed to create child file: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
            return null;
        }
    }

    async scaffoldFromParent(
        parentType: string,
        workspaceRoot: string
    ): Promise<void> {
        const options = getScaffoldingOptionsForParent(parentType);

        if (!options.allowedChildTypes.length) {
            window.showErrorMessage(
                `No child types available for parent type: ${parentType}`
            );
            return;
        }

        // Get child name from user
        const childName = await window.showInputBox({
            prompt: `Enter name for new ${parentType} child`,
            placeHolder: "childName",
            validateInput: (value) => {
                if (!value || !value.trim()) {
                    return "Child name cannot be empty";
                }
                if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(value.trim())) {
                    return "Child name must be a valid identifier";
                }
                return null;
            },
        });

        if (!childName) {
            return;
        }

        // Get child type if multiple types are allowed
        let childType: string | undefined;
        if (
            options.allowsMultipleTypes &&
            options.allowedChildTypes.length > 1
        ) {
            const selectedType = await window.showQuickPick(
                options.allowedChildTypes.map((type) => ({
                    label: type,
                    description: `Create a ${type}`,
                })),
                {
                    placeHolder: "Select child type",
                }
            );

            if (!selectedType) {
                return;
            }

            childType = selectedType.label;
        } else {
            childType = options.defaultChildType;
        }

        // Determine target directory
        const targetDirectory = this.getTargetDirectory(
            parentType,
            workspaceRoot
        );

        await this.createChildFile({
            childName: childName.trim(),
            childType,
            parentType,
            targetDirectory,
            openAfterCreate: true,
        });
    }

    private async generateFile(
        request: ScaffoldRequest
    ): Promise<ScaffoldResult | null> {
        try {
            return generateScaffoldedFile(request);
        } catch (error) {
            console.error("Failed to generate scaffolded file:", error);
            return null;
        }
    }

    private getTargetDirectory(
        parentType: string,
        workspaceRoot: string
    ): string {
        // Map parent types to their conventional directories
        const directoryMap: Record<string, string> = {
            Routes: "app/routes",
            API: "app/api",
            Components: "app/components",
            Schema: "schema",
            App: "src",
            Frontend: "src/frontend",
            Backend: "src/backend",
            Config: "config",
            Activities: "src/activities",
            Services: "src/services",
            Pages: "src/pages",
            Windows: "src/windows",
            type: "src/types",
            fun: "src/functions",
            mod: "src/modules",
            class: "src/classes",
        };

        const relativeDir =
            directoryMap[parentType] || `src/${parentType.toLowerCase()}`;
        return join(workspaceRoot, relativeDir);
    }

    async createFromTemplate(
        templateName: string,
        fileName: string,
        targetDirectory: string
    ): Promise<Uri | null> {
        const templates: Record<string, string> = {
            "next-route": `@doc('Route handler')
@context('Auto-generated route with GET handler')

@params(request: Request)
@response(any)
fun GET(request) {
    return { message: 'Hello World' };
}

export default function Page() {
    return (
        <div>
            <h1>New Page</h1>
        </div>
    );
}`,
            "react-component": `@doc('React component')
@context('Auto-generated React component')

@params({ className?: string })
export default function Component({ className }) {
    return (
        <div className={className}>
            <h2>New Component</h2>
        </div>
    );
}`,
            "table-schema": `@doc('Database table')
@context('Auto-generated table schema')

id: string @primary @default(uuid())
createdAt: datetime @default(now())
updatedAt: datetime @updatedAt

// Add your fields here`,
            "enum-values": `@doc('Enumeration')
@context('Auto-generated enum')

value1 @doc('First value')
value2 @doc('Second value')

// Add your values here`,
        };

        const content = templates[templateName];
        if (!content) {
            window.showErrorMessage(`Unknown template: ${templateName}`);
            return null;
        }

        try {
            const filePath = join(targetDirectory, fileName);
            const fileUri = Uri.file(filePath);

            // Ensure directory exists
            const dir = dirname(filePath);
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true });
            }

            await workspace.fs.writeFile(fileUri, Buffer.from(content, "utf8"));

            const document = await workspace.openTextDocument(fileUri);
            await window.showTextDocument(document);

            return fileUri;
        } catch (error) {
            window.showErrorMessage(
                `Failed to create template: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
            return null;
        }
    }
}

export async function scaffoldChild(
    context: ScaffoldingContext
): Promise<void> {
    const service = new ZScaffoldingService();
    await service.scaffoldFromParent(context.parentType, context.workspaceRoot);
}

export async function createFileFromTemplate(
    templateName: string,
    workspaceRoot: string
): Promise<void> {
    const fileName = await window.showInputBox({
        prompt: "Enter file name (with extension)",
        placeHolder: "example.route.z",
        validateInput: (value) => {
            if (!value || !value.trim()) {
                return "File name cannot be empty";
            }
            if (!value.includes(".")) {
                return "File name must include extension";
            }
            return null;
        },
    });

    if (!fileName) {
        return;
    }

    const service = new ZScaffoldingService();
    await service.createFromTemplate(templateName, fileName, workspaceRoot);
}

export function extractParentTypeFromDocument(
    document: TextDocument
): string | null {
    const text = document.getText();
    const lines = text.split("\n");

    for (const line of lines) {
        const trimmed = line.trim();

        // Look for block declarations like "Routes {", "Schema {", etc.
        const blockMatch = trimmed.match(/^(\w+)\s*\{/);
        if (blockMatch) {
            return blockMatch[1];
        }

        // Look for target blocks like "next MyApp {"
        const targetMatch = trimmed.match(
            /^(next|swift|rust|tauri)\s+\w+\s*\{/
        );
        if (targetMatch) {
            // Look for the next namespace block
            continue;
        }
    }

    return null;
}

export function extractContextFromCursor(
    document: TextDocument,
    line: number
): ScaffoldingContext | null {
    const workspaceFolder = workspace.getWorkspaceFolder(document.uri);
    if (!workspaceFolder) {
        return null;
    }

    const parentType = extractParentTypeFromDocument(document);
    if (!parentType) {
        return null;
    }

    const currentFile = document.uri.fsPath;
    const workspaceRoot = workspaceFolder.uri.fsPath;

    // Determine target directory based on file location and parent type
    const fileDir = dirname(currentFile);
    const service = new ZScaffoldingService();
    const targetDirectory = (service as any).getTargetDirectory(
        parentType,
        workspaceRoot
    );

    return {
        workspaceRoot,
        currentFile,
        parentType,
        targetDirectory,
    };
}
