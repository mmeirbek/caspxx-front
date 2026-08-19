import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/client";
import type { Order, User, UserRole } from "@/lib/api/types";

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
  carrierId: string;
  type: string;
  brand: string;
  model: string;
  year: number;
  plateNumber: string;
  capacityTons: number;
  cargoVolume: number;
  vehicleImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  carrierEmail: string | null;
  carrierFirstName: string | null;
  carrierLastName: string | null;
}

export function listSuperadminUsers(
  accessToken: string,
  query: Record<string, string | number | boolean | undefined> = {},
): Promise<{ users: SuperadminUser[]; meta: PaginationMeta }> {
  return apiRequest(API_ENDPOINTS.superadmin.users, {
    auth: accessToken,
    query: { ...query },
  });
}

export function createSuperadminUser(
  accessToken: string,
  payload: {
    email: string;
    password: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    phone: string;
  },
): Promise<{ user: SuperadminUser }> {
  return apiRequest<{ user: SuperadminUser }>(API_ENDPOINTS.superadmin.users, {
    method: "POST",
    auth: accessToken,
    body: payload,
  });
}

export function updateUserRole(
  accessToken: string,
  userId: string,
  role: UserRole,
): Promise<{ user: SuperadminUser }> {
  return apiRequest<{ user: SuperadminUser }>(API_ENDPOINTS.superadmin.userRole(userId), {
    method: "PATCH",
    auth: accessToken,
    body: { role },
  });
}

export function updateUserStatus(
  accessToken: string,
  userId: string,
  isActive: boolean,
): Promise<{ user: SuperadminUser }> {
  return apiRequest<{ user: SuperadminUser }>(API_ENDPOINTS.superadmin.userStatus(userId), {
    method: "PATCH",
    auth: accessToken,
    body: { isActive },
  });
}

export function resetUserPassword(
  accessToken: string,
  userId: string,
  password: string,
): Promise<{ user: SuperadminUser }> {
  return apiRequest<{ user: SuperadminUser }>(API_ENDPOINTS.superadmin.userPassword(userId), {
    method: "PATCH",
    auth: accessToken,
    body: { password },
  });
}

export function listSuperadminCarriers(
  accessToken: string,
  query: Record<string, string | number | boolean | undefined> = {},
): Promise<{ carriers: CarrierItem[]; meta: PaginationMeta }> {
  return apiRequest(API_ENDPOINTS.superadmin.carriers, {
    auth: accessToken,
    query: { ...query },
  });
}

export function setCarrierApproval(
  accessToken: string,
  carrierProfileId: string,
  isApproved: boolean,
): Promise<{ carrierProfile: CarrierItem }> {
  return apiRequest<{ carrierProfile: CarrierItem }>(
    API_ENDPOINTS.superadmin.carrierApproval(carrierProfileId),
    {
      method: "PATCH",
      auth: accessToken,
      body: { isApproved },
    },
  );
}

export function listSuperadminVehicles(
  accessToken: string,
  query: Record<string, string | number | boolean | undefined> = {},
): Promise<{ vehicles: SuperadminVehicle[]; meta: PaginationMeta }> {
  return apiRequest(API_ENDPOINTS.superadmin.vehicles, {
    auth: accessToken,
    query: { ...query },
  });
}

export function listSuperadminOrders(
  accessToken: string,
  query: Record<string, string | number | boolean | undefined> = {},
): Promise<{ orders: Order[]; meta: PaginationMeta }> {
  return apiRequest(API_ENDPOINTS.superadmin.orders, {
    auth: accessToken,
    query: { ...query },
  });
}

export function deleteSuperadminOrder(
  accessToken: string,
  orderId: string,
): Promise<{ order: Order }> {
  return apiRequest<{ order: Order }>(API_ENDPOINTS.superadmin.order(orderId), {
    method: "DELETE",
    auth: accessToken,
  });
}
