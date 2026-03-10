import { z } from "zod";

const CompileJavaWorkspaceInputSchema = z.object({
  full: z
    .boolean()
    .optional()
    .default(false)
    .describe("true = full build, false = incremental build. Default: false."),
});

const DiagnosticItemSchema = z.object({
  severity: z.string(),
  message: z.string(),
  line: z.number(),
  character: z.number(),
});

const CompileJavaWorkspaceOutputSchema = z.object({
  ok: z.boolean(),
  full: z.boolean().describe("Whether full compile was requested"),
  diagnostics: z
    .array(
      z.object({
        uri: z.string(),
        items: z.array(DiagnosticItemSchema),
      }),
    )
    .optional()
    .describe("Java-related diagnostics after compile"),
  error: z.string().optional(),
});

export type CompileJavaWorkspaceInput = z.infer<typeof CompileJavaWorkspaceInputSchema>;
export type CompileJavaWorkspaceOutput = z.infer<typeof CompileJavaWorkspaceOutputSchema>;

export const COMPILE_JAVA_WORKSPACE_INPUT_SCHEMA = CompileJavaWorkspaceInputSchema.toJSONSchema();
export const COMPILE_JAVA_WORKSPACE_OUTPUT_SCHEMA = CompileJavaWorkspaceOutputSchema.toJSONSchema();
