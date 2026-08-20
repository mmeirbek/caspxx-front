import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/client";
import type { LandPrediction, LandPredictionListResponse } from "@/lib/api/types";

export function predictLand(orderId: string): Promise<LandPrediction> {
  return apiRequest<LandPrediction>(API_ENDPOINTS.predictions.land, {
    method: "POST",
    body: { orderId },
  });
}

export function listPredictions(token: string): Promise<LandPredictionListResponse> {
  return apiRequest<LandPredictionListResponse>(API_ENDPOINTS.predictions.land, {
    auth: token,
  });
}
