// Module-access token stored ONLY in sessionStorage.
// Never persists to localStorage, never logs the token.

const STORAGE_KEY = "jol.module-access.tokens.v1";
const MODULE_KEYS = ["data-management", "model-registry", "moderation", "history", "police"] as const;
export type AdminModuleKey = (typeof MODULE_KEYS)[number];

interface StoredToken {
  token: string;
  expiresAt: string;
}
type Store = Partial<Record<AdminModuleKey, StoredToken>>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Store;
  } catch {
    return {};
  }
}

function write(store: Store): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* quota exceeded — ignore */
  }
}

export function getModuleToken(module: AdminModuleKey): string | null {
  const store = read();
  const entry = store[module];
  if (!entry) return null;
  if (new Date(entry.expiresAt).getTime() <= Date.now()) {
    clearModuleToken(module);
    return null;
  }
  return entry.token;
}

export function setModuleToken(module: AdminModuleKey, token: string, expiresAt: string): void {
  const store = read();
  store[module] = { token, expiresAt };
  write(store);
}

export function clearModuleToken(module: AdminModuleKey): void {
  const store = read();
  delete store[module];
  write(store);
}

export function clearAllModuleTokens(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
}
