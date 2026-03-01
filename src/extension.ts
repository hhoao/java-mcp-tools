import type * as vscode from "vscode";

import { logger } from "./logger";
import { registerMcpTools, unregisterMcpTools } from "./mcp-register";

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push({ dispose: () => logger.dispose() });
  logger.info("Extension activating...");
  registerMcpTools();
}

export function deactivate(): void {
  unregisterMcpTools();
}
