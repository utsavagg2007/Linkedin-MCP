import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";

import { LinkedInClient } from "./linkedin/client.js";
import { createPost } from "./tools/createPost.js";
import { draftPost } from "./tools/draftPost.js";
import { analyzePost } from "./tools/analyzePost.js";
import { generateHashtags } from "./tools/generateHashtags.js";
import { formatPostTool } from "./tools/formatPost.js";

dotenv.config();

export async function startServer() {
  let linkedinClient: LinkedInClient | null = null;

  if (process.env.LINKEDIN_ACCESS_TOKEN && process.env.LINKEDIN_PERSON_URN) {
    linkedinClient = new LinkedInClient(
      process.env.LINKEDIN_ACCESS_TOKEN,
      process.env.LINKEDIN_PERSON_URN
    );
    console.error("[LinkedIn MCP] ✅ LinkedIn API client initialized");
  } else {
    console.error("[LinkedIn MCP] ⚠️  No credentials found. Running in preview mode.");
  }

  const server = new McpServer({
    name: "linkedin-post-creator",
    version: "1.0.0",
  });

  // ── Tool: draft_post ──────────────────────────────────────────────────────
  server.tool(
    "draft_post",
    "Generate a LinkedIn post template based on topic and tone.",
    {
      topic: z.string().describe("Topic or subject of the post"),
      tone: z.enum(["professional", "casual", "inspirational", "educational", "storytelling", "promotional"]).default("professional"),
      key_points: z.array(z.string()).optional().describe("Key points to include"),
      include_hashtags: z.boolean().default(true),
      hashtag_count: z.number().min(0).max(10).default(5),
      target_audience: z.string().optional(),
      cta: z.string().optional().describe("Custom call-to-action"),
    },
    async (args) => ({ content: [{ type: "text", text: await draftPost(args) }] })
  );

  // ── Tool: create_post ─────────────────────────────────────────────────────
  server.tool(
    "create_post",
    "Format and publish a LinkedIn post, or save as draft.",
    {
      content: z.string().max(3000).describe("Post text content"),
      hashtags: z.array(z.string()).default([]),
      visibility: z.enum(["PUBLIC", "CONNECTIONS", "LOGGED_IN"]).default("PUBLIC"),
      save_as_draft: z.boolean().default(false),
    },
    async (args) => ({ content: [{ type: "text", text: await createPost(args, linkedinClient) }] })
  );

  // ── Tool: analyze_post ────────────────────────────────────────────────────
  server.tool(
    "analyze_post",
    "Score a LinkedIn post and return improvement suggestions.",
    {
      content: z.string().describe("The LinkedIn post content to analyze"),
    },
    async (args) => ({ content: [{ type: "text", text: await analyzePost(args) }] })
  );

  // ── Tool: generate_hashtags ───────────────────────────────────────────────
  server.tool(
    "generate_hashtags",
    "Generate relevant LinkedIn hashtags for a topic.",
    {
      topic: z.string(),
      count: z.number().min(1).max(10).default(5),
      custom_keywords: z.array(z.string()).optional(),
    },
    async (args) => ({ content: [{ type: "text", text: await generateHashtags(args) }] })
  );

  // ── Tool: format_post ─────────────────────────────────────────────────────
  server.tool(
    "format_post",
    "Format raw content with proper LinkedIn structure and hashtags.",
    {
      content: z.string(),
      hashtags: z.array(z.string()).default([]),
      add_emojis: z.boolean().default(false),
      add_line_breaks: z.boolean().default(true),
    },
    async (args) => ({ content: [{ type: "text", text: await formatPostTool(args) }] })
  );

  // ── Resource: templates ───────────────────────────────────────────────────
  server.resource("post_templates", "linkedin://templates", async () => ({
    contents: [{
      uri: "linkedin://templates",
      text: JSON.stringify({
        tones: ["professional", "casual", "inspirational", "educational", "storytelling", "promotional"],
        algorithm_tips: [
          "Native content outperforms external links",
          "First 3 lines before 'See more' determine engagement",
          "Comments are weighted higher than likes",
          "Post 2–5x per week for optimal algorithmic reach",
        ],
        best_structures: {
          thought_leadership: "Hook → Claim → Evidence → Framework → CTA",
          how_to: "Problem → Solution → Steps → Result → CTA",
          story: "Scene → Conflict → Turning point → Lesson",
          list: "Bold promise → 5–10 items → Bonus insight → CTA",
        },
      }, null, 2),
    }],
  }));

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[LinkedIn MCP] 🚀 Server running");
}