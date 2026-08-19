import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/client";
import type { LandPrediction } from "@/lib/api/types";

export function predictLand(orderId: string): Promise<LandPrediction> {
  return apiRequest<LandPrediction>(API_ENDPOINTS.predictions.land, {
    method: "POST",
    body: { orderId },
  });
}
