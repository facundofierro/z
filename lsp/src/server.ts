// @ts-nocheck

import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  DiagnosticSeverity,
  CompletionItemKind,
  InitializeParams,
  TextDocumentSyncKind,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";
import {
  CompletionParams,
  DidChangeTextDocumentParams,
  DidCloseTextDocumentParams,
} from "vscode-languageserver";
import {
  getTargetCompletions,
  getChildrenForTarget,
  validateChild,
  loadRegistry,
} from "./registry";

// Create the LSP connection
const connection = createConnection(
  ProposedFeatures.all
);
const documents: TextDocuments<TextDocument> =
  new TextDocuments(TextDocument);

connection.onInitialize(
  (_params: InitializeParams) => {
    return {
      capabilities: {
        textDocumentSync:
          TextDocumentSyncKind.Incremental,
        completionProvider: {
          resolveProvider: false,
        },
      },
    };
  }
);

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

connection.onCompletion(
  (params: CompletionParams) => {
    try {
      // Get registry-based completions
      const targetCompletions =
        getTargetCompletions().map(
          (target) => ({
            label: target.label,
            kind: CompletionItemKind.Class,
            detail: target.detail,
            documentation: `Target: ${target.detail}`,
          })
        );

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
        kind: CompletionItemKind.Keyword,
      }));

      return [
        ...targetCompletions,
        ...keywords,
      ];
    } catch (error) {
      // Fallback to basic keywords if registry fails
      return [
        "fun",
        "if",
        "else",
        "for",
        "in",
      ].map((k) => ({
        label: k,
        kind: CompletionItemKind.Keyword,
      }));
    }
  }
);

// Very naive diagnostics example: flag lines containing 'TODO'
function validateTextDocument(
  textDocument: TextDocument
): void {
  const text = textDocument.getText();
  const diagnostics = [];
  const lines = text.split(/\r?\n/);

  try {
    const registry = loadRegistry();

    for (
      let i = 0;
      i < lines.length;
      i++
    ) {
      const line = lines[i].trim();

      // Check for TODO comments
      const todoIdx =
        lines[i].indexOf("TODO");
      if (todoIdx !== -1) {
        diagnostics.push({
          severity:
            DiagnosticSeverity.Warning,
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
          message:
            "Reminder: TODO found",
          source: "z-lsp",
        });
      }

      // Validate target blocks
      const targetMatch = line.match(
        /^([A-Z][A-Za-z0-9_]*)\s*\{/
      );
      if (targetMatch) {
        const targetName =
          targetMatch[1];
        if (
          !registry.targets[targetName]
        ) {
          diagnostics.push({
            severity:
              DiagnosticSeverity.Error,
            range: {
              start: {
                line: i,
                character: 0,
              },
              end: {
                line: i,
                character:
                  targetName.length,
              },
            },
            message: `Unknown target '${targetName}'. Available targets: ${Object.keys(
              registry.targets
            ).join(", ")}`,
            source: "z-lsp",
          });
        }
      }
    }
  } catch (error) {
    // If registry loading fails, just do TODO validation
    for (
      let i = 0;
      i < lines.length;
      i++
    ) {
      const todoIdx =
        lines[i].indexOf("TODO");
      if (todoIdx !== -1) {
        diagnostics.push({
          severity:
            DiagnosticSeverity.Warning,
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
          message:
            "Reminder: TODO found",
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

documents.onDidChangeContent(
  (change: {
    document: TextDocument;
  }) => {
    validateTextDocument(
      change.document
    );
  }
);

documents.onDidClose(
  (e: { document: TextDocument }) => {
    connection.sendDiagnostics({
      uri: e.document.uri,
      diagnostics: [],
    });
  }
);

// Make the text document manager listen on the connection
// and register handlers

documents.listen(connection);
connection.listen();
