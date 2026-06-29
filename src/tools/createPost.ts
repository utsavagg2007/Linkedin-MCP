import { z } from "zod";
import { LinkedInClient } from "../linkedin/client.js";
import { formatPost } from "./postFormatter.js";

export const createPostSchema = z.object({
  content: z.string().max(3000).describe("Post text content (max 3000 chars)"),
  hashtags: z.array(z.string()).default([]).describe("Hashtags to append"),
  visibility: z.enum(["PUBLIC", "CONNECTIONS", "LOGGED_IN"]).default("PUBLIC").describe("Post visibility"),
  save_as_draft: z.boolean().default(false).describe("Save as draft instead of publishing"),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export async function createPost(input: CreatePostInput, linkedinClient: LinkedInClient | null): Promise<string> {
  const formattedContent = formatPost(input.content, input.hashtags);

  if (formattedContent.length > 3000) {
    return JSON.stringify({
      success: false,
      error: `Exceeds 3000 char limit. Current: ${formattedContent.length}. Trim your content.`,
    });
  }

  if (!linkedinClient) {
    return JSON.stringify({
      success: false,
      mode: "preview",
      message: "LinkedIn credentials not configured. Here is your formatted post:",
      formatted_post: formattedContent,
      character_count: formattedContent.length,
      instructions: "Set LINKEDIN_ACCESS_TOKEN and LINKEDIN_PERSON_URN in .env to enable publishing.",
    }, null, 2);
  }

  try {
    const result = input.save_as_draft
      ? await linkedinClient.saveDraft(formattedContent)
      : await linkedinClient.createTextPost(formattedContent, input.visibility);

    return result.success
      ? JSON.stringify({ success: true, status: input.save_as_draft ? "Saved as draft" : "Published", postId: result.postId, postUrl: result.postUrl, formatted_post: formattedContent }, null, 2)
      : JSON.stringify({ success: false, error: result.error, formatted_post: formattedContent }, null, 2);
  } catch (error: any) {
    return JSON.stringify({ success: false, error: error.message, formatted_post: formattedContent }, null, 2);
  }
}