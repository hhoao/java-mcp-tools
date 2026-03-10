import * as vscode from "vscode";

export const DIAGNOSTICS_RETURN_DESCRIPTION =
  "per-URI list of { severity, message, line, character }; only URIs with at least one diagnostic";

export const DIAGNOSTICS_RETURN_DESCRIPTION_JAVA_RELATED =
  `${DIAGNOSTICS_RETURN_DESCRIPTION}, filtered to Java-related files (.java, jdt:, pom.xml, build.gradle, settings.gradle, etc.)`;

export type DiagnosticItem = {
  severity: string;
  message: string;
  line: number;
  character: number;
};

export type DiagnosticEntry = { uri: string; items: DiagnosticItem[] };

const severityNames: Record<vscode.DiagnosticSeverity, string> = {
  [vscode.DiagnosticSeverity.Error]: "Error",
  [vscode.DiagnosticSeverity.Warning]: "Warning",
  [vscode.DiagnosticSeverity.Information]: "Information",
  [vscode.DiagnosticSeverity.Hint]: "Hint",
};

const JAVA_RELATED_SUFFIXES = [
  ".java",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "settings.gradle",
  "settings.gradle.kts",
];

export function isJavaRelatedUri(uri: vscode.Uri): boolean {
  if (uri.scheme === "jdt") return true;
  const p = uri.path;
  const fp = uri.fsPath;
  return JAVA_RELATED_SUFFIXES.some((s) => p.endsWith(s) || fp.endsWith(s));
}

export function getDiagnostics(options?: { javaRelatedOnly?: boolean }): DiagnosticEntry[] {
  const javaRelatedOnly = options?.javaRelatedOnly !== false;
  const result: DiagnosticEntry[] = [];
  for (const [uri, diags] of vscode.languages.getDiagnostics()) {
    if (diags.length === 0) continue;
    if (javaRelatedOnly && !isJavaRelatedUri(uri)) continue;
    result.push({
      uri: uri.toString(),
      items: diags.map((d) => ({
        severity: severityNames[d.severity] ?? "Unknown",
        message: d.message,
        line: d.range.start.line,
        character: d.range.start.character,
      })),
    });
  }
  return result;
}
