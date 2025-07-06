"use strict";
// @ts-nocheck
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const registry_1 = require("./registry");
// Create the LSP connection
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
connection.onInitialize((_params) => {
    return {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
            completionProvider: {
                resolveProvider: false,
            },
        },
    };
});
// Simple keyword completions
const KEYWORDS = [
    "fun",
    "if",
    "else",
    "for",
    "in",
    "component",
    "Schema",
    "Routes",
    "API",
    "App",
    "Components",
    "SwiftUI",
    "NextJS",
];
connection.onCompletion((params) => {
    try {
        // Get registry-based completions
        const targetCompletions = (0, registry_1.getTargetCompletions)().map((target) => ({
            label: target.label,
            kind: node_1.CompletionItemKind.Class,
            detail: target.detail,
            documentation: `Target: ${target.detail}`,
        }));
        // Add basic keywords
        const keywords = [
            "fun",
            "if",
            "else",
            "for",
            "in",
            "component",
        ].map((k) => ({
            label: k,
            kind: node_1.CompletionItemKind.Keyword,
        }));
        return [
            ...targetCompletions,
            ...keywords,
        ];
    }
    catch (error) {
        // Fallback to basic keywords if registry fails
        return [
            "fun",
            "if",
            "else",
            "for",
            "in",
        ].map((k) => ({
            label: k,
            kind: node_1.CompletionItemKind.Keyword,
        }));
    }
});
// Very naive diagnostics example: flag lines containing 'TODO'
function validateTextDocument(textDocument) {
    const text = textDocument.getText();
    const diagnostics = [];
    const lines = text.split(/\r?\n/);
    try {
        const registry = (0, registry_1.loadRegistry)();
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // Check for TODO comments
            const todoIdx = lines[i].indexOf("TODO");
            if (todoIdx !== -1) {
                diagnostics.push({
                    severity: node_1.DiagnosticSeverity.Warning,
                    range: {
                        start: {
                            line: i,
                            character: todoIdx,
                        },
                        end: {
                            line: i,
                            character: todoIdx + 4,
                        },
                    },
                    message: "Reminder: TODO found",
                    source: "z-lsp",
                });
            }
            // Validate target blocks
            const targetMatch = line.match(/^([A-Z][A-Za-z0-9_]*)\s*\{/);
            if (targetMatch) {
                const targetName = targetMatch[1];
                if (!registry.targets[targetName]) {
                    diagnostics.push({
                        severity: node_1.DiagnosticSeverity.Error,
                        range: {
                            start: {
                                line: i,
                                character: 0,
                            },
                            end: {
                                line: i,
                                character: targetName.length,
                            },
                        },
                        message: `Unknown target '${targetName}'. Available targets: ${Object.keys(registry.targets).join(", ")}`,
                        source: "z-lsp",
                    });
                }
            }
        }
    }
    catch (error) {
        // If registry loading fails, just do TODO validation
        for (let i = 0; i < lines.length; i++) {
            const todoIdx = lines[i].indexOf("TODO");
            if (todoIdx !== -1) {
                diagnostics.push({
                    severity: node_1.DiagnosticSeverity.Warning,
                    range: {
                        start: {
                            line: i,
                            character: todoIdx,
                        },
                        end: {
                            line: i,
                            character: todoIdx + 4,
                        },
                    },
                    message: "Reminder: TODO found",
                    source: "z-lsp",
                });
            }
        }
    }
    connection.sendDiagnostics({
        uri: textDocument.uri,
        diagnostics,
    });
}
documents.onDidChangeContent((change) => {
    validateTextDocument(change.document);
});
documents.onDidClose((e) => {
    connection.sendDiagnostics({
        uri: e.document.uri,
        diagnostics: [],
    });
});
// Make the text document manager listen on the connection
// and register handlers
documents.listen(connection);
connection.listen();
