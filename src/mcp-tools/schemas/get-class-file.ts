import { z } from "zod";

const GetClassFileInputSchema = z.object({
  queries: z
    .array(z.string())
    .min(1)
    .describe("One or more Java class names to decompile, e.g. ['com.foo.Bar', 'ObjectMapper']"),
  start_line: z
    .number()
    .int()
    .default(0)
    .describe("First line to include in the result (0-based, inclusive). Defaults to 0."),
  end_line: z
    .number()
    .int()
    .default(250)
    .describe("Last line to include in the result (0-based, inclusive). Defaults to 250."),
});

const ClassFileResultSchema = z.object({
  query: z.string().describe("The original query string"),
  source: z.string().optional().describe("Decompiled source code for the requested line range"),
  uri: z.string().optional().describe("jdt:// URI of the resolved class"),
  total_lines: z
    .number()
    .int()
    .optional()
    .describe("Total number of lines in the full decompiled file"),
  error: z
    .string()
    .optional()
    .describe("Error message if the class could not be resolved or opened"),
  candidates: z
    .array(z.string())
    .optional()
    .describe(
      "FQN candidates when the simple name is ambiguous; re-query with one to disambiguate",
    ),
});

const GetClassFileOutputSchema = z.object({
  results: z.array(ClassFileResultSchema),
});

export type GetClassFileInput = z.infer<typeof GetClassFileInputSchema>;
export type ClassFileResult = z.infer<typeof ClassFileResultSchema>;

export const GET_CLASS_FILE_INPUT_SCHEMA = GetClassFileInputSchema.toJSONSchema()
export const GET_CLASS_FILE_OUTPUT_SCHEMA = GetClassFileOutputSchema.toJSONSchema();
