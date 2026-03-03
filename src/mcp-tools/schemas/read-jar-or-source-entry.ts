import { z } from "zod";

const ReadJarOrSourceEntryInputSchema = z
  .object({
    entry_path: z
      .string()
      .describe("Path inside the jar, e.g. 'io/modelcontextprotocol/spec/McpSchema.class'"),
    jar: z
      .string()
      .optional()
      .describe(
        "Jar: absolute path (use as-is) or name/path relative to Maven local repo (from java.configuration.maven user/global settings or ~/.m2/repository). Provide this or queries.",
      ),
    queries: z
      .array(z.string())
      .optional()
      .describe("Java class names to resolve jar from workspace. Provide this or jar."),
    try_source: z
      .boolean()
      .default(false)
      .optional()
      .describe(
        "When true, first try to read from -sources.jar (Maven local repo) if available, then fall back to jar/decompile",
      ),
  })
  .refine(
    (d) =>
      /\.class$/i.test(d.entry_path) ||
      !!d.jar ||
      (Array.isArray(d.queries) && d.queries.length > 0),
    { message: "For non-.class entries provide jar or queries" },
  );

const ReadJarOrSourceEntryOutputSchema = z.object({
  content: z.string().optional().describe("Text content when UTF-8 decodable"),
  content_base64: z.string().optional().describe("Base64-encoded content when binary"),
  is_binary: z.boolean().optional().describe("True when content is binary"),
  error: z.string().optional().describe("Error message if the operation failed"),
});

export type ReadJarOrSourceEntryInput = z.infer<typeof ReadJarOrSourceEntryInputSchema>;
export type ReadJarOrSourceEntryOutput = z.infer<typeof ReadJarOrSourceEntryOutputSchema>;

export const READ_JAR_OR_SOURCE_ENTRY_INPUT_SCHEMA = ReadJarOrSourceEntryInputSchema.toJSONSchema();
export const READ_JAR_OR_SOURCE_ENTRY_OUTPUT_SCHEMA =
  ReadJarOrSourceEntryOutputSchema.toJSONSchema();
