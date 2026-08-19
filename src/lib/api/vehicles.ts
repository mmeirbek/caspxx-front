import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/client";
import type { Vehicle } from "@/lib/api/types";

export interface CreateVehiclePayload {
  type: string;
  brand: string;
  model: string;
  year: number;
  plateNumber: string;
  capacityTons: number;
  cargoVolume: number;
  vehicleImageUrl?: string;
}

export function listVehicles(accessToken: string): Promise<{ vehicles: Vehicle[] }> {
  return apiRequest(API_ENDPOINTS.vehicles.list, { auth: accessToken });
}

export function createVehicle(
  accessToken: string,
  payload: CreateVehiclePayload,
): Promise<{ vehicle: Vehicle }> {
  return apiRequest<{ vehicle: Vehicle }>(API_ENDPOINTS.vehicles.create, {
    method: "POST",
    auth: accessToken,
    body: payload,
  });
}

export function updateVehicle(
  accessToken: string,
  vehicleId: string,
  payload: Partial<CreateVehiclePayload>,
): Promise<{ vehicle: Vehicle }> {
  return apiRequest<{ vehicle: Vehicle }>(API_ENDPOINTS.vehicles.update(vehicleId), {
    method: "PATCH",
    auth: accessToken,
    body: payload,
  });
}

export function deleteVehicle(
  accessToken: string,
  vehicleId: string,
): Promise<{ vehicle: Vehicle }> {
  return apiRequest<{ vehicle: Vehicle }>(API_ENDPOINTS.vehicles.delete(vehicleId), {
    method: "DELETE",
    auth: accessToken,
  });
}
