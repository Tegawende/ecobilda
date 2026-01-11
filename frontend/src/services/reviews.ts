import api from './api';
import type { Review } from '../types';

export interface CreateReviewData {
  receiver_id: number;
  rating: number;
  feedback: string;
}

export interface UpdateReviewResponseData {
  response: string;
}

export interface ReviewEligibility {
  eligible: boolean;
  reason?: string;
  conversation_id?: number;
}

export const reviewsService = {
  // Get reviews received by a user
  async getUserReviews(userId: number): Promise<Review[]> {
    const response = await api.get(`/users/${userId}/reviews/`);
    return response.data.results || response.data;
  },

  // Get reviews written by current user
  async getMyReviews(): Promise<Review[]> {
    const response = await api.get('/reviews/written/');
    return response.data.results || response.data;
  },

  // Check if current user can review another user
  async checkEligibility(userId: number): Promise<ReviewEligibility> {
    const response = await api.get(`/reviews/eligibility/${userId}/`);
    return response.data;
  },

  // Create a new review
  async createReview(data: CreateReviewData): Promise<Review> {
    const response = await api.post('/reviews/', data);
    return response.data;
  },

  // Update review (only response, not rating/feedback)
  async updateReviewResponse(reviewId: number, data: UpdateReviewResponseData): Promise<Review> {
    const response = await api.patch(`/reviews/${reviewId}/`, data);
    return response.data;
  },

  // Delete a review (only if no response yet)
  async deleteReview(reviewId: number): Promise<void> {
    await api.delete(`/reviews/${reviewId}/`);
  },
};
