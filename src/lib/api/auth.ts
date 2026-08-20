import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/client";
import type { AuthTokensResponse, User, UserRole } from "@/lib/api/types";

export interface RegisterPayload {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone: string;
  companyName?: string;
  personalDataConsent: boolean;
  privacyPolicyConsent: boolean;
}

export interface RegisterResponse {
  user: User;
}

export function loginRequest(email: string, password: string): Promise<AuthTokensResponse> {
  return apiRequest<AuthTokensResponse>(API_ENDPOINTS.auth.login, {
    method: "POST",
    body: { email, password },
  });
}

export function registerRequest(payload: RegisterPayload): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>(API_ENDPOINTS.auth.register, {
    method: "POST",
    body: payload,
  });
}

export function refreshRequest(refreshToken: string): Promise<AuthTokensResponse> {
  return apiRequest<AuthTokensResponse>(API_ENDPOINTS.auth.refresh, {
    method: "POST",
    body: { refreshToken },
  });
}

export function logoutRequest(refreshToken: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(API_ENDPOINTS.auth.logout, {
    method: "POST",
    body: { refreshToken },
  });
}

export function meRequest(accessToken: string): Promise<{ user: User }> {
  return apiRequest<{ user: User }>(API_ENDPOINTS.auth.me, {
    auth: accessToken,
  });
}
