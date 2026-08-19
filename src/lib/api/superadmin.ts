import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/client";
import type { Order, User } from "@/lib/api/types";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface SuperadminUser extends User {
  carriersCount?: number;
  ordersCount?: number;
}

export interface CarrierItem {
  id: string;
  userId: string;
  experienceYears: number | null;
  transportType: string | null;
  description: string | null;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  user: User;
  vehiclesCount: number;
}

export interface SuperadminVehicle {
  id: string;
  carrierId: string | null;
  vehicleType: string | null;
  plateNumber: string | null;
  capacityTons: number | null;
  volumeM3: number | null;
  createdAt: string;
  updatedAt: string;
}

export function listSuperadminUsers(
  accessToken: string,
  query: Record<string, string | number | undefined> = {},
): Promise<{ users: SuperadminUser[]; meta: PaginationMeta }> {
  return apiRequest(API_ENDPOINTS.superadmin.users, {
    auth: accessToken,
    query,
  });
}

export function listSuperadminCarriers(
  accessToken: string,
  query: Record<string, string | number | undefined> = {},
): Promise<{ carriers: CarrierItem[]; meta: PaginationMeta }> {
  return apiRequest(API_ENDPOINTS.superadmin.carriers, {
    auth: accessToken,
    query,
  });
}

export function listSuperadminVehicles(
  accessToken: string,
  query: Record<string, string | number | undefined> = {},
): Promise<{ vehicles: SuperadminVehicle[]; meta: PaginationMeta }> {
  return apiRequest(API_ENDPOINTS.superadmin.vehicles, {
    auth: accessToken,
    query,
  });
}

export function listSuperadminOrders(
  accessToken: string,
  query: Record<string, string | number | undefined> = {},
): Promise<{ orders: Order[]; meta: PaginationMeta }> {
  return apiRequest(API_ENDPOINTS.superadmin.orders, {
    auth: accessToken,
    query,
  });
}
