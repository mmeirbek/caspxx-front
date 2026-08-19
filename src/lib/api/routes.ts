import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/client";
import type { RouteResponse } from "@/lib/api/types";

export interface CalculateRoutePayload {
  orderId?: string;
  startLat?: number;
  startLng?: number;
  endLat?: number;
  endLng?: number;
}

export function calculateRoute(
  accessToken: string,
  payload: CalculateRoutePayload,
): Promise<RouteResponse> {
  return apiRequest<RouteResponse>(API_ENDPOINTS.routes.calculate, {
    method: "POST",
    auth: accessToken,
    body: payload,
  });
}
