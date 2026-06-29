import { z } from "zod";
import { analyzePost as analyze } from "./postFormatter.js";

export const analyzePostSchema = z.object({
  content: z.string().describe("The LinkedIn post content to analyze"),
});

export type AnalyzePostInput = z.infer<typeof analyzePostSchema>;

export async function analyzePost(input: AnalyzePostInput): Promise<string> {
  const analysis = analyze(input.content);

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
    grade: score >= 80 ? "A — Excellent" : score >= 65 ? "B — Good" : score >= 50 ? "C — Average" : "D — Needs Work",
    metrics: {
      wordCount: analysis.wordCount,
      characterCount: analysis.characterCount,
      hashtagCount: analysis.hashtagCount,
      readabilityScore: analysis.readabilityScore,
      estimatedReadTime: analysis.estimatedReadTime,
    },
    improvements: analysis.suggestions,
    hook_alternatives: analysis.hooks,
    linkedin_character_limit: {
      current: analysis.characterCount,
      limit: 3000,
      status: analysis.characterCount <= 3000 ? "✅ Within limit" : "❌ Exceeds limit — trim your post",
    },
  }, null, 2);
}