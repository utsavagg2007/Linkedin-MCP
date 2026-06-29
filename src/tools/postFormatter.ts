import { PostTone, PostAnalysis } from "../linkedin/types.js";

export function formatPost(
  content: string,
  hashtags: string[],
  addLineBreaks = true
): string {
  let formatted = content.trim();

  if (addLineBreaks) {
    formatted = formatted.replace(/ +/g, " ");
    formatted = formatted.replace(/\n{3,}/g, "\n\n");
  }

  if (hashtags.length > 0) {
    const hashtagLine = hashtags
      .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
      .join(" ");
    formatted = `${formatted}\n\n${hashtagLine}`;
  }

  return formatted;
}

export function analyzePost(content: string): PostAnalysis {
  const words = content.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const characterCount = content.length;
  const hashtagMatches = content.match(/#\w+/g) || [];
  const hashtagCount = hashtagMatches.length;

  let readabilityScore: "low" | "medium" | "high";
  if (wordCount < 50) readabilityScore = "low";
  else if (wordCount >= 50 && wordCount <= 400) readabilityScore = "high";
  else readabilityScore = "medium";

  const readSeconds = Math.ceil((wordCount / 200) * 60);
  const estimatedReadTime =
    readSeconds < 60
      ? `${readSeconds} seconds`
      : `${Math.ceil(readSeconds / 60)} minute${Math.ceil(readSeconds / 60) > 1 ? "s" : ""}`;

  const suggestions: string[] = [];

  if (wordCount < 100)
    suggestions.push("Consider expanding — 150–300 words gets more reach.");
  if (wordCount > 500)
    suggestions.push("Too long. Trim to improve completion rate.");
  if (hashtagCount === 0)
    suggestions.push("Add 3–5 relevant hashtags to increase discoverability.");
  if (hashtagCount > 7)
    suggestions.push("Too many hashtags. Stick to 3–5 targeted ones.");
  if (!content.includes("?") && !content.includes("!"))
    suggestions.push("Add a question or CTA to boost engagement.");
  if (!content.includes("\n"))
    suggestions.push("Add line breaks — LinkedIn text is easier to skim with white space.");

  const firstLine = content.split("\n")[0].trim();
  if (firstLine.split(/\s+/).length > 12)
    suggestions.push('Opening line too long. Keep it under 12 words — it appears before "See more".');

  const hooks = generateHookSuggestions(content);

  return {
    wordCount,
    characterCount,
    hashtagCount,
    readabilityScore,
    estimatedReadTime,
    suggestions,
    hooks,
  };
}

function generateHookSuggestions(content: string): string[] {
  const firstLine = content.split("\n")[0].trim().replace(/#\w+/g, "").trim();
  return [
    `❓ What if ${firstLine.toLowerCase()}?`,
    `🚨 Most people don't know this...`,
    `Here are 3 things I learned about ${firstLine.split(" ").slice(0, 3).join(" ")}:`,
  ];
}

export function generatePostTemplate(topic: string, tone: PostTone): string {
  const templates: Record<PostTone, string> = {
    professional: `[Opening insight about ${topic}]

Here's what most people miss:

1️⃣ [Key point one]

2️⃣ [Key point two]

3️⃣ [Key point three]

The takeaway?

[Strong closing statement about ${topic}]

What's your experience with ${topic}? Drop it in the comments 👇`,

    casual: `Okay, real talk about ${topic} 👇

[Share your genuine experience or observation]

[Add relatable detail]

[Honest reflection]

Anyone else feel this way? 😅`,

    inspirational: `[Powerful opening statement about ${topic}]

[Short story or turning point]

Here's what I want you to remember:

✨ [Inspirational message 1]
✨ [Inspirational message 2]
✨ [Inspirational message 3]

You've got this. 💪

[Tag someone who needs to hear this]`,

    educational: `Everything you need to know about ${topic} 🧵

Most people overcomplicate this. Here's the simple version:

📌 What is it?
[Clear definition]

📌 Why it matters:
[Key benefit]

📌 How to apply it:
→ Step 1: [Action]
→ Step 2: [Action]
→ Step 3: [Action]

Save this for later! 🔖`,

    storytelling: `I was about to give up on ${topic}.

Then something unexpected happened.

[Set the scene — where were you, what was happening?]

[The turning point]

[What you did differently]

[The result]

The lesson? [Key takeaway]

Has ${topic} ever surprised you? I'd love to hear your story 👇`,

    promotional: `Excited to share something about ${topic}! 🎉

[The problem your audience faces]

[How this solves it]

✅ [Benefit 1]
✅ [Benefit 2]
✅ [Benefit 3]

[Clear call to action — link in comments / DM me / comment below]`,
  };

  return templates[tone];
}

export function suggestHashtags(topic: string, count = 5): string[] {
  const domainHashtags: Record<string, string[]> = {
    ai: ["#AI", "#ArtificialIntelligence", "#MachineLearning", "#LLM", "#GenerativeAI", "#AITools", "#FutureOfWork"],
    automation: ["#Automation", "#NoCode", "#LowCode", "#WorkflowAutomation", "#n8n", "#Make", "#BusinessAutomation"],
    saas: ["#SaaS", "#Startup", "#ProductLed", "#B2BSaaS", "#TechStartup", "#SaaSMarketing"],
    marketing: ["#Marketing", "#DigitalMarketing", "#ContentMarketing", "#GrowthHacking", "#LeadGeneration"],
    entrepreneurship: ["#Entrepreneurship", "#Startup", "#FounderLife", "#Bootstrapped", "#BusinessGrowth"],
    freelance: ["#Freelance", "#Freelancing", "#RemoteWork", "#Solopreneur", "#ConsultingLife"],
    tech: ["#Tech", "#Technology", "#SoftwareDevelopment", "#Programming", "#BuildInPublic"],
    leadership: ["#Leadership", "#Management", "#TeamBuilding", "#FutureOfWork", "#ProfessionalDevelopment"],
    productivity: ["#Productivity", "#Mindset", "#GrowthMindset", "#PersonalDevelopment"],
    healthcare: ["#HealthTech", "#DigitalHealth", "#MedTech", "#HealthcareIT", "#HealthcareInnovation"],
  };

  const topicLower = topic.toLowerCase();
  let matched: string[] = [];

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
      "#Learning",
    ];
  }

  return [...new Set(matched)].slice(0, count);
}