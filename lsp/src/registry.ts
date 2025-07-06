// @ts-nocheck

import * as fs from "fs";
import * as path from "path";

export interface TargetInfo {
  description: string;
  mode: "markup" | "code";
  allowedChildren: string[];
  defaultPackages: Record<
    string,
    string
  >;
  compiler: string;
}

export interface NamespaceInfo {
  aliasOf: string;
  description: string;
  allowedChildren?: string[];
  role?: string;
}

export interface Registry {
  version: string;
  targets: Record<string, TargetInfo>;
  namespaces: Record<
    string,
    NamespaceInfo
  >;
  annotations: Record<
    string,
    {
      description: string;
      usage: string;
    }
  >;
}

let cachedRegistry: Registry | null =
  null;

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
    path.join(
      __dirname,
      "embedded-registry.json"
    ),
  ];

  for (const registryPath of possiblePaths) {
    try {
      if (fs.existsSync(registryPath)) {
        const content = fs.readFileSync(
          registryPath,
          "utf8"
        );
        cachedRegistry =
          JSON.parse(content);
        return cachedRegistry;
      }
    } catch (error) {
      // Continue to next path
    }
  }

  throw new Error(
    "Could not load Z language registry"
  );
}

export function getTargetCompletions(): Array<{
  label: string;
  detail: string;
}> {
  const registry = loadRegistry();
  return Object.entries(
    registry.targets
  ).map(([name, info]) => ({
    label: name,
    detail: info.description,
  }));
}

export function getChildrenForTarget(
  targetName: string
): string[] {
  const registry = loadRegistry();
  const target =
    registry.targets[targetName];
  return target
    ? target.allowedChildren
    : [];
}

export function validateChild(
  parentTarget: string,
  childName: string
): boolean {
  const allowedChildren =
    getChildrenForTarget(parentTarget);
  return (
    allowedChildren.includes("*") ||
    allowedChildren.includes(childName)
  );
}
