import { DiagnosticSeverity } from "vscode-languageserver";
import { ZMarkupParser } from "./z-markup-parser.js";

export interface ValidationDiagnostic {
    severity: DiagnosticSeverity;
    range: {
        start: {
            line: number;
            character: number;
        };
        end: {
            line: number;
            character: number;
        };
    };
    message: string;
    source: string;
}

export function validateZLanguageText(text: string): ValidationDiagnostic[] {
    const diagnostics: ValidationDiagnostic[] = [];
    const lines = text.split(/\r?\n/);

    try {
        // Use the new generic markup parser for Z syntax validation
        const markupParser = new ZMarkupParser();
        const markupDiagnostics = markupParser.validateZMarkup(text);

        // Convert markup diagnostics to validation diagnostics
        diagnostics.push(
            ...markupDiagnostics.map((diagnostic) => ({
                severity: diagnostic.severity,
                range: diagnostic.range,
                message: diagnostic.message,
                source: diagnostic.source,
            }))
        );

        // Additional validations (TODO comments, etc.)
        for (let i = 0; i < lines.length; i++) {
            const originalLine = lines[i];

            // Check for TODO comments
            const todoIdx = originalLine.indexOf("TODO");
            if (todoIdx !== -1) {
                diagnostics.push({
                    severity: DiagnosticSeverity.Warning,
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
    } catch (error) {
        // If registry loading fails, just do TODO validation
        for (let i = 0; i < lines.length; i++) {
            const todoIdx = lines[i].indexOf("TODO");
            if (todoIdx !== -1) {
                diagnostics.push({
                    severity: DiagnosticSeverity.Warning,
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

    return diagnostics;
}
