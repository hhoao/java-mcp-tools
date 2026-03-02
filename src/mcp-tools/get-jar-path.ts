import type * as vscode from "vscode";

import type { DynamicToolDefinition } from "../extension-api";
import { resolveJdtUri } from "../utils/resolve-jdt-uri";
import type { JarPathResult } from "./schemas/get-jar-path";
import { GET_JAR_PATH_INPUT_SCHEMA, GET_JAR_PATH_OUTPUT_SCHEMA } from "./schemas/get-jar-path";

/**
 * jdt:// URI query is decoded as: =projectName/\/absolute\/path\/to\/lib.jar=...
 * Extract the jar absolute path from it.
 */
function extractJarPath(jdtUri: vscode.Uri): string | undefined {
  const decoded = decodeURIComponent(jdtUri.query);
  // Remove leading =projectName/
  const afterProject = decoded.replace(/^=[^/]*\//, "");
  // Take the portion before any next '=' (which separates classpath segments)
  const jarEntry = afterProject.split("=")[0];
  // Unescape \/ → /
  const normalized = jarEntry.replaceAll(String.raw`\/`, "/");
  return normalized.endsWith(".jar") ? normalized : undefined;
}

async function findJarPath(query: string): Promise<JarPathResult> {
  const { uri, error } = await resolveJdtUri(query);
  if (error) return { query, error };

  if (uri!.scheme !== "jdt") {
    return { query, uri: uri!.toString(), error: "Symbol is in a source file, not a jar" };
  }

  const jarPath = extractJarPath(uri!);
  if (!jarPath) {
    return { query, uri: uri!.toString(), error: `Could not extract jar path from jdt URI: ${uri}` };
  }

  return { query, jar_path: jarPath, uri: uri!.toString() };
}

const DESCRIPTION = `Find the jar file path that contains one or more Java classes, using redhat.java (jdt://).

**Return Format:**
Array of results with:
- query: original class name
- jar_path: absolute path to the jar file containing the class
- uri: jdt:// URI of the resolved class
- error: error message if the class could not be resolved
`;

export const JAVA_CLASS_INDEX_GET_JAR_PATH: DynamicToolDefinition = {
  name: "get_jar_path",
  description: DESCRIPTION,
  inputSchema: GET_JAR_PATH_INPUT_SCHEMA,
  outputSchema: GET_JAR_PATH_OUTPUT_SCHEMA,
  handler: async (input) => {
    const queries = input.queries as string[];
    if (!Array.isArray(queries) || queries.length === 0) {
      throw new Error("queries must be a non-empty array of class names");
    }
    const results = await Promise.all(queries.map(findJarPath));
    return { results };
  },
};
