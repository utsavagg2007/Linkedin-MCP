import { z } from "zod";
import { suggestHashtags } from "./postFormatter.js";

export const generateHashtagsSchema = z.object({
  topic: z.string().describe("The topic or industry for the LinkedIn post"),
  count: z.number().min(1).max(10).default(5).describe("Number of hashtags"),
  custom_keywords: z.array(z.string()).optional().describe("Additional keywords to include as hashtags"),
});

export type GenerateHashtagsInput = z.infer<typeof generateHashtagsSchema>;

export async function generateHashtags(input: GenerateHashtagsInput): Promise<string> {
  const hashtags = suggestHashtags(input.topic, input.count);

  if (input.custom_keywords && input.custom_keywords.length > 0) {
    const customTags = input.custom_keywords.map((kw) =>
      kw.startsWith("#") ? kw : `#${kw.replace(/\s+/g, "")}`
    );
    const all = [...new Set([...hashtags, ...customTags])].slice(0, input.count + customTags.length);
    return JSON.stringify({ hashtags: all, formatted: all.join(" "), tip: "Use 3–5 hashtags per post for optimal reach." }, null, 2);
  }

  return JSON.stringify({
    hashtags,
    formatted: hashtags.join(" "),
    tip: "Use 3–5 hashtags per post for optimal reach.",
  }, null, 2);
}