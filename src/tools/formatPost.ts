import { z } from "zod";
import { formatPost } from "./postFormatter.js";

export const formatPostSchema = z.object({
  content: z.string().describe("Raw post content to format"),
  hashtags: z.array(z.string()).default([]).describe("Hashtags to append"),
  add_emojis: z.boolean().default(false).describe("Add structural emojis"),
  add_line_breaks: z.boolean().default(true).describe("Ensure proper line breaks"),
});

export type FormatPostInput = z.infer<typeof formatPostSchema>;

export async function formatPostTool(input: FormatPostInput): Promise<string> {
  let content = input.content;

  if (input.add_emojis) {
    content = content.replace(/^1\.\s/gm, "1️⃣ ");
    content = content.replace(/^2\.\s/gm, "2️⃣ ");
    content = content.replace(/^3\.\s/gm, "3️⃣ ");
    content = content.replace(/^4\.\s/gm, "4️⃣ ");
    content = content.replace(/^5\.\s/gm, "5️⃣ ");
    content = content.replace(/^- /gm, "→ ");
    content = content.replace(/^\* /gm, "→ ");
  }

  const formatted = formatPost(content, input.hashtags, input.add_line_breaks);

  return JSON.stringify({
    formatted_post: formatted,
    character_count: formatted.length,
    within_limit: formatted.length <= 3000,
  }, null, 2);
}