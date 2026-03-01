import * as vscode from "vscode";

import type { VscodeMcpBridgeAPI } from "./extension-api";
import { logger } from "./logger";
import {
  JAVA_CLASS_INDEX_GET_CLASS_FILE,
  JAVA_CLASS_INDEX_GET_JAR_PATH,
} from "./mcp-tools";

const MCP_TOOLS = [JAVA_CLASS_INDEX_GET_CLASS_FILE, JAVA_CLASS_INDEX_GET_JAR_PATH];

let mcpBridgeApi: VscodeMcpBridgeAPI | null = null;

export function registerMcpTools(): void {
  const bridgeExt = vscode.extensions.getExtension("yutengjing.vscode-mcp-bridge");
  if (!bridgeExt) {
    logger.warn("vscode-mcp-bridge not found, MCP tools will not be registered");
    return;
  }
  bridgeExt.activate().then((api: unknown) => {
    const bridge = api as VscodeMcpBridgeAPI | undefined;
    if (!bridge?.registerTool) {
      logger.warn("vscode-mcp-bridge API not available");
      return;
    }
    mcpBridgeApi = bridge;
    for (const tool of MCP_TOOLS) bridge.registerTool(tool);
    logger.info(`Registered MCP tools: ${MCP_TOOLS.map((t) => t.name).join(", ")}`);
  }).then(undefined, (error: unknown) => {
    logger.warn(`Failed to register MCP tools: ${(error as Error)?.message ?? error}`);
  });
}

export function unregisterMcpTools(): void {
  if (mcpBridgeApi) {
    for (const tool of MCP_TOOLS) mcpBridgeApi.unregisterTool(tool.name);
    mcpBridgeApi = null;
  }
}
