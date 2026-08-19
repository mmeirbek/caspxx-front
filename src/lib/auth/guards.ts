import { redirect } from "@tanstack/react-router";
import type { RouterContext } from "@/lib/auth/types";
import type { UserRole } from "@/lib/api/types";

export function requireAuth(context: RouterContext): void {
  if (!context.auth.isAuthenticated) {
    throw redirect({ to: "/login" });
  }
}

export function requireRole(context: RouterContext, roles: UserRole[]): void {
  requireAuth(context);
  const user = context.auth.user;
  if (!user || !roles.includes(user.role)) {
    throw redirect({ to: "/" });
  }
}
