import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/client";
import type { GeocodeResponse } from "@/lib/api/types";

export function geocodeSearch(q: string): Promise<GeocodeResponse> {
  return apiRequest<GeocodeResponse>(API_ENDPOINTS.geocode, {
    query: { q },
  });
}
