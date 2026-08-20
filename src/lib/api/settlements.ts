import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/client";
import type { Settlement, SettlementEnvelope, SettlementsListResponse } from "@/lib/api/types";

export function listSettlements(): Promise<SettlementsListResponse> {
  return apiRequest<SettlementsListResponse>(API_ENDPOINTS.settlements.list);
}

export function getSettlement(id: string): Promise<SettlementEnvelope> {
  return apiRequest<SettlementEnvelope>(API_ENDPOINTS.settlements.detail(id));
}

export type { Settlement };
