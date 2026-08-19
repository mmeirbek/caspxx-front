import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/client";
import type { Order, UploadResult } from "@/lib/api/types";

export interface OrderMediaUpload extends UploadResult {
  order: Order;
}

export function uploadAvatar(accessToken: string, file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest(API_ENDPOINTS.uploads.avatar, {
    method: "POST",
    auth: accessToken,
    formData,
  });
}

export function uploadCargoPhoto(
  accessToken: string,
  orderId: string,
  file: File,
): Promise<OrderMediaUpload> {
  const formData = new FormData();
  formData.append("orderId", orderId);
  formData.append("file", file);
  return apiRequest(API_ENDPOINTS.uploads.cargo, {
    method: "POST",
    auth: accessToken,
    formData,
  });
}

export function uploadProductPhoto(
  accessToken: string,
  orderId: string,
  file: File,
): Promise<OrderMediaUpload> {
  const formData = new FormData();
  formData.append("orderId", orderId);
  formData.append("file", file);
  return apiRequest(API_ENDPOINTS.uploads.product, {
    method: "POST",
    auth: accessToken,
    formData,
  });
}
