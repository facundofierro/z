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
import {
    ZScaffoldingService,
    scaffoldChild,
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
            // Use console.error instead of private logger
            console.error(`Error executing Z command ${command}: ${error}`);
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
        _templateName: string,
        _args?: any[],
    ): Promise<void> {
        // For now, disable template creation to avoid workspace access issues
        throw new Error('Template creation not available');
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

    // Override to use simplified detection
    didOpenTextDocument(
        params: lsp.DidOpenTextDocumentParams,
    ): void {
        // For Z files, check if it's Z markup or regular TSX-like code
        if (params.textDocument.languageId === z) {
            if (this.shouldUseZMarkupMode(params.textDocument.text)) {
                // Use Z markup validation - don't open in TypeScript server
                this.validateZDocument(
                    params.textDocument.uri,
                    params.textDocument.text,
                ).catch(() => {
                    // Validation errors are handled internally
                });
            } else {
                // Use TypeScript validation - open in TypeScript server as TSX
                super.didOpenTextDocument(params);
            }
        } else {
            // For other files, use the original TypeScript handling
            super.didOpenTextDocument(params);
        }
    }

    didChangeTextDocument(
        params: lsp.DidChangeTextDocumentParams,
    ): void {
        // For Z files, detect parsing mode based on content
        if (params.textDocument.uri.endsWith('.z')) {
            // Get the full document text from changes
            if (params.contentChanges.length > 0) {
                const fullChange = params.contentChanges.find(
                    (change) => !('range' in change),
                );
                if (fullChange) {
                    if (this.shouldUseZMarkupMode(fullChange.text)) {
                        // Use Z markup validation - don't send to TypeScript server
                        this.validateZDocument(
                            params.textDocument.uri,
                            fullChange.text,
                        ).catch(() => {
                            // Validation errors are handled internally
                        });
                    } else {
                        // Use TypeScript validation - send to TypeScript server
                        super.didChangeTextDocument(params);
                    }
                } else {
                    // If we don't have full document changes, default to TypeScript mode
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

            // For now, just validate Z markup syntax without publishing diagnostics
            // The parent class will handle diagnostics for TypeScript files
            if (diagnostics.length > 0) {
                // Z markup validation completed - diagnostics found but not published
                // This could be enhanced later to publish Z-specific diagnostics
            }
        } catch (error) {
            // Use console.error instead of private logger
            console.error(`Error validating Z document: ${error}`);
        }
    }

    /**
     * Override didSaveTextDocument to trigger automatic scaffolding
     */
    didSaveTextDocument(params: lsp.DidSaveTextDocumentParams): void {
        super.didSaveTextDocument(params);
        // Auto-scaffolding disabled due to private property access issues
    }
}
