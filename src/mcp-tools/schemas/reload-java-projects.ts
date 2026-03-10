import { z } from "zod";

const ReloadJavaProjectsInputSchema = z.object({});

const DiagnosticItemSchema = z.object({
  severity: z.string(),
  message: z.string(),
  line: z.number(),
  character: z.number(),
});

const ReloadJavaProjectsOutputSchema = z.object({
  ok: z.boolean().describe("Whether the reload command was executed successfully"),
  reloaded_uris: z.array(z.string()).optional().describe("Project URIs that were reloaded"),
  diagnostics: z
    .array(
      z.object({
        uri: z.string(),
        items: z.array(DiagnosticItemSchema),
      }),
    )
    .optional()
    .describe("Diagnostics per URI after reload"),
  error: z.string().optional().describe("Error message if the command failed or extension unavailable"),
});

export type ReloadJavaProjectsInput = z.infer<typeof ReloadJavaProjectsInputSchema>;
export type ReloadJavaProjectsOutput = z.infer<typeof ReloadJavaProjectsOutputSchema>;

export const RELOAD_JAVA_PROJECTS_INPUT_SCHEMA = ReloadJavaProjectsInputSchema.toJSONSchema();
export const RELOAD_JAVA_PROJECTS_OUTPUT_SCHEMA = ReloadJavaProjectsOutputSchema.toJSONSchema();
