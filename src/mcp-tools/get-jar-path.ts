import { existsSync } from "node:fs";
import { isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";

import type { DynamicToolDefinition } from "../extension-api";
import { extractJarPath } from "../utils/jar-utils";
import { resolveJarFromMaven } from "../utils/maven-repo";
import { resolveJdtUri } from "../utils/resolve-jdt-uri";
import type { JarPathResult } from "./schemas/get-jar-path";
import { GET_JAR_PATH_INPUT_SCHEMA, GET_JAR_PATH_OUTPUT_SCHEMA } from "./schemas/get-jar-path";

function isJarQuery(q: string): boolean {
  return q.trim().toLowerCase().endsWith(".jar");
}

async function findJarPath(query: string): Promise<JarPathResult> {
  if (isJarQuery(query)) {
    const q = query.trim();
    if (isAbsolute(q) && existsSync(q)) {
      return { query, jar_path: q, uri: pathToFileURL(q).toString() };
    }
    const jarPath = resolveJarFromMaven(q);
    if (jarPath) return { query, jar_path: jarPath, uri: pathToFileURL(jarPath).toString() };
    return { query, error: `Jar not found: ${query}` };
  }

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

const DESCRIPTION = `Find the jar file absolute path that contains one or more Java classes or jar names, using redhat.java (jdt://) or Maven repo lookup.

**Return Format:**
Array of results with:
- query: original query
- jar_path: absolute path to the jar file
- uri: jdt:// or file:// URI
- error: error message if not resolved
`;

export const JAVA_CLASS_INDEX_GET_JAR_PATH: DynamicToolDefinition = {
  name: "get_jar_path",
  description: DESCRIPTION,
  inputSchema: GET_JAR_PATH_INPUT_SCHEMA,
  outputSchema: GET_JAR_PATH_OUTPUT_SCHEMA,
  handler: async (input) => {
    const queries = input.queries as string[];
    if (!Array.isArray(queries) || queries.length === 0) {
      throw new Error("queries must be a non-empty array of class names or jar names/paths");
    }
    const results = await Promise.all(queries.map(findJarPath));
    return { results };
  },
};
