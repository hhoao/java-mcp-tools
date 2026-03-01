export interface DynamicToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (input: Record<string, unknown>) => Promise<unknown>;
}

export interface VscodeMcpBridgeAPI {
  registerTool(tool: DynamicToolDefinition): void;
  unregisterTool(name: string): void;
}
