import type { User } from "@/lib/api/types";
import type { RegisterPayload } from "@/lib/api/auth";

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
}

export interface RouterContext {
  queryClient: import("@tanstack/react-query").QueryClient;
  auth: AuthContextValue;
}
