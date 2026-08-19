import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/client";
import type { TelemetryHistory, TelemetryRecord, TelemetryBucket } from "@/lib/api/types";

export interface TelemetryHistoryQuery {
  from?: string;
  to?: string;
  bucket?: TelemetryBucket;
}

export function lastTelemetryForDevice(
  accessToken: string,
  deviceId: string,
): Promise<{ telemetry: TelemetryRecord | null }> {
  return apiRequest(API_ENDPOINTS.telemetry.deviceLast(deviceId), { auth: accessToken });
}

export function telemetryHistoryForDevice(
  accessToken: string,
  deviceId: string,
  query: TelemetryHistoryQuery = {},
): Promise<TelemetryHistory> {
  return apiRequest(API_ENDPOINTS.telemetry.deviceHistory(deviceId), {
    auth: accessToken,
    query: { ...query },
  });
}

export function lastTelemetryForVehicle(
  accessToken: string,
  vehicleId: string,
): Promise<{ telemetry: TelemetryRecord | null }> {
  return apiRequest(API_ENDPOINTS.telemetry.vehicleLast(vehicleId), { auth: accessToken });
}

export function telemetryHistoryForVehicle(
  accessToken: string,
  vehicleId: string,
  query: TelemetryHistoryQuery = {},
): Promise<TelemetryHistory> {
  return apiRequest(API_ENDPOINTS.telemetry.vehicleHistory(vehicleId), {
    auth: accessToken,
    query: { ...query },
  });
}

export function liveTelemetryForOrder(
  accessToken: string,
  orderId: string,
  query: Record<string, string | number | undefined> = {},
): Promise<{ telemetry: TelemetryRecord | null }> {
  return apiRequest(API_ENDPOINTS.telemetry.orderLive(orderId), {
    auth: accessToken,
    query,
  });
}

export function telemetryHistoryForOrder(
  accessToken: string,
  orderId: string,
  query: TelemetryHistoryQuery = {},
): Promise<TelemetryHistory> {
  return apiRequest(API_ENDPOINTS.telemetry.orderHistory(orderId), {
    auth: accessToken,
    query: { ...query },
  });
}
