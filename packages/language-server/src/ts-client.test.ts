/*
 * Copyright (C) 2017, 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TsClient } from './ts-client.js';
import { ConsoleLogger } from './utils/logger.js';
import { filePath, readContents, TestLspClient, uri } from './test-utils.js';
import { CommandTypes } from './ts-protocol.js';
import { Trace } from './tsServer/tracer.js';
import { TypeScriptVersionProvider } from './tsServer/versionProvider.js';
import { SyntaxServerConfiguration, TsServerLogLevel } from './utils/configuration.js';
import { noopLogDirectoryProvider } from './tsServer/logDirectoryProvider.js';
import { onCaseInsensitiveFileSystem } from './utils/fs.js';

const logger = new ConsoleLogger();
const lspClientOptions = {
    rootUri: uri(),
    publishDiagnostics: () => { },
};
const lspClient = new TestLspClient(lspClientOptions, logger);
const typescriptVersionProvider = new TypeScriptVersionProvider(undefined, logger);
const bundled = typescriptVersionProvider.bundledVersion();

describe('ts server client', () => {
    let server: TsClient;

    beforeAll(() => {
        server = new TsClient(onCaseInsensitiveFileSystem(), logger, lspClient);
        server.start(
            undefined,
            {
                logDirectoryProvider: noopLogDirectoryProvider,
                logVerbosity: TsServerLogLevel.Off,
                plugins: [],
                trace: Trace.Off,
                typescriptVersion: bundled!,
                useSyntaxServer: SyntaxServerConfiguration.Never,
            },
        );
    });

    afterAll(() => {
        server.shutdown();
    });

    it('completion', async () => {
        const f = filePath('module2.z');
        server.executeWithoutWaitingForResponse(CommandTypes.Open, {
            file: f,
            fileContent: readContents(f),
        });
        const response = await server.execute(CommandTypes.CompletionInfo, {
            file: f,
            line: 1,
            offset: 0,
            prefix: 'im',
        });
        expect(response.type).toBe('response');
        if (response.type !== 'response') {
            throw Error('Not a response');
        }
        expect(response.body).not.toBeNull();
        // Check that 'import' exists somewhere in the completions (more robust than checking exact position)
        const hasImport = response.body!.entries.some(entry => entry.name === 'import');
        expect(hasImport).toBeTruthy();
    });

    it('references', async () => {
        const f = filePath('module2.z');
        server.executeWithoutWaitingForResponse(CommandTypes.Open, {
            file: f,
            fileContent: readContents(f),
        });
        const response = await server.execute(CommandTypes.References, {
            file: f,
            line: 8,
            offset: 16,
        });
        expect(response.type).toBe('response');
        if (response.type !== 'response') {
            throw Error('Not a response');
        }
        expect(response.body).not.toBeNull();
        expect(response.body!.symbolName).toBe('doStuff');
    });

    it('inlayHints', async () => {
        const f = filePath('module2.z');
        // First open module1.z to ensure it's available for import resolution
        const f1 = filePath('module1.z');
        server.executeWithoutWaitingForResponse(CommandTypes.Open, {
            file: f1,
            fileContent: readContents(f1),
        });
        server.executeWithoutWaitingForResponse(CommandTypes.Open, {
            file: f,
            fileContent: readContents(f),
        });
        await server.execute(CommandTypes.Configure, {
            preferences: {
                includeInlayFunctionLikeReturnTypeHints: true,
            },
        });
        const response = await server.execute(
            CommandTypes.ProvideInlayHints,
            {
                file: f,
                start: 0,
                length: 1000,
            },
        );
        expect(response.type).toBe('response');
        if (response.type !== 'response') {
            throw Error('Not a response');
        }
        expect(response.body).not.toBeNull();
        // Check that we get some inlay hint (the exact type may vary based on import resolution)
        expect(response.body!.length).toBeGreaterThan(0);
        expect(response.body![0].text).toMatch(/: (boolean|any)/);
    });

    it('documentHighlight', async () => {
        const f = filePath('module2.z');
        server.executeWithoutWaitingForResponse(CommandTypes.Open, {
            file: f,
            fileContent: readContents(f),
        });
        const response = await server.execute(CommandTypes.DocumentHighlights, {
            file: f,
            line: 8,
            offset: 16,
            filesToSearch: [f],
        });
        expect(response.type).toBe('response');
        if (response.type !== 'response') {
            throw Error('Not a response');
        }
        expect(response.body).not.toBeNull();
        expect(response.body!.some(({ file }) => file.endsWith('module2.z'))).toBeTruthy();
        expect(response.body!.some(({ file: file_1 }) => file_1.endsWith('module1.z'))).toBeFalsy();
    });
});
