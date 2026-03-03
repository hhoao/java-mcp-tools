import { Buffer } from "node:buffer";
import { existsSync } from "node:fs";

import { decompile as cfrDecompile } from "@run-slicer/cfr";
import AdmZip from "adm-zip";
import * as vscode from "vscode";

import type { DynamicToolDefinition } from "../extension-api";
import { extractJarPath, resolveJarPathFromInput } from "../utils/jar-utils";
import { resolveJdtUri } from "../utils/resolve-jdt-uri";
import {
  READ_JAR_OR_SOURCE_ENTRY_INPUT_SCHEMA,
  READ_JAR_OR_SOURCE_ENTRY_OUTPUT_SCHEMA,
} from "./schemas/read-jar-or-source-entry";

function entryPathToFqn(entryPath: string): string {
  return entryPath.replace(/\.class$/i, "").replaceAll("/", ".");
}

function entryPathToSourcePath(entryPath: string): string {
  return entryPath.replace(/\.class$/i, ".java");
}

function sourcesJarPath(jarPath: string): string {
  return jarPath.replace(/\.jar$/i, "-sources.jar");
}

function isUtf8(data: Buffer): boolean {
  try {
    const decoded = data.toString("utf8");
    const reencoded = Buffer.from(decoded, "utf8");
    return reencoded.equals(data);
  } catch {
    return false;
  }
}

function readEntryFromZip(zipPath: string, entryPath: string): { content?: string; content_base64?: string; is_binary?: boolean } | null {
  try {
    const zip = new AdmZip(zipPath);
    const entry = zip.getEntry(entryPath);
    if (!entry || entry.isDirectory) return null;
    const data = entry.getData();
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    if (isUtf8(buffer)) {
      return { content: buffer.toString("utf8") };
    }
    return { content_base64: buffer.toString("base64"), is_binary: true };
  } catch {
    return null;
  }
}

const DESCRIPTION = `Read a file entry from a jar or its -sources.jar. .class entries are decompiled with CFR (or JDT fallback when jar not resolved).

**Input:** entry_path (required), jar or queries, try_source (optional).
**Output:** content (source or decompiled), or content_base64 (binary).
`;

export const JAVA_CLASS_INDEX_READ_JAR_OR_SOURCE_ENTRY: DynamicToolDefinition = {
  name: "read_jar_or_source_entry",
  description: DESCRIPTION,
  inputSchema: READ_JAR_OR_SOURCE_ENTRY_INPUT_SCHEMA,
  outputSchema: READ_JAR_OR_SOURCE_ENTRY_OUTPUT_SCHEMA,
  handler: async (input) => {
    const entryPath = input.entry_path as string;
    if (!entryPath || typeof entryPath !== "string") {
      return { error: "entry_path is required" };
    }

    const trySource = input.try_source === true;
    const isClass = /\.class$/i.test(entryPath);

    if (trySource) {
      let jarPath: string | undefined;
      if (input.jar) {
        const jarRes = await resolveJarPathFromInput({ jar: input.jar as string });
        if (jarRes.ok) jarPath = jarRes.jar_path;
      } else if (Array.isArray(input.queries) && input.queries.length > 0) {
        const resolved = await resolveJarPathFromInput({
          queries: input.queries as string[],
        });
        if (resolved.ok) jarPath = resolved.jar_path;
      } else if (isClass) {
        const fqn = entryPathToFqn(entryPath);
        const { uri, error } = await resolveJdtUri(fqn);
        if (!error && uri?.scheme === "jdt") {
          jarPath = extractJarPath(uri);
        }
      }

      if (jarPath) {
        const srcJar = sourcesJarPath(jarPath);
        if (existsSync(srcJar)) {
          const sourcePath = isClass ? entryPathToSourcePath(entryPath) : entryPath;
          const result = readEntryFromZip(srcJar, sourcePath);
          if (result) return result;
        }
      }
    }

    if (isClass) {
      const resolvedForCfr = await resolveJarPathFromInput({
        jar: input.jar as string | undefined,
        queries: input.queries as string[] | undefined,
      });
      if (resolvedForCfr.ok) {
        try {
          const zip = new AdmZip(resolvedForCfr.jar_path);
          const internalName = entryPath.replace(/\.class$/i, "");
          const source = async (name: string): Promise<Uint8Array | null> => {
            const entry = zip.getEntry(`${name}.class`);
            if (!entry || entry.isDirectory) return null;
            const data = entry.getData();
            const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
            return new Uint8Array(buf);
          };
          const code = await cfrDecompile(internalName, { source });
          return { content: code };
        } catch {
          // fallback to JDT
        }
      }
      const fqn = entryPathToFqn(entryPath);
      const { uri, error } = await resolveJdtUri(fqn);
      if (error) {
        return { error: `Cannot decompile: ${error}` };
      }
      try {
        const doc = await vscode.workspace.openTextDocument(uri!);
        return { content: doc.getText() };
      } catch (error_) {
        return {
          error: error_ instanceof Error ? error_.message : String(error_),
        };
      }
    }

    const resolved = await resolveJarPathFromInput({
      jar: input.jar as string | undefined,
      queries: input.queries as string[] | undefined,
    });
    if (!resolved.ok) {
      return { error: resolved.error };
    }

    try {
      const zip = new AdmZip(resolved.jar_path);
      const entry = zip.getEntry(entryPath);
      if (!entry || entry.isDirectory) {
        return { error: `Entry not found or is directory: ${entryPath}` };
      }
      const data = entry.getData();
      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
      if (isUtf8(buffer)) {
        return { content: buffer.toString("utf8") };
      }
      return { content_base64: buffer.toString("base64"), is_binary: true };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};
