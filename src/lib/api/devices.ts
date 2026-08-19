import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/client";
import type { Device, DeviceWithSecret } from "@/lib/api/types";

export interface CreateDevicePayload {
  name: string;
  vehicleId?: string;
}

export interface BindDeviceVehiclePayload {
  vehicleId?: string | null;
}

export function listDevices(accessToken: string): Promise<{ devices: Device[] }> {
  return apiRequest(API_ENDPOINTS.devices.list, { auth: accessToken });
}

export function createDevice(
  accessToken: string,
  payload: CreateDevicePayload,
): Promise<DeviceWithSecret> {
  return apiRequest<DeviceWithSecret>(API_ENDPOINTS.devices.create, {
    method: "POST",
    auth: accessToken,
    body: payload,
  });
}

export function bindDeviceVehicle(
  accessToken: string,
  deviceId: string,
  payload: BindDeviceVehiclePayload,
): Promise<{ device: Device }> {
  return apiRequest<{ device: Device }>(API_ENDPOINTS.devices.attachVehicle(deviceId), {
    method: "PATCH",
    auth: accessToken,
    body: payload,
  });
}

export function rotateDeviceSecret(
  accessToken: string,
  deviceId: string,
): Promise<DeviceWithSecret> {
  return apiRequest<DeviceWithSecret>(API_ENDPOINTS.devices.rotateSecret(deviceId), {
    method: "POST",
    auth: accessToken,
  });
}

export function deleteDevice(accessToken: string, deviceId: string): Promise<{ device: Device }> {
  return apiRequest<{ device: Device }>(API_ENDPOINTS.devices.delete(deviceId), {
    method: "DELETE",
    auth: accessToken,
  });
}
