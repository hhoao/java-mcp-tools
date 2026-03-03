import { isAbsolute } from "node:path";

import type * as vscode from "vscode";

import { resolveJarFromMaven } from "./maven-repo";
import { resolveJdtUri } from "./resolve-jdt-uri";

export type ResolveJarResult =
  | { ok: true; jar_path: string }
  | { ok: false; error: string };

export function extractJarPath(jdtUri: vscode.Uri): string | undefined {
  const decoded = decodeURIComponent(jdtUri.query);
  const afterProject = decoded.replace(/^=[^/]*\//, "");
  const jarEntry = afterProject.split("=")[0];
  const normalized = jarEntry.replaceAll(String.raw`\/`, "/");
  return normalized.endsWith(".jar") ? normalized : undefined;
}

export async function resolveJarPathFromInput(input: {
  jar?: string;
  queries?: string[];
}): Promise<ResolveJarResult> {
  if (input.jar) {
    const jar = input.jar.trim();
    if (isAbsolute(jar)) {
      return { ok: true, jar_path: jar };
    }
    const resolved = resolveJarFromMaven(jar);
    if (resolved) return { ok: true, jar_path: resolved };
    return { ok: false, error: `Jar not found in Maven repo: ${jar}` };
  }
  const queries = input.queries;
  if (!Array.isArray(queries) || queries.length === 0) {
    return { ok: false, error: "Provide jar or a non-empty queries array" };
  }
  const { uri, error } = await resolveJdtUri(queries[0]);
  if (error) return { ok: false, error };
  if (uri!.scheme !== "jdt") {
    return { ok: false, error: "Symbol is in a source file, not a jar" };
  }
  const jarPath = extractJarPath(uri!);
  if (!jarPath) {
    return { ok: false, error: `Could not extract jar path from jdt URI: ${uri}` };
  }
  return { ok: true, jar_path: jarPath };
}
