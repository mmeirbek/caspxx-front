import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/client";
import type { AnalyticsEconomic, AnalyticsFlows, AnalyticsRegionalSummary } from "@/lib/api/types";

export function getAnalyticsFlows(accessToken: string, days?: number): Promise<AnalyticsFlows> {
  return apiRequest<AnalyticsFlows>(API_ENDPOINTS.analytics.flows, {
    auth: accessToken,
    query: days ? { days } : undefined,
  });
}

export function getAnalyticsRegionalSummary(
  accessToken: string,
): Promise<AnalyticsRegionalSummary> {
  return apiRequest<AnalyticsRegionalSummary>(API_ENDPOINTS.analytics.regionalSummary, {
    auth: accessToken,
  });
}

export function getAnalyticsEconomic(accessToken: string): Promise<AnalyticsEconomic> {
  return apiRequest<AnalyticsEconomic>(API_ENDPOINTS.analytics.economic, {
    auth: accessToken,
  });
}
