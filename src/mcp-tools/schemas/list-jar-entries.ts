import { z } from "zod";

const ListJarEntriesInputSchema = z
  .object({
    jar: z
      .string()
      .optional()
      .describe(
        "Jar: absolute path (use as-is) or name/path relative to Maven local repo. Provide this or queries.",
      ),
    queries: z
      .array(z.string())
      .optional()
      .describe("Java class names to resolve jar from workspace. Provide this or jar."),
    prefix: z.string().optional().describe("Filter entries by path prefix, e.g. 'io/modelcontextprotocol/'"),
    limit: z
      .number()
      .int()
      .default(100)
      .optional()
      .describe("Max number of entries to return. Defaults to 100."),
  })
  .refine(
    (d) => !!d.jar || (Array.isArray(d.queries) && d.queries.length > 0),
    { message: "Provide jar or a non-empty queries array" },
  );

const ListJarEntriesOutputSchema = z.object({
  entries: z.array(z.string()).describe("Entry paths in the jar"),
  jar_path: z.string().optional().describe("Resolved jar path"),
  error: z.string().optional().describe("Error message if the operation failed"),
});

export type ListJarEntriesInput = z.infer<typeof ListJarEntriesInputSchema>;
export type ListJarEntriesOutput = z.infer<typeof ListJarEntriesOutputSchema>;

export const LIST_JAR_ENTRIES_INPUT_SCHEMA = ListJarEntriesInputSchema.toJSONSchema();
export const LIST_JAR_ENTRIES_OUTPUT_SCHEMA = ListJarEntriesOutputSchema.toJSONSchema();
