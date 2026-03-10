import type { DynamicToolDefinition } from "../extension-api";
import { getDiagnostics, DIAGNOSTICS_RETURN_DESCRIPTION_JAVA_RELATED } from "../utils/java-diagnostics";
import { GET_JAVA_DIAGNOSTICS_INPUT_SCHEMA } from "./schemas/get-java-diagnostics";

const DESCRIPTION = `Get current diagnostics for Java files in the workspace (vscode.languages.getDiagnostics). No input.

**Return:**
- diagnostics: ${DIAGNOSTICS_RETURN_DESCRIPTION_JAVA_RELATED}`;

export const JAVA_CLASS_INDEX_GET_JAVA_DIAGNOSTICS: DynamicToolDefinition = {
  name: "get_java_diagnostics",
  description: DESCRIPTION,
  inputSchema: GET_JAVA_DIAGNOSTICS_INPUT_SCHEMA,
  handler: async () => {
    return { diagnostics: getDiagnostics() };
  },
};
