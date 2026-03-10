import { z } from "zod";

const GetJavaDiagnosticsInputSchema = z.object({});

const DiagnosticItemSchema = z.object({
  severity: z.string(),
  message: z.string(),
  line: z.number(),
  character: z.number(),
});

const GetJavaDiagnosticsOutputSchema = z.object({
  diagnostics: z.array(
    z.object({
      uri: z.string(),
      items: z.array(DiagnosticItemSchema),
    }),
  ),
});

export type GetJavaDiagnosticsInput = z.infer<typeof GetJavaDiagnosticsInputSchema>;
export type GetJavaDiagnosticsOutput = z.infer<typeof GetJavaDiagnosticsOutputSchema>;

export const GET_JAVA_DIAGNOSTICS_INPUT_SCHEMA = GetJavaDiagnosticsInputSchema.toJSONSchema();
export const GET_JAVA_DIAGNOSTICS_OUTPUT_SCHEMA = GetJavaDiagnosticsOutputSchema.toJSONSchema();
