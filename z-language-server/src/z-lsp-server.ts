/*
 * Copyright (C) 2017, 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import * as lsp from "vscode-languageserver";
import { LspServer } from "./lsp-server.js";
import { validateZLanguageText } from "./z-validation.js";
import { z } from "./configuration/languageIds.js";
import {
    ZScaffoldingService,
    scaffoldChild,
    createFileFromTemplate,
    extractParentTypeFromDocument,
    extractContextFromCursor,
    type ScaffoldingContext,
} from "./scaffolding-commands.js";

// Z Language specific commands
export const ZCommands = {
    SCAFFOLD_CHILD: "z.scaffoldChild",
    CREATE_ROUTE: "z.createRoute",
    CREATE_COMPONENT: "z.createComponent",
    CREATE_TABLE: "z.createTable",
    CREATE_ENUM: "z.createEnum",
    CREATE_FROM_TEMPLATE: "z.createFromTemplate",
} as const;

export class ZLspServer extends LspServer {
    private scaffoldingService = new ZScaffoldingService();

    async initialize(
        params: lsp.InitializeParams
    ): Promise<lsp.InitializeResult> {
        const result = await super.initialize(params);

        // Add Z-specific commands to the result
        if (!result.capabilities.executeCommandProvider) {
            result.capabilities.executeCommandProvider = { commands: [] };
        }

        result.capabilities.executeCommandProvider.commands.push(
            ...Object.values(ZCommands)
        );

        return result;
    }

    async executeCommand(
        params: lsp.ExecuteCommandParams,
        token?: lsp.CancellationToken,
        workDoneProgress?: lsp.WorkDoneProgressReporter
    ): Promise<any> {
        const { command, arguments: args } = params;

        try {
            switch (command) {
                case ZCommands.SCAFFOLD_CHILD:
                    return await this.handleScaffoldChild(args);

                case ZCommands.CREATE_ROUTE:
                    return await this.handleCreateFromTemplate(
                        "next-route",
                        args
                    );

                case ZCommands.CREATE_COMPONENT:
                    return await this.handleCreateFromTemplate(
                        "react-component",
                        args
                    );

                case ZCommands.CREATE_TABLE:
                    return await this.handleCreateFromTemplate(
                        "table-schema",
                        args
                    );

                case ZCommands.CREATE_ENUM:
                    return await this.handleCreateFromTemplate(
                        "enum-values",
                        args
                    );

                case ZCommands.CREATE_FROM_TEMPLATE:
                    return await this.handleCreateFromTemplate(
                        args?.[0] as string,
                        args?.slice(1)
                    );

                default:
                    // Fall back to parent implementation for TypeScript commands
                    return await super.executeCommand(
                        params,
                        token,
                        workDoneProgress
                    );
            }
        } catch (error) {
            this.logger.error(`Error executing Z command ${command}: ${error}`);
            throw error;
        }
    }

    private async handleScaffoldChild(args?: any[]): Promise<void> {
        if (!args || args.length < 1) {
            throw new Error("Scaffold child command requires context argument");
        }

        const context = args[0] as ScaffoldingContext;
        await scaffoldChild(context);
    }

    private async handleCreateFromTemplate(
        templateName: string,
        args?: any[]
    ): Promise<void> {
        const workspaceRoot = this.getWorkspaceRoot();
        if (!workspaceRoot) {
            throw new Error("No workspace found");
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
        if (!trimmedContent || trimmedContent.startsWith("//")) {
            return false;
        }

        // Check for Z language target keywords at the start of file
        const zTargetKeywords = [
            "workspace",
            "next",
            "swift",
            "rust",
            "tauri",
            "android",
            "harmony",
            "qt",
            "java",
            "python",
            "bash",
        ];

        // Remove comments and get first meaningful line
        const lines = trimmedContent.split("\n");
        let firstMeaningfulLine = "";

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith("//")) {
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
        params: lsp.DidOpenTextDocumentParams
    ): Promise<void> {
        // For Z files, detect the parsing mode based on content
        if (params.textDocument.languageId === z) {
            if (this.shouldUseZMarkupMode(params.textDocument.text)) {
                // Use Z markup validation
                await this.validateZDocument(
                    params.textDocument.uri,
                    params.textDocument.text
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
        params: lsp.DidChangeTextDocumentParams
    ): Promise<void> {
        // For Z files, detect parsing mode based on content
        if (params.textDocument.uri.endsWith(".z")) {
            // Get the full document text from changes
            if (params.contentChanges.length > 0) {
                const fullChange = params.contentChanges.find(
                    (change) => !("range" in change)
                );
                if (fullChange) {
                    if (this.shouldUseZMarkupMode(fullChange.text)) {
                        // Use Z markup validation
                        await this.validateZDocument(
                            params.textDocument.uri,
                            fullChange.text
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
                })
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
        params: lsp.TextDocumentPositionParams
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
}
