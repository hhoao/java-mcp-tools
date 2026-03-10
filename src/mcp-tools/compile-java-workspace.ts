import * as vscode from "vscode";

import type { DynamicToolDefinition } from "../extension-api";
import { getDiagnostics, DIAGNOSTICS_RETURN_DESCRIPTION_JAVA_RELATED } from "../utils/java-diagnostics";
import { COMPILE_JAVA_WORKSPACE_INPUT_SCHEMA } from "./schemas/compile-java-workspace";

const DESCRIPTION = `Compile Java workspace (redhat.java). No args or full: false = incremental, full: true = full build. Returns diagnostics after compile.

**Input:** full (optional, default false).
**Return:** ok, full (echo), diagnostics (${DIAGNOSTICS_RETURN_DESCRIPTION_JAVA_RELATED}), error if failed or redhat.java unavailable.`;

export const JAVA_CLASS_INDEX_COMPILE_JAVA_WORKSPACE: DynamicToolDefinition = {
  name: "compile_java_workspace",
  description: DESCRIPTION,
  inputSchema: COMPILE_JAVA_WORKSPACE_INPUT_SCHEMA,
  handler: async (input) => {
    const full = input.full === true;
    if (!vscode.extensions.getExtension("redhat.java")) {
      return { ok: false, full, error: "redhat.java extension not installed or not available" };
    }
    try {
      await vscode.commands.executeCommand("java.workspace.compile", full);
      const diagnostics = getDiagnostics();
      return { ok: true, full, diagnostics };
    } catch (error) {
      return {
        ok: false,
        full,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};
