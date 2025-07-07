/*
 * Copyright (C) 2017, 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import type { LspDocument } from "../document.js";

// Z Language Server - supports only Z language files
export const z = "z";

export function isSupportedLanguageMode(doc: LspDocument): boolean {
    return doc.languageId === z;
}

export function isZDocument(doc: LspDocument): boolean {
    return doc.languageId === z;
}
