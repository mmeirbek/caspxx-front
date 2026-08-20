import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/client";
import type { RouteConditions } from "@/lib/api/types";

export function getRouteConditions(accessToken: string, orderId: string): Promise<RouteConditions> {
  return apiRequest<RouteConditions>(API_ENDPOINTS.routeConditions.forOrder(orderId), {
    auth: accessToken,
  });
}
