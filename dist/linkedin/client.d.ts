import { LinkedInProfile, PostCreationResult } from "./types.js";
export declare class LinkedInClient {
    private client;
    private accessToken;
    private personUrn;
    constructor(accessToken: string, personUrn: string);
    getProfile(): Promise<LinkedInProfile>;
    createTextPost(text: string, visibility?: "PUBLIC" | "CONNECTIONS" | "LOGGED_IN"): Promise<PostCreationResult>;
    saveDraft(text: string): Promise<PostCreationResult>;
}
//# sourceMappingURL=client.d.ts.map