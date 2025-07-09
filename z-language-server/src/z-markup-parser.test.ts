import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ZMarkupParser } from './z-markup-parser.js';
import { DiagnosticSeverity } from 'vscode-languageserver';

function readTestFile(filename: string): string {
    return readFileSync(join(__dirname, '..', '..', 'tests', filename), 'utf8');
}

describe('zMarkupParser - TDD with Real Z Test Files', () => {
    let parser: ZMarkupParser;

    beforeEach(() => {
        parser = new ZMarkupParser();
    });

    describe('valid Z Syntax - Should Pass', () => {
        it('should validate test-standalone.z without errors', () => {
            const zCode = readTestFile('test-standalone.z');
            const diagnostics = parser.validateZMarkup(zCode);

            // Should have no errors for valid syntax
            const errors = diagnostics.filter(
                (d) => d.severity === DiagnosticSeverity.Error,
            );

            expect(errors).toHaveLength(0);
        });

        it('should validate test-workspace.z without errors', () => {
            const zCode = readTestFile('test-workspace.z');
            const diagnostics = parser.validateZMarkup(zCode);

            // Should have no errors for valid workspace syntax
            const errors = diagnostics.filter(
                (d) => d.severity === DiagnosticSeverity.Error,
            );

            expect(errors).toHaveLength(0);
        });
    });

    describe('invalid Z Syntax - Should Detect Errors', () => {
        it('should detect errors in test-invalid.z', () => {
            const zCode = readTestFile('test-invalid.z');
            const diagnostics = parser.validateZMarkup(zCode);

            const errors = diagnostics.filter(
                (d) => d.severity === DiagnosticSeverity.Error,
            );

            // Should detect multiple validation errors
            expect(errors.length).toBeGreaterThan(0);

            // Check for specific expected errors
            const errorMessages = errors.map((e) => e.message);

            // Should detect unknown target
            expect(
                errorMessages.some(
                    (msg) =>
                        msg.includes('invalidTarget') ||
                        msg.includes('Unknown root element'),
                ),
            ).toBeTruthy();

            // Should detect invalid namespace usage
            expect(
                errorMessages.some(
                    (msg) =>
                        msg.includes('Activities') &&
                        msg.includes('not allowed'),
                ),
            ).toBeTruthy();

            // Removed debug output for linter compliance
        });
    });

    describe('target Recognition', () => {
        it('should recognize next target', () => {
            const zCode = `next WebApp {
  Routes {
    home
  }
}`;
            const diagnostics = parser.validateZMarkup(zCode);

            const unknownTargetErrors = diagnostics.filter(
                (d) =>
                    d.message.includes('Unknown root element') &&
                    d.message.includes('next'),
            );

            expect(unknownTargetErrors).toHaveLength(0);
        });

        it('should recognize swift target', () => {
            const zCode = `swift MobileApp {
  App {
    ContentView
  }
}`;
            const diagnostics = parser.validateZMarkup(zCode);

            const unknownTargetErrors = diagnostics.filter(
                (d) =>
                    d.message.includes('Unknown root element') &&
                    d.message.includes('swift'),
            );

            expect(unknownTargetErrors).toHaveLength(0);
        });

        it('should recognize tauri target', () => {
            const zCode = `tauri DesktopApp {
  Frontend {
    Dashboard
  }
}`;
            const diagnostics = parser.validateZMarkup(zCode);

            const unknownTargetErrors = diagnostics.filter(
                (d) =>
                    d.message.includes('Unknown root element') &&
                    d.message.includes('tauri'),
            );

            expect(unknownTargetErrors).toHaveLength(0);
        });

        it('should recognize rust target', () => {
            const zCode = `rust BackendAPI {
  mod handlers
}`;
            const diagnostics = parser.validateZMarkup(zCode);

            const unknownTargetErrors = diagnostics.filter(
                (d) =>
                    d.message.includes('Unknown root element') &&
                    d.message.includes('rust'),
            );

            expect(unknownTargetErrors).toHaveLength(0);
        });

        it('should recognize workspace', () => {
            const zCode = `workspace MyProject {
  next webApp {
    Routes {
      home
    }
  }
}`;
            const diagnostics = parser.validateZMarkup(zCode);

            const unknownTargetErrors = diagnostics.filter(
                (d) =>
                    d.message.includes('Unknown root element') &&
                    d.message.includes('workspace'),
            );

            expect(unknownTargetErrors).toHaveLength(0);
        });
    });

    describe('namespace Validation', () => {
        it('should allow valid next namespaces', () => {
            const zCode = `next WebApp {
  Routes {
    home
  }
  Components {
    Header
  }
  API {
    users
  }
  Schema {
    table User {
      id: string
    }
  }
}`;
            const diagnostics = parser.validateZMarkup(zCode);

            const namespaceErrors = diagnostics.filter((d) =>
                d.message.includes('not allowed in'),
            );

            expect(namespaceErrors).toHaveLength(0);
        });

        it('should allow valid swift namespaces', () => {
            const zCode = `swift MobileApp {
  App {
    ContentView
  }
  Components {
    LoginView
  }
}`;
            const diagnostics = parser.validateZMarkup(zCode);

            const namespaceErrors = diagnostics.filter((d) =>
                d.message.includes('not allowed in'),
            );

            expect(namespaceErrors).toHaveLength(0);
        });

        it('should allow valid tauri namespaces', () => {
            const zCode = `tauri DesktopApp {
  Frontend {
    Dashboard
  }
  Backend {
    FileSystem
  }
  Config {
    database: postgres
  }
}`;
            const diagnostics = parser.validateZMarkup(zCode);

            const namespaceErrors = diagnostics.filter((d) =>
                d.message.includes('not allowed in'),
            );

            expect(namespaceErrors).toHaveLength(0);
        });

        it('should allow valid rust namespaces', () => {
            const zCode = `rust BackendAPI {
}`;
            const diagnostics = parser.validateZMarkup(zCode);

            const namespaceErrors = diagnostics.filter((d) =>
                d.message.includes('not allowed in'),
            );

            expect(namespaceErrors).toHaveLength(0);
        });

        it('should reject invalid namespaces', () => {
            const zCode = `next WebApp {
  Activities {
    MainActivity
  }
}`;
            const diagnostics = parser.validateZMarkup(zCode);

            const namespaceErrors = diagnostics.filter(
                (d) =>
                    d.message.includes('Activities') &&
                    d.message.includes('not allowed'),
            );

            expect(namespaceErrors.length).toBeGreaterThan(0);
        });
    });

    describe('edge Cases and Error Recovery', () => {
        it('should handle empty targets gracefully', () => {
            const zCode = `next EmptyApp {
}`;
            const diagnostics = parser.validateZMarkup(zCode);

            // Should not crash, might have warnings but no errors about structure
            const structureErrors = diagnostics.filter((d) =>
                d.message.includes('Unknown root element'),
            );

            expect(structureErrors).toHaveLength(0);
        });

        it('should handle nested structures correctly', () => {
            const zCode = `workspace Project {
    next app {
      Routes {
        posts {
          [slug]
        }
      }
    }
  }`;
            const diagnostics = parser.validateZMarkup(zCode);

            const structureErrors = diagnostics.filter(
                (d) => d.severity === DiagnosticSeverity.Error,
            );

            expect(structureErrors).toHaveLength(0);
        });

        it('should provide helpful error messages', () => {
            const zCode = `invalidTarget BadApp {
}`;
            const diagnostics = parser.validateZMarkup(zCode);

            const errors = diagnostics.filter(
                (d) => d.severity === DiagnosticSeverity.Error,
            );

            expect(errors.length).toBeGreaterThan(0);

            // Error message should suggest valid alternatives
            const errorMessage = errors[0].message;
            expect(errorMessage).toContain('Valid root elements');
            expect(errorMessage).toContain('next'); // Should suggest valid targets
        });
    });
});
