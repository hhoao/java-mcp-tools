import * as vscode from "vscode";

export interface JdtUriResult {
  uri?: vscode.Uri;
  error?: string;
}

/**
 * Resolves a Java class name to its jdt:// URI via workspace symbol lookup.
 * Falls back to executeDefinitionProvider if the symbol URI is not already jdt://.
 */
export async function resolveJdtUri(query: string): Promise<JdtUriResult> {
  let symbols: vscode.SymbolInformation[] | undefined;
  try {
    symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
      "vscode.executeWorkspaceSymbolProvider",
      query,
    );
  } catch (error) {
    return { error: `Symbol lookup failed: ${error instanceof Error ? error.message : String(error as unknown)}` };
  }

  if (!symbols || symbols.length === 0) {
    return { error: `No symbols found for: ${query}` };
  }

  const simpleName = query.split(".").pop() ?? query;
  const match = symbols.find((s) => s.name === simpleName || s.name === query) ?? symbols[0];

  let targetUri = match.location.uri;
  if (targetUri.scheme !== "jdt") {
    try {
      const defs = await vscode.commands.executeCommand<vscode.Location[]>(
        "vscode.executeDefinitionProvider",
        targetUri,
        match.location.range.start,
      );
      const jdtDef = defs?.find((d) => d.uri.scheme === "jdt");
      if (jdtDef) targetUri = jdtDef.uri;
    } catch {
      // fall through and use the original URI
    }
  }

  return { uri: targetUri };
}
