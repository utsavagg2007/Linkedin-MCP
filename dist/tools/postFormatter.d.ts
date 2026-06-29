import { PostTone, PostAnalysis } from "../linkedin/types.js";
export declare function formatPost(content: string, hashtags: string[], addLineBreaks?: boolean): string;
export declare function analyzePost(content: string): PostAnalysis;
export declare function generatePostTemplate(topic: string, tone: PostTone): string;
export declare function suggestHashtags(topic: string, count?: number): string[];
//# sourceMappingURL=postFormatter.d.ts.map