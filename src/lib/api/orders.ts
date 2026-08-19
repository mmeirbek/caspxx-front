import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/client";
import type { Order, OrderStatus } from "@/lib/api/types";

export interface CreateOrderPayload {
  title: string;
  cargoType: string;
  weight: number;
  volume: number;
  origin: string;
  originCity?: string;
  originCountry?: string;
  destination: string;
  destinationCity?: string;
  destinationCountry?: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  cargoPhotoUrl?: string;
  productPhotoUrls?: string[];
  comment?: string;
  estimatedPrice?: number;
  estimatedDeliveryTime?: number;
}

export type UpdateOrderPayload = Partial<CreateOrderPayload>;

export function listMineOrders(accessToken: string): Promise<{ orders: Order[] }> {
  return apiRequest<{ orders: Order[] }>(API_ENDPOINTS.orders.mine, {
    auth: accessToken,
  });
}

export function listAvailableOrders(accessToken: string): Promise<{ orders: Order[] }> {
  return apiRequest<{ orders: Order[] }>(API_ENDPOINTS.orders.available, {
    auth: accessToken,
  });
}

export function getOrder(accessToken: string, orderId: string): Promise<{ order: Order }> {
  return apiRequest<{ order: Order }>(API_ENDPOINTS.orders.detail(orderId), {
    auth: accessToken,
  });
}

export function createOrder(
  accessToken: string,
  payload: CreateOrderPayload,
): Promise<{ order: Order }> {
  return apiRequest<{ order: Order }>(API_ENDPOINTS.orders.create, {
    method: "POST",
    auth: accessToken,
    body: payload,
  });
}

export function updateOrder(
  accessToken: string,
  orderId: string,
  payload: UpdateOrderPayload,
): Promise<{ order: Order }> {
  return apiRequest<{ order: Order }>(API_ENDPOINTS.orders.update(orderId), {
    method: "PATCH",
    auth: accessToken,
    body: payload,
  });
}

export function updateOrderStatus(
  accessToken: string,
  orderId: string,
  status: OrderStatus,
): Promise<{ order: Order }> {
  return apiRequest<{ order: Order }>(API_ENDPOINTS.orders.updateStatus(orderId), {
    method: "PATCH",
    auth: accessToken,
    body: { status },
  });
}

export function assignOrder(accessToken: string, orderId: string): Promise<{ order: Order }> {
  return apiRequest<{ order: Order }>(API_ENDPOINTS.orders.assign(orderId), {
    method: "POST",
    auth: accessToken,
  });
}

export function deleteOrder(accessToken: string, orderId: string): Promise<{ order: Order }> {
  return apiRequest<{ order: Order }>(API_ENDPOINTS.orders.delete(orderId), {
    method: "DELETE",
    auth: accessToken,
  });
}
