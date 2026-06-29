"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHashtagsSchema = void 0;
exports.generateHashtags = generateHashtags;
const zod_1 = require("zod");
const postFormatter_js_1 = require("./postFormatter.js");
exports.generateHashtagsSchema = zod_1.z.object({
    topic: zod_1.z.string().describe("The topic or industry for the LinkedIn post"),
    count: zod_1.z.number().min(1).max(10).default(5).describe("Number of hashtags"),
    custom_keywords: zod_1.z.array(zod_1.z.string()).optional().describe("Additional keywords to include as hashtags"),
});
async function generateHashtags(input) {
    const hashtags = (0, postFormatter_js_1.suggestHashtags)(input.topic, input.count);
    if (input.custom_keywords && input.custom_keywords.length > 0) {
        const customTags = input.custom_keywords.map((kw) => kw.startsWith("#") ? kw : `#${kw.replace(/\s+/g, "")}`);
        const all = [...new Set([...hashtags, ...customTags])].slice(0, input.count + customTags.length);
        return JSON.stringify({ hashtags: all, formatted: all.join(" "), tip: "Use 3–5 hashtags per post for optimal reach." }, null, 2);
    }
    return JSON.stringify({
        hashtags,
        formatted: hashtags.join(" "),
        tip: "Use 3–5 hashtags per post for optimal reach.",
    }, null, 2);
}
//# sourceMappingURL=generateHashtags.js.map