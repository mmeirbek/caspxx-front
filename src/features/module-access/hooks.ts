import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest, ApiError } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { ModuleAccessToken } from "@/lib/api/types";

import {
  clearAllModuleTokens,
  clearModuleToken,
  getModuleToken,
  setModuleToken,
  type AdminModuleKey,
} from "./store";

export function useModuleAccessStatus(module: AdminModuleKey) {
  return useQuery({
    queryKey: ["module-access", "status", module],
    queryFn: async () => {
      const token = getModuleToken(module);
      if (!token) return { valid: false as const };
      try {
        await apiRequest<{ scope: string; expiresAt: string }>(endpoints.moduleAccess.status, {
          auth: token,
        });
        return { valid: true as const };
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          clearModuleToken(module);
        }
        return { valid: false as const };
      }
    },
    retry: false,
    staleTime: 30_000,
  });
}

const MODULE_SCOPE_MAP: Record<AdminModuleKey, string> = {
  "data-management": "DATA_MANAGEMENT",
  "model-registry": "MODEL_REGISTRY",
  moderation: "MODERATION",
  history: "DATA_MANAGEMENT",
  police: "POLICE",
};

export function useUnlockModule(module: AdminModuleKey) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (password: string) => {
      const data = await apiRequest<ModuleAccessToken>(endpoints.moduleAccess.unlock, {
        method: "POST",
        body: { scope: MODULE_SCOPE_MAP[module], password },
      });
      setModuleToken(module, data.accessToken, data.expiresAt);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["module-access", "status", module] });
    },
  });
}

export function useLockAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // Try to lock every active token server-side; ignore failures so local
      // teardown always happens.
      const modules: AdminModuleKey[] = [
        "data-management",
        "model-registry",
        "moderation",
        "history",
        "police",
      ];
      await Promise.allSettled(
        modules
          .map((m) => getModuleToken(m))
          .filter((t): t is string => !!t)
          .map((token) =>
            apiRequest(endpoints.moduleAccess.lock, {
              method: "POST",
              auth: token,
            }).catch(() => undefined),
          ),
      );
      clearAllModuleTokens();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["module-access"] });
    },
  });
}
