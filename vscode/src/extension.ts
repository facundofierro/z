import * as path from "path";
import {
  workspace,
  ExtensionContext,
} from "vscode";

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";

let client: LanguageClient;

export function activate(
  context: ExtensionContext
) {
  // Check if user has configured a custom server path
  const config =
    workspace.getConfiguration(
      "z-language"
    );
  const customServerPath =
    config.get<string>("server.path");

  // Default to the new z-language-server CLI
  // First try to find it in the workspace, then fall back to global installation
  const defaultServerPath =
    customServerPath ||
    path.join(
      workspace.workspaceFolders?.[0]
        ?.uri.fsPath || "",
      "z-language-server",
      "lib",
      "cli.mjs"
    ) ||
    "z-language-server"; // Global installation

  // Server options for the new z-language-server
  const serverOptions: ServerOptions = {
    run: {
      command: "node",
      args: [
        defaultServerPath,
        "--stdio",
      ],
      transport: TransportKind.stdio,
    },
    debug: {
      command: "node",
      args: [
        defaultServerPath,
        "--stdio",
        "--log-level",
        "4",
      ],
      transport: TransportKind.stdio,
    },
  };

  // Options to control the language client
  const clientOptions: LanguageClientOptions =
    {
      // Register the server for Z language documents
      documentSelector: [
        {
          scheme: "file",
          language: "z",
        },
      ],
      synchronize: {
        // Notify the server about file changes to '.z' files contained in the workspace
        fileEvents:
          workspace.createFileSystemWatcher(
            "**/*.z"
          ),
      },
    };

  // Create the language client and start the client.
  client = new LanguageClient(
    "z-language-server",
    "Z Language Server",
    serverOptions,
    clientOptions
  );

  // Start the client. This will also launch the server
  client.start();
}

export function deactivate():
  | Thenable<void>
  | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
