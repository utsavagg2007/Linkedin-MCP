import axios, { AxiosInstance } from "axios";
import { LinkedInPost, LinkedInProfile, PostCreationResult } from "./types.js";

export class LinkedInClient {
  private client: AxiosInstance;
  private accessToken: string;
  private personUrn: string;

  constructor(accessToken: string, personUrn: string) {
    this.accessToken = accessToken;
    this.personUrn = personUrn;

    this.client = axios.create({
      baseURL: "https://api.linkedin.com/v2",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": "202401",
      },
    });
  }

  async getProfile(): Promise<LinkedInProfile> {
    try {
      const response = await this.client.get("/userinfo");
      return {
        id: response.data.sub,
        firstName: response.data.given_name,
        lastName: response.data.family_name,
        headline: response.data.headline || "",
        vanityName: response.data.vanityName || response.data.sub,
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch profile: ${error.message}`);
    }
  }

  async createTextPost(
    text: string,
    visibility: "PUBLIC" | "CONNECTIONS" | "LOGGED_IN" = "PUBLIC"
  ): Promise<PostCreationResult> {
    try {
      const postBody: LinkedInPost = {
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
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async saveDraft(text: string): Promise<PostCreationResult> {
    try {
      const postBody: LinkedInPost = {
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
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }
}