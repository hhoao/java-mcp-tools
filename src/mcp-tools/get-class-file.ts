import * as vscode from "vscode";

import type { DynamicToolDefinition } from "../extension-api";
import { resolveJdtUri } from "../utils/resolve-jdt-uri";
import type { ClassFileResult } from "./schemas/get-class-file";
import { GET_CLASS_FILE_INPUT_SCHEMA } from "./schemas/get-class-file";

function extractLines(text: string, startLine: number, endLine: number): { source: string; totalLines: number } {
  const lines = text.split("\n");
  const totalLines = lines.length;
  const sliced = lines.slice(startLine, endLine + 1).join("\n");
  return { source: sliced, totalLines };
}

async function decompileClass(query: string, startLine: number, endLine: number): Promise<ClassFileResult> {
  const { uri, error, candidates } = await resolveJdtUri(query);
  if (error) return { query, error };

  try {
    const doc = await vscode.workspace.openTextDocument(uri!);
    const { source, totalLines } = extractLines(doc.getText(), startLine, endLine);
    return { query, source, uri: uri!.toString(), total_lines: totalLines, candidates };
  } catch (error_) {
    return { query, error: `Failed to open ${uri}: ${error_ instanceof Error ? error_.message : String(error_)}` };
  }
}


const DESCRIPTION = `Get decompiled source of one or more Java classes from jar dependencies using redhat.java (jdt://).

**Return Format:**
Array of results with:
- query: original class name
- source: decompiled source code for the requested line range
- uri: jdt:// URI of the resolved class
- total_lines: total number of lines in the full decompiled file
- candidates: FQN candidates when the simple name is ambiguous; re-query with one to disambiguate
- error: error message if the class could not be resolved or opened
`;

export const JAVA_CLASS_INDEX_GET_CLASS_FILE: DynamicToolDefinition = {
  name: "get_class_content",
  description: DESCRIPTION,
  inputSchema: GET_CLASS_FILE_INPUT_SCHEMA,
  handler: async (input) => {
    const queries = input.queries as string[];
    if (!Array.isArray(queries) || queries.length === 0) {
      throw new Error("queries must be a non-empty array of class names");
    }
    const startLine: number = typeof input.start_line === "number" ? input.start_line : 0;
    const endLine: number = typeof input.end_line === "number" ? input.end_line : 250;
    const results = await Promise.all(queries.map((q) => decompileClass(q, startLine, endLine)));
    return { results };
  },
};
