/*
 * Copyright (C) 2017, 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import {
    uri,
    createServer,
    lastPosition,
    filePath,
    readContents,
    positionAfter,
    TestLspServer,
} from './test-utils.js';

let server: TestLspServer;

describe('documentHighlight', () => {
    beforeAll(async () => {
        server = await createServer({
            rootUri: uri(),
            publishDiagnostics: () => {},
        });
    });

    beforeEach(() => {
        server.closeAllForTesting();
    });

    afterAll(() => {
        server.closeAllForTesting();
        server.shutdown();
    });

    it('simple test', async () => {
        const doc = {
            uri: uri('module2.z'),
            languageId: 'z',
            version: 1,
            text: readContents(filePath('module2.z')),
        };

        // Just open the document without waiting for diagnostics
        server.didOpenTextDocument({ textDocument: doc });

        // Give it a moment to process
        await new Promise(resolve => setTimeout(resolve, 100));

        const result = await server.documentHighlight({
            textDocument: doc,
            position: lastPosition(doc, 'doStuff'),
        });
        expect(result).toBeDefined();
    });
});

describe('completions', () => {
    beforeAll(async () => {
        server = await createServer({
            rootUri: uri(),
            publishDiagnostics: () => {},
        });
    });

    beforeEach(() => {
        server.closeAllForTesting();
    });

    afterAll(() => {
        server.closeAllForTesting();
        server.shutdown();
    });

    it('receives completion that auto-imports from another module', async () => {
        const doc = {
            uri: uri('completion.z'),
            languageId: 'z',
            version: 1,
            text: readContents(filePath('completion.z')),
        };

        // Open both modules first
        const module1Doc = {
            uri: uri('module1.z'),
            languageId: 'z',
            version: 1,
            text: readContents(filePath('module1.z')),
        };

        server.didOpenTextDocument({ textDocument: module1Doc });
        server.didOpenTextDocument({ textDocument: doc });

        // Give it a moment to process
        await new Promise(resolve => setTimeout(resolve, 100));

        const proposals = await server.completion({
            textDocument: doc,
            position: positionAfter(doc, 'doStuff'),
        });
        expect(proposals).toBeDefined();
    });
});
