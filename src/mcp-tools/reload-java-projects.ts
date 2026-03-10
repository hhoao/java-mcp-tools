import * as vscode from "vscode";

import type { DynamicToolDefinition } from "../extension-api";
import { getDiagnostics, DIAGNOSTICS_RETURN_DESCRIPTION } from "../utils/java-diagnostics";
import { RELOAD_JAVA_PROJECTS_INPUT_SCHEMA } from "./schemas/reload-java-projects";

const DESCRIPTION = `Reload all Java projects in the workspace (java.project.getAll + java.projectConfiguration.update per project) and return current diagnostics. No input.

**Return:**
- ok: whether reload succeeded
- reloaded_uris: project URIs that were updated
- diagnostics: ${DIAGNOSTICS_RETURN_DESCRIPTION}
- error: present when ok is false`;

export const JAVA_CLASS_INDEX_RELOAD_JAVA_PROJECTS: DynamicToolDefinition = {
  name: "java_reload_projects",
  description: DESCRIPTION,
  inputSchema: RELOAD_JAVA_PROJECTS_INPUT_SCHEMA,
  handler: async () => {
    const ext = vscode.extensions.getExtension("redhat.java");
    if (!ext) {
      return { ok: false, error: "redhat.java extension not installed or not available" };
    }
    try {
      const projects = await vscode.commands.executeCommand<string[]>(
        "java.execute.workspaceCommand",
        "java.project.getAll",
      );
      const uris = Array.isArray(projects) ? projects : [];
      const reloaded: string[] = [];
      for (const projectUri of uris) {
        await vscode.commands.executeCommand(
          "java.projectConfiguration.update",
          vscode.Uri.parse(projectUri),
        );
        reloaded.push(projectUri);
      }

      const diagnostics = getDiagnostics({ javaRelatedOnly: false });
      return { ok: true, reloaded_uris: reloaded, diagnostics };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};
