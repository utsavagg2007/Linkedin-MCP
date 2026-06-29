"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/server.ts
var import_mcp = require("@modelcontextprotocol/sdk/server/mcp.js");
var import_stdio = require("@modelcontextprotocol/sdk/server/stdio.js");
var import_zod6 = require("zod");
var import_dotenv = __toESM(require("dotenv"));

// src/linkedin/client.ts
var import_axios = __toESM(require("axios"));
var LinkedInClient = class {
  client;
  accessToken;
  personUrn;
  constructor(accessToken, personUrn) {
    this.accessToken = accessToken;
    this.personUrn = personUrn;
    this.client = import_axios.default.create({
      baseURL: "https://api.linkedin.com/v2",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": "202401"
      }
    });
  }
  async getProfile() {
    try {
      const response = await this.client.get("/userinfo");
      return {
        id: response.data.sub,
        firstName: response.data.given_name,
        lastName: response.data.family_name,
        headline: response.data.headline || "",
        vanityName: response.data.vanityName || response.data.sub
      };
    } catch (error) {
      throw new Error(`Failed to fetch profile: ${error.message}`);
    }
  }
  async createTextPost(text, visibility = "PUBLIC") {
    try {
      const postBody = {
        author: `urn:li:person:${this.personUrn}`,
        commentary: text,
        visibility,
        distribution: {
          feedDistribution: "MAIN_FEED",
          thirdPartyDistributionChannels: []
        },
        lifecycleState: "PUBLISHED"
      };
      const response = await this.client.post("/posts", postBody);
      const postUrn = response.headers["x-restli-id"] || response.data.id;
      return {
        success: true,
        postId: postUrn,
        postUrl: postUrn ? `https://www.linkedin.com/feed/update/${postUrn}` : void 0
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
  async saveDraft(text) {
    try {
      const postBody = {
        author: `urn:li:person:${this.personUrn}`,
        commentary: text,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "NONE",
          thirdPartyDistributionChannels: []
        },
        lifecycleState: "DRAFT"
      };
      const response = await this.client.post("/posts", postBody);
      const postUrn = response.headers["x-restli-id"] || response.data.id;
      return { success: true, postId: postUrn };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
};

// src/tools/createPost.ts
var import_zod = require("zod");

// src/tools/postFormatter.ts
function formatPost(content, hashtags, addLineBreaks = true) {
  let formatted = content.trim();
  if (addLineBreaks) {
    formatted = formatted.replace(/ +/g, " ");
    formatted = formatted.replace(/\n{3,}/g, "\n\n");
  }
  if (hashtags.length > 0) {
    const hashtagLine = hashtags.map((tag) => tag.startsWith("#") ? tag : `#${tag}`).join(" ");
    formatted = `${formatted}

${hashtagLine}`;
  }
  return formatted;
}
function analyzePost(content) {
  const words = content.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const characterCount = content.length;
  const hashtagMatches = content.match(/#\w+/g) || [];
  const hashtagCount = hashtagMatches.length;
  let readabilityScore;
  if (wordCount < 50) readabilityScore = "low";
  else if (wordCount >= 50 && wordCount <= 400) readabilityScore = "high";
  else readabilityScore = "medium";
  const readSeconds = Math.ceil(wordCount / 200 * 60);
  const estimatedReadTime = readSeconds < 60 ? `${readSeconds} seconds` : `${Math.ceil(readSeconds / 60)} minute${Math.ceil(readSeconds / 60) > 1 ? "s" : ""}`;
  const suggestions = [];
  if (wordCount < 100)
    suggestions.push("Consider expanding \u2014 150\u2013300 words gets more reach.");
  if (wordCount > 500)
    suggestions.push("Too long. Trim to improve completion rate.");
  if (hashtagCount === 0)
    suggestions.push("Add 3\u20135 relevant hashtags to increase discoverability.");
  if (hashtagCount > 7)
    suggestions.push("Too many hashtags. Stick to 3\u20135 targeted ones.");
  if (!content.includes("?") && !content.includes("!"))
    suggestions.push("Add a question or CTA to boost engagement.");
  if (!content.includes("\n"))
    suggestions.push("Add line breaks \u2014 LinkedIn text is easier to skim with white space.");
  const firstLine = content.split("\n")[0].trim();
  if (firstLine.split(/\s+/).length > 12)
    suggestions.push('Opening line too long. Keep it under 12 words \u2014 it appears before "See more".');
  const hooks = generateHookSuggestions(content);
  return {
    wordCount,
    characterCount,
    hashtagCount,
    readabilityScore,
    estimatedReadTime,
    suggestions,
    hooks
  };
}
function generateHookSuggestions(content) {
  const firstLine = content.split("\n")[0].trim().replace(/#\w+/g, "").trim();
  return [
    `\u2753 What if ${firstLine.toLowerCase()}?`,
    `\u{1F6A8} Most people don't know this...`,
    `Here are 3 things I learned about ${firstLine.split(" ").slice(0, 3).join(" ")}:`
  ];
}
function generatePostTemplate(topic, tone) {
  const templates = {
    professional: `[Opening insight about ${topic}]

Here's what most people miss:

1\uFE0F\u20E3 [Key point one]

2\uFE0F\u20E3 [Key point two]

3\uFE0F\u20E3 [Key point three]

The takeaway?

[Strong closing statement about ${topic}]

What's your experience with ${topic}? Drop it in the comments \u{1F447}`,
    casual: `Okay, real talk about ${topic} \u{1F447}

[Share your genuine experience or observation]

[Add relatable detail]

[Honest reflection]

Anyone else feel this way? \u{1F605}`,
    inspirational: `[Powerful opening statement about ${topic}]

[Short story or turning point]

Here's what I want you to remember:

\u2728 [Inspirational message 1]
\u2728 [Inspirational message 2]
\u2728 [Inspirational message 3]

You've got this. \u{1F4AA}

[Tag someone who needs to hear this]`,
    educational: `Everything you need to know about ${topic} \u{1F9F5}

Most people overcomplicate this. Here's the simple version:

\u{1F4CC} What is it?
[Clear definition]

\u{1F4CC} Why it matters:
[Key benefit]

\u{1F4CC} How to apply it:
\u2192 Step 1: [Action]
\u2192 Step 2: [Action]
\u2192 Step 3: [Action]

Save this for later! \u{1F516}`,
    storytelling: `I was about to give up on ${topic}.

Then something unexpected happened.

[Set the scene \u2014 where were you, what was happening?]

[The turning point]

[What you did differently]

[The result]

The lesson? [Key takeaway]

Has ${topic} ever surprised you? I'd love to hear your story \u{1F447}`,
    promotional: `Excited to share something about ${topic}! \u{1F389}

[The problem your audience faces]

[How this solves it]

\u2705 [Benefit 1]
\u2705 [Benefit 2]
\u2705 [Benefit 3]

[Clear call to action \u2014 link in comments / DM me / comment below]`
  };
  return templates[tone];
}
function suggestHashtags(topic, count = 5) {
  const domainHashtags = {
    ai: ["#AI", "#ArtificialIntelligence", "#MachineLearning", "#LLM", "#GenerativeAI", "#AITools", "#FutureOfWork"],
    automation: ["#Automation", "#NoCode", "#LowCode", "#WorkflowAutomation", "#n8n", "#Make", "#BusinessAutomation"],
    saas: ["#SaaS", "#Startup", "#ProductLed", "#B2BSaaS", "#TechStartup", "#SaaSMarketing"],
    marketing: ["#Marketing", "#DigitalMarketing", "#ContentMarketing", "#GrowthHacking", "#LeadGeneration"],
    entrepreneurship: ["#Entrepreneurship", "#Startup", "#FounderLife", "#Bootstrapped", "#BusinessGrowth"],
    freelance: ["#Freelance", "#Freelancing", "#RemoteWork", "#Solopreneur", "#ConsultingLife"],
    tech: ["#Tech", "#Technology", "#SoftwareDevelopment", "#Programming", "#BuildInPublic"],
    leadership: ["#Leadership", "#Management", "#TeamBuilding", "#FutureOfWork", "#ProfessionalDevelopment"],
    productivity: ["#Productivity", "#Mindset", "#GrowthMindset", "#PersonalDevelopment"],
    healthcare: ["#HealthTech", "#DigitalHealth", "#MedTech", "#HealthcareIT", "#HealthcareInnovation"]
  };
  const topicLower = topic.toLowerCase();
  let matched = [];
  for (const [key, tags] of Object.entries(domainHashtags)) {
    if (topicLower.includes(key)) matched = [...matched, ...tags];
  }
  if (matched.length === 0) {
    matched = [
      `#${topic.replace(/\s+/g, "")}`,
      "#LinkedIn",
      "#ProfessionalDevelopment",
      "#Insights",
      "#BuildInPublic",
      "#Learning"
    ];
  }
  return [...new Set(matched)].slice(0, count);
}

// src/tools/createPost.ts
var createPostSchema = import_zod.z.object({
  content: import_zod.z.string().max(3e3).describe("Post text content (max 3000 chars)"),
  hashtags: import_zod.z.array(import_zod.z.string()).default([]).describe("Hashtags to append"),
  visibility: import_zod.z.enum(["PUBLIC", "CONNECTIONS", "LOGGED_IN"]).default("PUBLIC").describe("Post visibility"),
  save_as_draft: import_zod.z.boolean().default(false).describe("Save as draft instead of publishing")
});
async function createPost(input, linkedinClient) {
  const formattedContent = formatPost(input.content, input.hashtags);
  if (formattedContent.length > 3e3) {
    return JSON.stringify({
      success: false,
      error: `Exceeds 3000 char limit. Current: ${formattedContent.length}. Trim your content.`
    });
  }
  if (!linkedinClient) {
    return JSON.stringify({
      success: false,
      mode: "preview",
      message: "LinkedIn credentials not configured. Here is your formatted post:",
      formatted_post: formattedContent,
      character_count: formattedContent.length,
      instructions: "Set LINKEDIN_ACCESS_TOKEN and LINKEDIN_PERSON_URN in .env to enable publishing."
    }, null, 2);
  }
  try {
    const result = input.save_as_draft ? await linkedinClient.saveDraft(formattedContent) : await linkedinClient.createTextPost(formattedContent, input.visibility);
    return result.success ? JSON.stringify({ success: true, status: input.save_as_draft ? "Saved as draft" : "Published", postId: result.postId, postUrl: result.postUrl, formatted_post: formattedContent }, null, 2) : JSON.stringify({ success: false, error: result.error, formatted_post: formattedContent }, null, 2);
  } catch (error) {
    return JSON.stringify({ success: false, error: error.message, formatted_post: formattedContent }, null, 2);
  }
}

// src/tools/draftPost.ts
var import_zod2 = require("zod");
var draftPostSchema = import_zod2.z.object({
  topic: import_zod2.z.string().describe("The topic or subject of the LinkedIn post"),
  tone: import_zod2.z.enum(["professional", "casual", "inspirational", "educational", "storytelling", "promotional"]).default("professional").describe("Tone/style of the post"),
  key_points: import_zod2.z.array(import_zod2.z.string()).optional().describe("Key points to include"),
  include_hashtags: import_zod2.z.boolean().default(true).describe("Whether to include suggested hashtags"),
  hashtag_count: import_zod2.z.number().min(0).max(10).default(5).describe("Number of hashtags"),
  target_audience: import_zod2.z.string().optional().describe("Target audience description"),
  cta: import_zod2.z.string().optional().describe("Custom call-to-action")
});
async function draftPost(input) {
  const template = generatePostTemplate(input.topic, input.tone);
  const hashtags = input.include_hashtags ? suggestHashtags(input.topic, input.hashtag_count) : [];
  const contextNotes = [];
  if (input.target_audience) contextNotes.push(`\u{1F3AF} Target Audience: ${input.target_audience}`);
  if (input.key_points?.length) contextNotes.push(`\u{1F4CC} Key Points:
${input.key_points.map((p) => `  \u2022 ${p}`).join("\n")}`);
  if (input.cta) contextNotes.push(`\u{1F4E3} CTA: ${input.cta}`);
  return JSON.stringify({
    template,
    hashtags: hashtags.join(" "),
    context: contextNotes,
    usage_guide: {
      step1: "Replace all [bracketed placeholders] with your real content",
      step2: "Customize to match your personal voice",
      step3: "Use analyze_post tool to check quality before publishing"
    },
    linkedin_tips: [
      "Post between 8\u201310 AM or 12\u20132 PM on Tue\u2013Thu for best engagement",
      "First line determines if people click 'see more' \u2014 make it count",
      "Reply to every comment within the first hour to boost reach"
    ]
  }, null, 2);
}

// src/tools/analyzePost.ts
var import_zod3 = require("zod");
var analyzePostSchema = import_zod3.z.object({
  content: import_zod3.z.string().describe("The LinkedIn post content to analyze")
});
async function analyzePost2(input) {
  const analysis = analyzePost(input.content);
  let score = 50;
  if (analysis.wordCount >= 100 && analysis.wordCount <= 350) score += 15;
  else if (analysis.wordCount >= 50) score += 5;
  else score -= 10;
  if (analysis.hashtagCount >= 3 && analysis.hashtagCount <= 5) score += 10;
  else if (analysis.hashtagCount > 0) score += 5;
  if (analysis.readabilityScore === "high") score += 10;
  else if (analysis.readabilityScore === "medium") score += 5;
  if (input.content.includes("?") || input.content.includes("!")) score += 10;
  if (input.content.includes("\n")) score += 5;
  score = Math.min(100, Math.max(0, score));
  return JSON.stringify({
    score: `${score}/100`,
    grade: score >= 80 ? "A \u2014 Excellent" : score >= 65 ? "B \u2014 Good" : score >= 50 ? "C \u2014 Average" : "D \u2014 Needs Work",
    metrics: {
      wordCount: analysis.wordCount,
      characterCount: analysis.characterCount,
      hashtagCount: analysis.hashtagCount,
      readabilityScore: analysis.readabilityScore,
      estimatedReadTime: analysis.estimatedReadTime
    },
    improvements: analysis.suggestions,
    hook_alternatives: analysis.hooks,
    linkedin_character_limit: {
      current: analysis.characterCount,
      limit: 3e3,
      status: analysis.characterCount <= 3e3 ? "\u2705 Within limit" : "\u274C Exceeds limit \u2014 trim your post"
    }
  }, null, 2);
}

// src/tools/generateHashtags.ts
var import_zod4 = require("zod");
var generateHashtagsSchema = import_zod4.z.object({
  topic: import_zod4.z.string().describe("The topic or industry for the LinkedIn post"),
  count: import_zod4.z.number().min(1).max(10).default(5).describe("Number of hashtags"),
  custom_keywords: import_zod4.z.array(import_zod4.z.string()).optional().describe("Additional keywords to include as hashtags")
});
async function generateHashtags(input) {
  const hashtags = suggestHashtags(input.topic, input.count);
  if (input.custom_keywords && input.custom_keywords.length > 0) {
    const customTags = input.custom_keywords.map(
      (kw) => kw.startsWith("#") ? kw : `#${kw.replace(/\s+/g, "")}`
    );
    const all = [.../* @__PURE__ */ new Set([...hashtags, ...customTags])].slice(0, input.count + customTags.length);
    return JSON.stringify({ hashtags: all, formatted: all.join(" "), tip: "Use 3\u20135 hashtags per post for optimal reach." }, null, 2);
  }
  return JSON.stringify({
    hashtags,
    formatted: hashtags.join(" "),
    tip: "Use 3\u20135 hashtags per post for optimal reach."
  }, null, 2);
}

// src/tools/formatPost.ts
var import_zod5 = require("zod");
var formatPostSchema = import_zod5.z.object({
  content: import_zod5.z.string().describe("Raw post content to format"),
  hashtags: import_zod5.z.array(import_zod5.z.string()).default([]).describe("Hashtags to append"),
  add_emojis: import_zod5.z.boolean().default(false).describe("Add structural emojis"),
  add_line_breaks: import_zod5.z.boolean().default(true).describe("Ensure proper line breaks")
});
async function formatPostTool(input) {
  let content = input.content;
  if (input.add_emojis) {
    content = content.replace(/^1\.\s/gm, "1\uFE0F\u20E3 ");
    content = content.replace(/^2\.\s/gm, "2\uFE0F\u20E3 ");
    content = content.replace(/^3\.\s/gm, "3\uFE0F\u20E3 ");
    content = content.replace(/^4\.\s/gm, "4\uFE0F\u20E3 ");
    content = content.replace(/^5\.\s/gm, "5\uFE0F\u20E3 ");
    content = content.replace(/^- /gm, "\u2192 ");
    content = content.replace(/^\* /gm, "\u2192 ");
  }
  const formatted = formatPost(content, input.hashtags, input.add_line_breaks);
  return JSON.stringify({
    formatted_post: formatted,
    character_count: formatted.length,
    within_limit: formatted.length <= 3e3
  }, null, 2);
}

// src/server.ts
import_dotenv.default.config();
async function startServer() {
  let linkedinClient = null;
  if (process.env.LINKEDIN_ACCESS_TOKEN && process.env.LINKEDIN_PERSON_URN) {
    linkedinClient = new LinkedInClient(
      process.env.LINKEDIN_ACCESS_TOKEN,
      process.env.LINKEDIN_PERSON_URN
    );
    console.error("[LinkedIn MCP] \u2705 LinkedIn API client initialized");
  } else {
    console.error("[LinkedIn MCP] \u26A0\uFE0F  No credentials found. Running in preview mode.");
  }
  const server = new import_mcp.McpServer({
    name: "linkedin-post-creator",
    version: "1.0.0"
  });
  server.tool(
    "draft_post",
    "Generate a LinkedIn post template based on topic and tone.",
    {
      topic: import_zod6.z.string().describe("Topic or subject of the post"),
      tone: import_zod6.z.enum(["professional", "casual", "inspirational", "educational", "storytelling", "promotional"]).default("professional"),
      key_points: import_zod6.z.array(import_zod6.z.string()).optional().describe("Key points to include"),
      include_hashtags: import_zod6.z.boolean().default(true),
      hashtag_count: import_zod6.z.number().min(0).max(10).default(5),
      target_audience: import_zod6.z.string().optional(),
      cta: import_zod6.z.string().optional().describe("Custom call-to-action")
    },
    async (args) => ({ content: [{ type: "text", text: await draftPost(args) }] })
  );
  server.tool(
    "create_post",
    "Format and publish a LinkedIn post, or save as draft.",
    {
      content: import_zod6.z.string().max(3e3).describe("Post text content"),
      hashtags: import_zod6.z.array(import_zod6.z.string()).default([]),
      visibility: import_zod6.z.enum(["PUBLIC", "CONNECTIONS", "LOGGED_IN"]).default("PUBLIC"),
      save_as_draft: import_zod6.z.boolean().default(false)
    },
    async (args) => ({ content: [{ type: "text", text: await createPost(args, linkedinClient) }] })
  );
  server.tool(
    "analyze_post",
    "Score a LinkedIn post and return improvement suggestions.",
    {
      content: import_zod6.z.string().describe("The LinkedIn post content to analyze")
    },
    async (args) => ({ content: [{ type: "text", text: await analyzePost2(args) }] })
  );
  server.tool(
    "generate_hashtags",
    "Generate relevant LinkedIn hashtags for a topic.",
    {
      topic: import_zod6.z.string(),
      count: import_zod6.z.number().min(1).max(10).default(5),
      custom_keywords: import_zod6.z.array(import_zod6.z.string()).optional()
    },
    async (args) => ({ content: [{ type: "text", text: await generateHashtags(args) }] })
  );
  server.tool(
    "format_post",
    "Format raw content with proper LinkedIn structure and hashtags.",
    {
      content: import_zod6.z.string(),
      hashtags: import_zod6.z.array(import_zod6.z.string()).default([]),
      add_emojis: import_zod6.z.boolean().default(false),
      add_line_breaks: import_zod6.z.boolean().default(true)
    },
    async (args) => ({ content: [{ type: "text", text: await formatPostTool(args) }] })
  );
  server.resource("post_templates", "linkedin://templates", async () => ({
    contents: [{
      uri: "linkedin://templates",
      text: JSON.stringify({
        tones: ["professional", "casual", "inspirational", "educational", "storytelling", "promotional"],
        algorithm_tips: [
          "Native content outperforms external links",
          "First 3 lines before 'See more' determine engagement",
          "Comments are weighted higher than likes",
          "Post 2\u20135x per week for optimal algorithmic reach"
        ],
        best_structures: {
          thought_leadership: "Hook \u2192 Claim \u2192 Evidence \u2192 Framework \u2192 CTA",
          how_to: "Problem \u2192 Solution \u2192 Steps \u2192 Result \u2192 CTA",
          story: "Scene \u2192 Conflict \u2192 Turning point \u2192 Lesson",
          list: "Bold promise \u2192 5\u201310 items \u2192 Bonus insight \u2192 CTA"
        }
      }, null, 2)
    }]
  }));
  const transport = new import_stdio.StdioServerTransport();
  await server.connect(transport);
  console.error("[LinkedIn MCP] \u{1F680} Server running");
}

// src/index.ts
startServer().catch((err) => {
  console.error("[LinkedIn MCP] Fatal error:", err);
  process.exit(1);
});
