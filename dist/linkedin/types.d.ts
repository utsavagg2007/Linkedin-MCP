export interface LinkedInPost {
    author: string;
    commentary: string;
    visibility: PostVisibility;
    distribution?: Distribution;
    content?: PostContent;
    lifecycleState?: "PUBLISHED" | "DRAFT";
}
export type PostVisibility = "PUBLIC" | "CONNECTIONS" | "LOGGED_IN";
export interface Distribution {
    feedDistribution: "MAIN_FEED" | "NONE";
    targetEntities?: string[];
    thirdPartyDistributionChannels?: string[];
}
export interface PostContent {
    media?: MediaContent;
    article?: ArticleContent;
    multiImage?: MultiImageContent;
}
export interface MediaContent {
    id: string;
    title?: string;
}
export interface ArticleContent {
    source: string;
    title?: string;
    description?: string;
    thumbnail?: string;
}
export interface MultiImageContent {
    images: Array<{
        id: string;
        altText?: string;
    }>;
}
export interface PostDraft {
    id: string;
    content: string;
    hashtags: string[];
    tone: PostTone;
    topic: string;
    createdAt: Date;
    scheduledFor?: Date;
}
export type PostTone = "professional" | "casual" | "inspirational" | "educational" | "storytelling" | "promotional";
export interface PostAnalysis {
    wordCount: number;
    characterCount: number;
    hashtagCount: number;
    readabilityScore: "low" | "medium" | "high";
    estimatedReadTime: string;
    suggestions: string[];
    hooks: string[];
}
export interface LinkedInProfile {
    id: string;
    firstName: string;
    lastName: string;
    headline: string;
    vanityName: string;
}
export interface PostCreationResult {
    success: boolean;
    postId?: string;
    postUrl?: string;
    error?: string;
}
//# sourceMappingURL=types.d.ts.map