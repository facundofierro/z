/*
 * Copyright (C) 2017, 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import * as lsp from 'vscode-languageserver';
import { LspServer } from './lsp-server.js';
import { validateZLanguageText } from './z-validation.js';
import { z } from './configuration/languageIds.js';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { getNamespaceInfo } from './z-registry.js';
import {
    ZScaffoldingService,
    scaffoldChild,
    createFileFromTemplate,
    extractParentTypeFromDocument,
    extractContextFromCursor,
    type ScaffoldingContext,
} from './scaffolding-commands.js';

// Z Language specific commands
export const ZCommands = {
    SCAFFOLD_CHILD: 'z.scaffoldChild',
    CREATE_ROUTE: 'z.createRoute',
    CREATE_COMPONENT: 'z.createComponent',
    CREATE_TABLE: 'z.createTable',
    CREATE_ENUM: 'z.createEnum',
    CREATE_FROM_TEMPLATE: 'z.createFromTemplate',
} as const;

export class ZLspServer extends LspServer {
    private scaffoldingService = new ZScaffoldingService();

    async initialize(
        params: lsp.InitializeParams,
    ): Promise<lsp.InitializeResult> {
        const result = await super.initialize(params);

        // Add Z-specific commands to the result
        if (!result.capabilities.executeCommandProvider) {
            result.capabilities.executeCommandProvider = { commands: [] };
        }

        result.capabilities.executeCommandProvider.commands.push(
            ...Object.values(ZCommands),
        );

        return result;
    }

    async executeCommand(
        params: lsp.ExecuteCommandParams,
        token?: lsp.CancellationToken,
        workDoneProgress?: lsp.WorkDoneProgressReporter,
    ): Promise<any> {
        const { command, arguments: args } = params;

        try {
            switch (command) {
                case ZCommands.SCAFFOLD_CHILD:
                    return await this.handleScaffoldChild(args);

                case ZCommands.CREATE_ROUTE:
                    return await this.handleCreateFromTemplate(
                        'next-route',
                        args,
                    );

                case ZCommands.CREATE_COMPONENT:
                    return await this.handleCreateFromTemplate(
                        'react-component',
                        args,
                    );

                case ZCommands.CREATE_TABLE:
                    return await this.handleCreateFromTemplate(
                        'table-schema',
                        args,
                    );

                case ZCommands.CREATE_ENUM:
                    return await this.handleCreateFromTemplate(
                        'enum-values',
                        args,
                    );

                case ZCommands.CREATE_FROM_TEMPLATE:
                    return await this.handleCreateFromTemplate(
                        args?.[0] as string,
                        args?.slice(1),
                    );

                default:
                    // Fall back to parent implementation for TypeScript commands
                    return await super.executeCommand(
                        params,
                        token,
                        workDoneProgress,
                    );
            }
        } catch (error) {
            this.logger.error(`Error executing Z command ${command}: ${error}`);
            throw error;
        }
    }

    private async handleScaffoldChild(args?: any[]): Promise<void> {
        if (!args || args.length < 1) {
            throw new Error('Scaffold child command requires context argument');
        }

        const context = args[0] as ScaffoldingContext;
        await scaffoldChild(context);
    }

    private async handleCreateFromTemplate(
        templateName: string,
        _args?: any[],
    ): Promise<void> {
        const workspaceRoot = this.getWorkspaceRoot();
        if (!workspaceRoot) {
            throw new Error('No workspace found');
        }

        await createFileFromTemplate(templateName, workspaceRoot);
    }

    private getWorkspaceRoot(): string | undefined {
        return this.workspaceRoot;
    }

    /**
     * Analyzes file content to determine if it should be parsed as Z markup or TypeScript
     */
    private shouldUseZMarkupMode(content: string): boolean {
        const trimmedContent = content.trim();

        // Skip empty files or comments-only files
        if (!trimmedContent || trimmedContent.startsWith('//')) {
            return false;
        }

        // Check for Z language target keywords at the start of file
        const zTargetKeywords = [
            'workspace',
            'next',
            'swift',
            'rust',
            'tauri',
            'android',
            'harmony',
            'qt',
            'java',
            'python',
            'bash',
        ];

        // Remove comments and get first meaningful line
        const lines = trimmedContent.split('\n');
        let firstMeaningfulLine = '';

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('//')) {
                firstMeaningfulLine = trimmedLine;
                break;
            }
        }

        // Check if first meaningful line starts with a Z target keyword
        for (const keyword of zTargetKeywords) {
            if (firstMeaningfulLine.startsWith(`${keyword} `)) {
                return true;
            }
        }

        // If no Z keywords found, use TypeScript mode
        return false;
    }

    // Override to add content-based validation detection
    async didOpenTextDocument(
        params: lsp.DidOpenTextDocumentParams,
    ): Promise<void> {
        // For Z files, detect the parsing mode based on content
        if (params.textDocument.languageId === z) {
            if (this.shouldUseZMarkupMode(params.textDocument.text)) {
                // Use Z markup validation
                await this.validateZDocument(
                    params.textDocument.uri,
                    params.textDocument.text,
                );
            } else {
                // Use TypeScript validation
                super.didOpenTextDocument(params);
            }
        } else {
            // For other files, use the original TypeScript handling
            super.didOpenTextDocument(params);
        }
    }

    async didChangeTextDocument(
        params: lsp.DidChangeTextDocumentParams,
    ): Promise<void> {
        // For Z files, detect parsing mode based on content
        if (params.textDocument.uri.endsWith('.z')) {
            // Get the full document text from changes
            if (params.contentChanges.length > 0) {
                const fullChange = params.contentChanges.find(
                    (change) => !('range' in change),
                );
                if (fullChange) {
                    if (this.shouldUseZMarkupMode(fullChange.text)) {
                        // Use Z markup validation
                        await this.validateZDocument(
                            params.textDocument.uri,
                            fullChange.text,
                        );
                    } else {
                        // Use TypeScript validation - need to let parent handle this
                        super.didChangeTextDocument(params);
                    }
                } else {
                    // If we don't have full document changes, fall back to TypeScript mode
                    super.didChangeTextDocument(params);
                }
            }
        } else {
            // For other files, use the original TypeScript handling
            super.didChangeTextDocument(params);
        }
    }

    private async validateZDocument(uri: string, text: string): Promise<void> {
        try {
            const diagnostics = validateZLanguageText(text);

            // Convert our validation diagnostics to LSP format
            const lspDiagnostics: lsp.Diagnostic[] = diagnostics.map(
                (diagnostic) => ({
                    severity: diagnostic.severity,
                    range: {
                        start: {
                            line: diagnostic.range.start.line,
                            character: diagnostic.range.start.character,
                        },
                        end: {
                            line: diagnostic.range.end.line,
                            character: diagnostic.range.end.character,
                        },
                    },
                    message: diagnostic.message,
                    source: diagnostic.source,
                }),
            );

            // Publish the diagnostics
            this.options.lspClient.publishDiagnostics({
                uri,
                diagnostics: lspDiagnostics,
            });
        } catch (error) {
            this.logger.error(`Error validating Z document: ${error}`);
        }
    }

    /**
     * Provides scaffolding context for the current cursor position
     */
    async getScaffoldingContext(
        params: lsp.TextDocumentPositionParams,
    ): Promise<ScaffoldingContext | null> {
        const document = this.tsClient.toOpenDocument(params.textDocument.uri);
        if (!document) {
            return null;
        }

        // Create a mock TextDocument for extractContextFromCursor
        const mockDocument = {
            getText: () => document.getText(),
            uri: { fsPath: document.uri.toString() },
        } as any;

        return extractContextFromCursor(mockDocument, params.position.line);
    }

    /**
     * Get the parent type from the current document
     */
    async getParentType(uri: string): Promise<string | null> {
        const document = this.tsClient.toOpenDocument(uri);
        if (!document) {
            return null;
        }

        const mockDocument = {
            getText: () => document.getText(),
        } as any;

        return extractParentTypeFromDocument(mockDocument);
    }

    /**
     * Override didSaveTextDocument to trigger automatic scaffolding
     */
    didSaveTextDocument(params: lsp.DidSaveTextDocumentParams): void {
        super.didSaveTextDocument(params);

        // Check if auto-scaffolding is enabled (could be configurable)
        const shouldAutoScaffold = this.shouldAutoScaffold(params.textDocument.uri);

        if (shouldAutoScaffold) {
            this.performAutoScaffolding(params.textDocument.uri);
        }
    }

    private shouldAutoScaffold(uri: string): boolean {
        // Only auto-scaffold .z files
        return uri.endsWith('.z');
    }

    private async performAutoScaffolding(uri: string): Promise<void> {
        try {
            // Get document content
            const document = await this.getDocumentText(uri);
            if (!document) {
                return;
            }

            // Extract parent type and potential children
            const children = await this.extractNewChildren(document, uri);

            if (children.length === 0) {
                return;
            }

            // Get workspace root
            const workspaceRoot = this.getWorkspaceRoot();
            if (!workspaceRoot) {
                return;
            }

            // Generate files for each new child
            for (const child of children) {
                try {
                    await this.scaffoldingService.createChildFile({
                        childName: child.name,
                        childType: child.type,
                        parentType: child.parentType,
                        targetDirectory: child.targetDirectory,
                        openAfterCreate: false, // Don't open automatically on save
                    });
                } catch (error) {
                    // Continue with other children if one fails
                    // Note: In production, this could be logged to the language server logger
                }
            }
        } catch (error) {
            // Note: In production, this could be logged to the language server logger
        }
    }

    private async getDocumentText(uri: string): Promise<string | null> {
        // Try to get from tsClient first
        try {
            const document = (this as any).tsClient?.toOpenDocument?.(uri);
            if (document) {
                return document.getText();
            }
        } catch {
            // If tsClient fails, try reading from file system
        }

        // Fallback to reading from file system
        try {
            const fs = await import('node:fs/promises');
            const filePath = uri.startsWith('file://') ? uri.slice(7) : uri;
            return await fs.readFile(filePath, 'utf-8');
        } catch {
            return null;
        }
    }

    private async extractNewChildren(documentText: string, _uri: string): Promise<Array<{
        name: string;
        type?: string;
        parentType: string;
        targetDirectory: string;
    }>> {
        const children: Array<{
            name: string;
            type?: string;
            parentType: string;
            targetDirectory: string;
        }> = [];

        const lines = documentText.split('\n');
        let currentParentType: string | null = null;
        let currentTargetDirectory: string | null = null;
        let braceLevel = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Skip empty lines and comments
            if (!trimmed || trimmed.startsWith('//')) {
                continue;
            }

            // Track brace levels to understand nesting
            const openBraces = (trimmed.match(/\{/g) || []).length;
            const closeBraces = (trimmed.match(/\}/g) || []).length;

            // Detect parent blocks (at the right nesting level)
            if (braceLevel === 0 || braceLevel === 1) {
                const parentMatch = trimmed.match(/^(\w+)\s*\{/);
                if (parentMatch) {
                    const parentType = parentMatch[1];

                    // Check if this is a valid scaffolding parent
                    const namespaceInfo = getNamespaceInfo(parentType);
                    if (namespaceInfo?.scaffolding) {
                        currentParentType = parentType;
                        currentTargetDirectory = this.getTargetDirectory(parentType);
                    }
                }
            }

            // Detect child declarations within parent blocks
            if (currentParentType && currentTargetDirectory && braceLevel === 1) {
                // Simple child (e.g., "users" in Routes)
                const simpleChildMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9_]*)\s*(?:\{.*\}|\{|\s*)$/);
                if (simpleChildMatch && !trimmed.includes('}')) {
                    const childName = simpleChildMatch[1];
                    if (await this.isNewChild(childName, currentParentType, currentTargetDirectory)) {
                        children.push({
                            name: childName,
                            parentType: currentParentType,
                            targetDirectory: currentTargetDirectory,
                        });
                    }
                }

                // Typed child (e.g., "table User" in Schema)
                const typedChildMatch = trimmed.match(/^(\w+)\s+([a-zA-Z][a-zA-Z0-9_]*)\s*(?:\{.*\}|\{|\s*)$/);
                if (typedChildMatch && !trimmed.includes('}')) {
                    const childType = typedChildMatch[1];
                    const childName = typedChildMatch[2];
                    if (await this.isNewChild(childName, currentParentType, currentTargetDirectory, childType)) {
                        children.push({
                            name: childName,
                            type: childType,
                            parentType: currentParentType,
                            targetDirectory: currentTargetDirectory,
                        });
                    }
                }
            }

            // Update brace level
            braceLevel += openBraces - closeBraces;

            // Reset parent context when we exit parent blocks
            if (braceLevel <= 0) {
                currentParentType = null;
                currentTargetDirectory = null;
                braceLevel = 0;
            }
        }

        return children;
    }

    private getTargetDirectory(parentType: string): string {
        const workspaceRoot = this.getWorkspaceRoot();
        if (!workspaceRoot) {
            throw new Error('No workspace root');
        }

        // Use the same logic as ZScaffoldingService
        const directoryMap: Record<string, string> = {
            Routes: 'app/routes',
            API: 'app/api',
            Components: 'app/components',
            Schema: 'schema',
            App: 'src',
            Frontend: 'src/frontend',
            Backend: 'src/backend',
            Config: 'config',
            Activities: 'src/activities',
            Services: 'src/services',
            Pages: 'src/pages',
            Windows: 'src/windows',
            type: 'src/types',
            fun: 'src/functions',
            mod: 'src/modules',
            class: 'src/classes',
        };

        const relativeDir = directoryMap[parentType] || `src/${parentType.toLowerCase()}`;
        return join(workspaceRoot, relativeDir);
    }

    private async isNewChild(
        childName: string,
        parentType: string,
        targetDirectory: string,
        childType?: string,
    ): Promise<boolean> {
        const namespaceInfo = getNamespaceInfo(parentType);

        if (!namespaceInfo?.scaffolding) {
            return false;
        }

        // Determine file extension
        let fileExtension: string;
        if (namespaceInfo.childMode === 'single') {
            fileExtension = namespaceInfo.scaffolding.fileExtension || '.z';
        } else if (childType && namespaceInfo.scaffolding.fileExtensions) {
            fileExtension = namespaceInfo.scaffolding.fileExtensions[childType] || '.z';
        } else {
            // For multiple types without explicit type, skip
            return false;
        }

        const expectedFilePath = join(targetDirectory, `${childName}${fileExtension}`);

        try {
            return !existsSync(expectedFilePath);
        } catch {
            return true; // If we can't check, assume it's new
        }
    }
}
