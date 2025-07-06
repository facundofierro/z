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
  // The server is implemented in Node.js
  const serverModule =
    context.asAbsolutePath(
      path.join(
        "..",
        "lsp",
        "dist",
        "server.js"
      )
    );

  // Check if user has configured a custom server path
  const config =
    workspace.getConfiguration(
      "z-language"
    );
  const customServerPath =
    config.get<string>("server.path");

  const serverPath =
    customServerPath || serverModule;

  // The debug options for the server
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
  const debugOptions = {
    execArgv: [
      "--nolazy",
      "--inspect=6009",
    ],
  };

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: {
      module: serverPath,
      transport: TransportKind.ipc,
    },
    debug: {
      module: serverPath,
      transport: TransportKind.ipc,
      options: debugOptions,
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
