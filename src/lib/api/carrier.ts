import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/client";

export interface CarrierProfile {
  id: string;
  userId: string;
  experienceYears: number;
  transportType: string;
  description: string | null;
  isApproved: boolean;
  rating: number | null;
  completedOrders: number;
  webhookUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApplyCarrierPayload {
  experienceYears: number;
  transportType: string;
  description?: string;
}

export function getCarrierProfile(
  accessToken: string,
): Promise<{ carrierProfile: CarrierProfile }> {
  return apiRequest(API_ENDPOINTS.carrier.profile, {
    auth: accessToken,
    retryOnUnauthorized: false,
  });
}

export function applyCarrier(
  accessToken: string,
  payload: ApplyCarrierPayload,
): Promise<{ carrierProfile: CarrierProfile }> {
  return apiRequest(API_ENDPOINTS.carrier.apply, {
    method: "POST",
    auth: accessToken,
    body: payload,
  });
}
