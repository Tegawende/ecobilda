import { convexClient, getSessionToken } from "@/lib/convexClient";
import { api } from "../../convex/_generated/api";
import type { Review } from '../types';

export interface CreateReviewData {
  receiver_id: number | string;
  rating: number;
  feedback: string;
}

export interface UpdateReviewResponseData {
  response: string;
}

export interface ReviewEligibility {
  eligible: boolean;
  reason?: string | null;
}

export const reviewsService = {
  async getUserReviews(userId: number | string): Promise<Review[]> {
    const results = await convexClient.query(api.reviews.getByUser, { userId: userId as any });
    return results as any;
  },

  async getMyReviews(): Promise<Review[]> {
    const token = getSessionToken();
    if (!token) return [];
    const results = await convexClient.query(api.reviews.getWrittenByUser, { token });
    return results as any;
  },

  async checkEligibility(userId: number | string): Promise<ReviewEligibility> {
    const token = getSessionToken();
    if (!token) return { eligible: false, reason: "Not authenticated" };
    return await convexClient.query(api.reviews.checkEligibility, {
      token,
      userId: userId as any,
    });
  },

  async createReview(data: CreateReviewData): Promise<Review> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    const id = await convexClient.mutation(api.reviews.create, {
      token,
      receiverId: data.receiver_id as any,
      rating: data.rating,
      feedback: data.feedback,
    });
    return { id } as any;
  },

  async updateReviewResponse(reviewId: number | string, data: UpdateReviewResponseData): Promise<Review> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.reviews.addResponse, {
      token,
      reviewId: reviewId as any,
      response: data.response,
    });
    return { id: reviewId } as any;
  },

  async deleteReview(reviewId: number | string): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.reviews.remove, {
      token,
      reviewId: reviewId as any,
    });
  },
};
