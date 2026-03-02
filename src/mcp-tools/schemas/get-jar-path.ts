import { z } from "zod";

const GetJarPathInputSchema = z.object({
  queries: z
    .array(z.string())
    .min(1)
    .describe("One or more Java class names to look up, e.g. ['com.foo.Bar', 'ObjectMapper']"),
});

const JarPathResultSchema = z.object({
  query: z.string().describe("The original query string"),
  jar_path: z.string().optional().describe("Absolute path to the jar file containing the class"),
  uri: z.string().optional().describe("jdt:// URI of the resolved class"),
  error: z.string().optional().describe("Error message if the class could not be resolved"),
});

const GetJarPathOutputSchema = z.object({
  results: z.array(JarPathResultSchema),
});

export type GetJarPathInput = z.infer<typeof GetJarPathInputSchema>;
export type JarPathResult = z.infer<typeof JarPathResultSchema>;

export const GET_JAR_PATH_INPUT_SCHEMA = GetJarPathInputSchema.toJSONSchema();

export const GET_JAR_PATH_OUTPUT_SCHEMA = GetJarPathOutputSchema.toJSONSchema();
