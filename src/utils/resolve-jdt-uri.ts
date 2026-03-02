import * as vscode from "vscode";

export interface JdtUriResult {
  uri?: vscode.Uri;
  error?: string;
  /** Populated when a simple name matches multiple classes; caller should ask user to disambiguate. */
  candidates?: string[];
}

async function executeSymbolSearch(searchQuery: string): Promise<vscode.SymbolInformation[]> {
  const result = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
    "vscode.executeWorkspaceSymbolProvider",
    searchQuery,
  );
  return result ?? [];
}

function symbolFqn(symbol: vscode.SymbolInformation): string {
  return symbol.containerName ? `${symbol.containerName}.${symbol.name}` : symbol.name;
}

function matchesFqn(symbol: vscode.SymbolInformation, simpleName: string, fqn: string): boolean {
  if (symbol.name !== simpleName) return false;
  if (!fqn.includes(".")) return true;
  const pkg = fqn.slice(0, fqn.lastIndexOf("."));
  return symbol.containerName === pkg || symbol.containerName?.endsWith(`.${pkg}`) === true;
}

/**
 * Resolves a Java class name to its jdt:// URI via workspace symbol lookup.
 * Falls back to executeDefinitionProvider if the symbol URI is not already jdt://.
 *
 * - FQN query  → returns the best-matching single symbol.
 * - Simple name with multiple distinct FQNs → returns `candidates` so the caller can disambiguate.
 */
export async function resolveJdtUri(query: string): Promise<JdtUriResult> {
  const isFqn = query.includes(".");
  let symbols: vscode.SymbolInformation[];
  try {
    symbols = await executeSymbolSearch(query);
    // Java LS often can't find results by FQN; retry with simple name
    if (symbols.length === 0 && isFqn) {
      symbols = await executeSymbolSearch(query.split(".").pop()!);
    }
  } catch (error) {
    return { error: `Symbol lookup failed: ${error instanceof Error ? error.message : String(error as unknown)}` };
  }

  if (symbols.length === 0) {
    return { error: `No symbols found for: ${query}` };
  }

  const simpleName = query.split(".").pop() ?? query;
  const nameMatches = symbols.filter((s) => s.name === simpleName);

  // FQN query: pick the symbol whose containerName matches the package
  const match = isFqn
    ? (symbols.find((s) => matchesFqn(s, simpleName, query)) ?? symbols.find((s) => s.name === simpleName) ?? symbols[0])
    : (nameMatches[0] ?? symbols[0]);

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

  // Simple name with multiple distinct FQNs: return candidates alongside the first match
  if (!isFqn && nameMatches.length > 1) {
    const fqns = [...new Set(nameMatches.map(symbolFqn))];
    if (fqns.length > 1) {
      return { uri: targetUri, candidates: fqns };
    }
  }

  return { uri: targetUri };
}
