import { setRefreshHandler } from "@/lib/api/client";
import {
  loginRequest,
  logoutRequest,
  meRequest,
  refreshRequest,
  registerRequest,
  type RegisterPayload,
} from "@/lib/api/auth";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getUser,
  saveSession,
} from "@/lib/auth/storage";
import type { User } from "@/lib/api/types";

let refreshPromise: Promise<string | null> | null = null;

function clearAndNotify(): void {
  clearSession();
  notifySessionCleared();
}

let onSessionCleared: (() => void) | null = null;

export function setSessionClearedHandler(handler: (() => void) | null): void {
  onSessionCleared = handler;
}

function notifySessionCleared(): void {
  onSessionCleared?.();
}

export async function login(email: string, password: string): Promise<User> {
  const res = await loginRequest(email, password);
  saveSession(res.accessToken, res.refreshToken, res.user);
  return res.user;
}

export async function register(payload: RegisterPayload): Promise<User> {
  const res = await registerRequest(payload);
  return res.user;
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      await logoutRequest(refreshToken);
    } catch {
      // ignore remote errors — clear locally regardless
    }
  }
  clearAndNotify();
}

async function doRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearAndNotify();
    return null;
  }
  try {
    const res = await refreshRequest(refreshToken);
    const user = getUser();
    if (!user) {
      clearAndNotify();
      return null;
    }
    saveSession(res.accessToken, res.refreshToken, user);
    return res.accessToken;
  } catch {
    clearAndNotify();
    return null;
  }
}

export function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function restoreSession(): Promise<User | null> {
  const accessToken = getAccessToken();
  const storedUser = getUser();
  if (!accessToken || !storedUser) {
    clearAndNotify();
    return null;
  }
  try {
    const res = await meRequest(accessToken);
    saveSession(accessToken, getRefreshToken() ?? "", res.user);
    return res.user;
  } catch {
    const newAccess = await refreshAccessToken();
    if (!newAccess) return null;
    try {
      const res = await meRequest(newAccess);
      saveSession(newAccess, getRefreshToken() ?? "", res.user);
      return res.user;
    } catch {
      clearAndNotify();
      return null;
    }
  }
}

export function initSessionRefresh(): void {
  setRefreshHandler(refreshAccessToken);
}
