import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/client";
import type { CameraSnapshot } from "@/lib/api/types";

export function latestCameraForOrder(
  accessToken: string,
  orderId: string,
): Promise<{ snapshot: CameraSnapshot | null }> {
  return apiRequest(API_ENDPOINTS.cameras.orderLatest(orderId), { auth: accessToken });
}

export function latestCameraForDevice(
  accessToken: string,
  deviceId: string,
): Promise<{ snapshot: CameraSnapshot | null }> {
  return apiRequest(API_ENDPOINTS.cameras.deviceLatest(deviceId), { auth: accessToken });
}
