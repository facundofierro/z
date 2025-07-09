import { describe, expect, it, beforeAll, beforeEach } from 'vitest';
import * as lsp from 'vscode-languageserver';
import { createServer, uri, TestLspServer, openDocumentAndWaitForDiagnostics } from './test-utils.js';

describe('basic Z File Handling', () => {
    let server: TestLspServer;
    let diagnostics: Map<string, lsp.PublishDiagnosticsParams>;

    beforeAll(async () => {
        diagnostics = new Map();
        server = await createServer({
            rootUri: uri(),
            publishDiagnostics: (args) => diagnostics.set(args.uri, args),
        });
    });

    beforeEach(() => {
        server.closeAllForTesting();
        diagnostics.clear();
    });

    it('should handle Z markup file without hanging', async () => {
        const document = {
            uri: uri('markup.z'),
            languageId: 'z',
            version: 1,
            text: 'next App {\n  Routes {\n    home\n  }\n}',
        };

        // This should complete quickly without hanging
        const startTime = Date.now();
        server.didOpenTextDocument({ textDocument: document });
        const endTime = Date.now();

        // Should complete quickly (under 1 second since no TS diagnostics needed)
        expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should open TypeScript .z file without hanging (no diagnostic wait)', async () => {
        const document = {
            uri: uri('test.z'),
            languageId: 'z',
            version: 1,
            text: 'const x = 5;',
        };

        // Test just opening the document without waiting for diagnostics
        const startTime = Date.now();
        server.didOpenTextDocument({ textDocument: document });
        const endTime = Date.now();

        // This should complete quickly if the hanging is in diagnostic waiting
        expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should hang when waiting for diagnostics (to confirm)', async () => {
        const document = {
            uri: uri('test-diagnostic.z'),
            languageId: 'z',
            version: 1,
            text: 'const x = 5;',
        };

        // This should hang - confirming that the issue is in diagnostic waiting
        const startTime = Date.now();
        try {
            await openDocumentAndWaitForDiagnostics(server, document);
            const endTime = Date.now();
            // If we get here, diagnostics worked
            expect(endTime - startTime).toBeLessThan(5000);
        } catch (error) {
            const endTime = Date.now();
            // Should timeout after ~20 seconds
            expect(endTime - startTime).toBeGreaterThan(19000);
            throw error;
        }
    }, 25000); // Longer timeout to see the full hang
});
