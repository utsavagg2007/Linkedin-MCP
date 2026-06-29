import { z } from "zod";
import { generatePostTemplate, suggestHashtags } from "./postFormatter.js";
import { PostTone } from "../linkedin/types.js";

export const draftPostSchema = z.object({
  topic: z.string().describe("The topic or subject of the LinkedIn post"),
  tone: z.enum(["professional", "casual", "inspirational", "educational", "storytelling", "promotional"])
    .default("professional").describe("Tone/style of the post"),
  key_points: z.array(z.string()).optional().describe("Key points to include"),
  include_hashtags: z.boolean().default(true).describe("Whether to include suggested hashtags"),
  hashtag_count: z.number().min(0).max(10).default(5).describe("Number of hashtags"),
  target_audience: z.string().optional().describe("Target audience description"),
  cta: z.string().optional().describe("Custom call-to-action"),
});

export type DraftPostInput = z.infer<typeof draftPostSchema>;

export async function draftPost(input: DraftPostInput): Promise<string> {
  const template = generatePostTemplate(input.topic, input.tone as PostTone);
  const hashtags = input.include_hashtags ? suggestHashtags(input.topic, input.hashtag_count) : [];

  const contextNotes: string[] = [];
  if (input.target_audience) contextNotes.push(`🎯 Target Audience: ${input.target_audience}`);
  if (input.key_points?.length) contextNotes.push(`📌 Key Points:\n${input.key_points.map((p) => `  • ${p}`).join("\n")}`);
  if (input.cta) contextNotes.push(`📣 CTA: ${input.cta}`);

  return JSON.stringify({
    template,
    hashtags: hashtags.join(" "),
    context: contextNotes,
    usage_guide: {
      step1: "Replace all [bracketed placeholders] with your real content",
      step2: "Customize to match your personal voice",
      step3: "Use analyze_post tool to check quality before publishing",
    },
    linkedin_tips: [
      "Post between 8–10 AM or 12–2 PM on Tue–Thu for best engagement",
      "First line determines if people click 'see more' — make it count",
      "Reply to every comment within the first hour to boost reach",
    ],
  }, null, 2);
}