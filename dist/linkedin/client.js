"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkedInClient = void 0;
const axios_1 = __importDefault(require("axios"));
class LinkedInClient {
    client;
    accessToken;
    personUrn;
    constructor(accessToken, personUrn) {
        this.accessToken = accessToken;
        this.personUrn = personUrn;
        this.client = axios_1.default.create({
            baseURL: "https://api.linkedin.com/v2",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0",
                "LinkedIn-Version": "202401",
            },
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
                vanityName: response.data.vanityName || response.data.sub,
            };
        }
        catch (error) {
            throw new Error(`Failed to fetch profile: ${error.message}`);
        }
    }
    async createTextPost(text, visibility = "PUBLIC") {
        try {
            const postBody = {
                author: `urn:li:person:${this.personUrn}`,
                commentary: text,
                visibility: visibility,
                distribution: {
                    feedDistribution: "MAIN_FEED",
                    thirdPartyDistributionChannels: [],
                },
                lifecycleState: "PUBLISHED",
            };
            const response = await this.client.post("/posts", postBody);
            const postUrn = response.headers["x-restli-id"] || response.data.id;
            return {
                success: true,
                postId: postUrn,
                postUrl: postUrn
                    ? `https://www.linkedin.com/feed/update/${postUrn}`
                    : undefined,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || error.message,
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
                    thirdPartyDistributionChannels: [],
                },
                lifecycleState: "DRAFT",
            };
            const response = await this.client.post("/posts", postBody);
            const postUrn = response.headers["x-restli-id"] || response.data.id;
            return { success: true, postId: postUrn };
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || error.message,
            };
        }
    }
}
exports.LinkedInClient = LinkedInClient;
//# sourceMappingURL=client.js.map