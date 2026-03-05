import AdmZip from "adm-zip";

import type { DynamicToolDefinition } from "../extension-api";
import { resolveJarPathFromInput } from "../utils/jar-utils";
import {
  LIST_JAR_ENTRIES_INPUT_SCHEMA,
} from "./schemas/list-jar-entries";

const DESCRIPTION = `List entries (files/dirs) inside a jar, equivalent to 'jar -tf'.

**Input:** jar (path or Maven repo name) or queries (class names to resolve jar from workspace).
**Output:** entries array, optionally filtered by prefix and limited.
`;

export const JAVA_CLASS_INDEX_LIST_JAR_ENTRIES: DynamicToolDefinition = {
  name: "list_jar_entries",
  description: DESCRIPTION,
  inputSchema: LIST_JAR_ENTRIES_INPUT_SCHEMA,
  handler: async (input) => {
    const resolved = await resolveJarPathFromInput({
      jar: input.jar as string | undefined,
      queries: input.queries as string[] | undefined,
    });
    if (!resolved.ok) {
      return { entries: [], error: resolved.error };
    }

    try {
      const zip = new AdmZip(resolved.jar_path);
      const entries = zip.getEntries();
      let names = entries.map((e) => e.entryName);
      const prefix = input.prefix as string | undefined;
      if (prefix) {
        names = names.filter((n) => n.startsWith(prefix));
      }
      const limit = (input.limit as number | undefined) ?? 100;
      names = names.slice(0, limit);
      return { entries: names, jar_path: resolved.jar_path };
    } catch (error) {
      return {
        entries: [],
        jar_path: resolved.jar_path,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};
