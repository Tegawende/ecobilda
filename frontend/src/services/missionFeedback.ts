import { convexClient, getSessionToken } from "@/lib/convexClient";
import { api } from "../../convex/_generated/api";
import type { MissionFeedback, HelperMissionPhoto, FeedbackResult } from "@/types";

export interface SubmitFeedbackData {
  missionId: string;
  totalCostEUR?: number;
  surfaceM2?: number;
  result?: FeedbackResult;
  difficultiesText?: string;
  learningsText?: string;
  photoIds?: string[];
  isPublic: boolean;
}

export const missionFeedbackService = {
  async getByMissionId(missionId: string): Promise<MissionFeedback | null> {
    const result = await convexClient.query(api.missionFeedback.getByMissionId, {
      missionId: missionId as any,
    });
    return result as any;
  },

  async submit(data: SubmitFeedbackData): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.missionFeedback.submit, {
      token,
      missionId: data.missionId as any,
      totalCostEUR: data.totalCostEUR,
      surfaceM2: data.surfaceM2,
      result: data.result,
      difficultiesText: data.difficultiesText,
      learningsText: data.learningsText,
      photoIds: data.photoIds as any,
      isPublic: data.isPublic,
    });
  },

  async setVisibility(feedbackId: string, isPublic: boolean): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.missionFeedback.setVisibility, {
      token,
      feedbackId: feedbackId as any,
      isPublic,
    });
  },

  async uploadFeedbackPhoto(file: File): Promise<string> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    const uploadUrl = await convexClient.mutation(api.missionFeedback.generateUploadUrl, { token });
    const uploadResult = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = await uploadResult.json();
    return storageId;
  },

  async submitHelperPhoto(
    missionId: string,
    file: File,
    isPublic: boolean,
    caption?: string
  ): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");

    const uploadUrl = await convexClient.mutation(api.missionFeedback.generateUploadUrl, { token });
    const uploadResult = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = await uploadResult.json();

    await convexClient.mutation(api.missionFeedback.submitHelperPhoto, {
      token,
      missionId: missionId as any,
      storageId,
      isPublic,
      caption,
    });
  },

  async setHelperPhotoVisibility(photoId: string, isPublic: boolean): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.missionFeedback.setHelperPhotoVisibility, {
      token,
      photoId: photoId as any,
      isPublic,
    });
  },

  async removeHelperPhoto(photoId: string): Promise<void> {
    const token = getSessionToken();
    if (!token) throw new Error("Not authenticated");
    await convexClient.mutation(api.missionFeedback.removeHelperPhoto, {
      token,
      photoId: photoId as any,
    });
  },

  async getHelperPhotos(missionId: string, publicOnly = false): Promise<HelperMissionPhoto[]> {
    const results = await convexClient.query(api.missionFeedback.getHelperPhotos, {
      missionId: missionId as any,
      publicOnly,
    });
    return results as any;
  },

  async getMyHelperPhotos(missionId: string): Promise<HelperMissionPhoto[]> {
    const token = getSessionToken();
    if (!token) return [];
    const results = await convexClient.query(api.missionFeedback.getMyHelperPhotos, {
      token,
      missionId: missionId as any,
    });
    return results as any;
  },
};
