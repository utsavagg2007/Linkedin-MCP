import { z } from "zod";
export declare const generateHashtagsSchema: z.ZodObject<{
    topic: z.ZodString;
    count: z.ZodDefault<z.ZodNumber>;
    custom_keywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    topic: string;
    count: number;
    custom_keywords?: string[] | undefined;
}, {
    topic: string;
    count?: number | undefined;
    custom_keywords?: string[] | undefined;
}>;
export type GenerateHashtagsInput = z.infer<typeof generateHashtagsSchema>;
export declare function generateHashtags(input: GenerateHashtagsInput): Promise<string>;
//# sourceMappingURL=generateHashtags.d.ts.map