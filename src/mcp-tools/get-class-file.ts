import * as vscode from "vscode";

import type { DynamicToolDefinition } from "../extension-api";
import { resolveJdtUri } from "../utils/resolve-jdt-uri";

interface ClassResult {
  query: string;
  source?: string;
  uri?: string;
  error?: string;
}

async function decompileClass(query: string): Promise<ClassResult> {
  const { uri, error } = await resolveJdtUri(query);
  if (error) return { query, error };

  try {
    const doc = await vscode.workspace.openTextDocument(uri!);
    return { query, source: doc.getText(), uri: uri!.toString() };
  } catch (error_) {
    return { query, error: `Failed to open ${uri}: ${error_ instanceof Error ? error_.message : String(error_)}` };
  }
}

const GET_CLASS_FILE_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    queries: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      description: "One or more Java class names to decompile, e.g. ['com.foo.Bar', 'ObjectMapper']",
    },
  },
  required: ["queries"],
};

export const JAVA_CLASS_INDEX_GET_CLASS_FILE: DynamicToolDefinition = {
  name: "get_class_content",
  description:
    "Get decompiled source of one or more Java classes from jar dependencies using redhat.java (jdt://). " +
    "Accepts FQN (e.g. com.foo.Bar) or simple class names. Returns human-readable decompiled Java source.",
  inputSchema: GET_CLASS_FILE_SCHEMA,
  handler: async (input) => {
    const queries = input.queries as string[];
    if (!Array.isArray(queries) || queries.length === 0) {
      throw new Error("queries must be a non-empty array of class names");
    }
    const results = await Promise.all(queries.map(decompileClass));
    return { results };
  },
};
