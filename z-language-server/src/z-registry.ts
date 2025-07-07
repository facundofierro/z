import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export interface ScaffoldingConfig {
    fileExtension?: string;
    fileExtensions?: Record<string, string>;
    parseMode?: "code" | "markup";
    parseModes?: Record<string, "code" | "markup">;
    directoryNesting: boolean;
}

export interface TargetInfo {
    description: string;
    mode: "markup" | "code";
    allowedChildren: string[];
    defaultPackages: Record<string, string>;
    compiler: string;
}

export interface NamespaceInfo {
    aliasOf: string;
    description: string;
    childType?: string;
    childMode?: "single" | "multiple";
    allowedChildren?: string[];
    role?: string;
    scaffolding?: ScaffoldingConfig;
}

export interface ChildTypeInfo {
    description: string;
    parseMode: "code" | "markup";
    fileExtension: string | null;
    allowsNesting: boolean;
    scaffoldingType: string;
    template?: string;
}

export interface Registry {
    version: string;
    targets: Record<string, TargetInfo>;
    namespaces: Record<string, NamespaceInfo>;
    annotations: Record<
        string,
        {
            description: string;
            usage: string;
        }
    >;
    childTypes?: Record<string, ChildTypeInfo>;
}

export interface ScaffoldRequest {
    parentType: string;
    childName: string;
    childType?: string;
    targetDirectory: string;
    includeContent?: boolean;
}

export interface ScaffoldResult {
    filePath: string;
    content: string;
    parseMode: "code" | "markup";
    shouldCreateDirectory: boolean;
}

let cachedRegistry: Registry | null = null;

export function loadRegistry(): Registry {
    if (cachedRegistry) {
        return cachedRegistry;
    }

    // Try to find registry.json relative to workspace or fallback to embedded
    const possiblePaths = [
        // Relative to workspace root
        "./compiler/stdlib/registry.json",
        // Relative to LSP directory
        "../compiler/stdlib/registry.json",
        // Embedded fallback
        join(dirname(fileURLToPath(import.meta.url)), "embedded-registry.json"),
    ];

    for (const registryPath of possiblePaths) {
        try {
            if (existsSync(registryPath)) {
                const content = readFileSync(registryPath, "utf8");
                const registry = JSON.parse(content) as Registry;
                cachedRegistry = registry;
                return registry;
            }
        } catch (error) {
            // Continue to next path
        }
    }

    throw new Error("Could not load Z language registry");
}

export function getTargetCompletions(): Array<{
    label: string;
    detail: string;
}> {
    const registry = loadRegistry();
    return Object.entries(registry.targets).map(([name, info]) => ({
        label: name,
        detail: info.description,
    }));
}

export function getChildrenForTarget(targetName: string): string[] {
    const registry = loadRegistry();
    const target = registry.targets[targetName];
    return target ? target.allowedChildren : [];
}

export function getNamespaceInfo(namespaceName: string): NamespaceInfo | null {
    const registry = loadRegistry();
    return registry.namespaces[namespaceName] || null;
}

export function getChildTypeInfo(childType: string): ChildTypeInfo | null {
    const registry = loadRegistry();
    return registry.childTypes?.[childType] || null;
}

export function validateChild(
    parentTarget: string,
    childName: string
): boolean {
    const allowedChildren = getChildrenForTarget(parentTarget);
    return allowedChildren.includes("*") || allowedChildren.includes(childName);
}

export function getScaffoldingConfig(
    namespaceName: string
): ScaffoldingConfig | null {
    const namespaceInfo = getNamespaceInfo(namespaceName);
    return namespaceInfo?.scaffolding || null;
}

export function generateScaffoldedFile(
    request: ScaffoldRequest
): ScaffoldResult {
    const namespaceInfo = getNamespaceInfo(request.parentType);
    if (!namespaceInfo) {
        throw new Error(`Unknown parent type: ${request.parentType}`);
    }

    const scaffolding = namespaceInfo.scaffolding;
    if (!scaffolding) {
        throw new Error(
            `No scaffolding configuration for: ${request.parentType}`
        );
    }

    // Determine child type and file extension
    let childType: string;
    let fileExtension: string;
    let parseMode: "code" | "markup";

    if (namespaceInfo.childMode === "single") {
        // Single type children - use the default child type
        childType = namespaceInfo.childType || "component";
        fileExtension = scaffolding.fileExtension || ".z";
        parseMode = scaffolding.parseMode || "code";
    } else {
        // Multiple type children - use explicit child type
        if (!request.childType) {
            throw new Error(
                "Child type must be specified for multiple-type parents"
            );
        }
        childType = request.childType;
        fileExtension = scaffolding.fileExtensions?.[childType] || ".z";
        parseMode = scaffolding.parseModes?.[childType] || "code";
    }

    // Generate file path
    const fileName = `${request.childName}${fileExtension}`;
    const filePath = join(request.targetDirectory, fileName);

    // Generate content based on scaffolding type
    const childTypeInfo = getChildTypeInfo(childType);
    const content = generateTemplateContent(
        childType,
        request.childName,
        childTypeInfo?.scaffoldingType || "basic",
        parseMode
    );

    return {
        filePath,
        content,
        parseMode,
        shouldCreateDirectory:
            scaffolding.directoryNesting &&
            childTypeInfo?.allowsNesting !== false,
    };
}

function generateTemplateContent(
    childType: string,
    childName: string,
    scaffoldingType: string,
    parseMode: "code" | "markup"
): string {
    switch (scaffoldingType) {
        case "tsx-like":
            return generateTsxLikeTemplate(childName, childType);
        case "field-list":
            return generateFieldListTemplate(childName);
        case "value-list":
            return generateValueListTemplate(childName);
        case "properties-only":
            return generatePropertiesTemplate(childName);
        case "class-based":
            return generateClassTemplate(childName);
        case "type-definition":
            return generateTypeTemplate(childName);
        case "interface-definition":
            return generateInterfaceTemplate(childName);
        case "function-definition":
            return generateFunctionTemplate(childName);
        default:
            return generateBasicTemplate(childName, parseMode);
    }
}

function generateTsxLikeTemplate(name: string, type: string): string {
    if (type === "route") {
        return `@doc('${name} route')
@context('Auto-generated ${type} for ${name}')

@params(request: Request)
@response(any)
fun GET(request) {
    // TODO: Implement GET handler
    return { message: 'Hello from ${name}' };
}

export default function ${capitalize(name)}Page() {
    return (
        <div className='${name}-page'>
            <h1>${capitalize(name)}</h1>
            <p>This page was auto-generated. Update this content.</p>
        </div>
    );
}`;
    } else {
        return `@doc('${name} component')
@context('Auto-generated ${type} component')

@params({ className?: string })
export default function ${capitalize(name)}({ className }) {
    return (
        <div className={\`${name} \${className || ''}\`}>
            <h2>${capitalize(name)}</h2>
            <p>Auto-generated component. Add your content here.</p>
        </div>
    );
}`;
    }
}

function generateFieldListTemplate(name: string): string {
    return `@doc('${name} table definition')
@context('Auto-generated database table schema')

id: string @primary @default(uuid())
createdAt: datetime @default(now())
updatedAt: datetime @updatedAt

// TODO: Add your table fields here`;
}

function generateValueListTemplate(name: string): string {
    return `@doc('${name} enumeration')
@context('Auto-generated enum values')

value1 @doc('First enum value')
value2 @doc('Second enum value')

// TODO: Define your enum values here`;
}

function generatePropertiesTemplate(name: string): string {
    return `@doc('${name} configuration')
@context('Auto-generated configuration object')

// TODO: Add your configuration properties here
setting1: 'default_value'
setting2: 42 @type(number)
enabled: true @type(boolean)`;
}

function generateClassTemplate(name: string): string {
    return `@doc('${name} service')
@context('Auto-generated service class')

class ${capitalize(name)}Service {
    constructor() {
        // TODO: Initialize service
    }

    @params(data: any)
    @response(any)
    async process(data) {
        // TODO: Implement service logic
        return data;
    }
}

export default ${capitalize(name)}Service;`;
}

function generateTypeTemplate(name: string): string {
    return `@doc('${name} type definition')
@context('Auto-generated type definition')

export type ${capitalize(name)} = {
    id: string;
    // TODO: Add your type properties here
};`;
}

function generateInterfaceTemplate(name: string): string {
    return `@doc('${name} interface definition')
@context('Auto-generated interface definition')

export interface ${capitalize(name)} {
    id: string;
    // TODO: Add your interface properties here
}`;
}

function generateFunctionTemplate(name: string): string {
    return `@doc('${name} function')
@context('Auto-generated function')

@params(input: any)
@response(any)
export function ${name}(input) {
    // TODO: Implement function logic
    return input;
}`;
}

function generateBasicTemplate(
    name: string,
    parseMode: "code" | "markup"
): string {
    if (parseMode === "markup") {
        return `@doc('${name}')
@context('Auto-generated ${name}')

// TODO: Add your content here`;
    } else {
        return `@doc('${name}')
@context('Auto-generated ${name}')

// TODO: Add your implementation here
export default function ${capitalize(name)}() {
    return null;
}`;
    }
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getScaffoldingOptionsForParent(parentType: string): {
    allowsMultipleTypes: boolean;
    defaultChildType?: string;
    allowedChildTypes: string[];
    directoryNesting: boolean;
} {
    const namespaceInfo = getNamespaceInfo(parentType);
    if (!namespaceInfo) {
        return {
            allowsMultipleTypes: false,
            allowedChildTypes: [],
            directoryNesting: false,
        };
    }

    return {
        allowsMultipleTypes: namespaceInfo.childMode === "multiple",
        defaultChildType: namespaceInfo.childType,
        allowedChildTypes: namespaceInfo.allowedChildren || [],
        directoryNesting: namespaceInfo.scaffolding?.directoryNesting || false,
    };
}
