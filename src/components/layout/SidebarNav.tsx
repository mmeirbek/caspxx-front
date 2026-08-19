import { Link } from "@tanstack/react-router";
import { MapTrifold as RouteIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/lib/auth/auth-provider";
import { cn } from "@/lib/utils";

const NAV_ITEMS = ["/", "/orders", "/map", "/devices", "/alerts", "/predictions"] as const;

export function SidebarNav() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  const labels: Record<string, string> = {
    "/": t("nav.dashboard"),
    "/orders": t("nav.orders"),
    "/map": t("nav.map"),
    "/devices": t("nav.devices"),
    "/alerts": t("nav.alerts"),
    "/predictions": t("nav.predictions"),
  };

  return (
    <aside className="hidden w-56 shrink-0 border-r bg-sidebar md:flex md:flex-col">
      <Link to="/" className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <RouteIcon className="h-5 w-5" aria-hidden />
        </div>
        <div className="leading-tight">
          <p className="text-base font-semibold tracking-tight">{t("brand.name")}</p>
          <p className="text-[11px] text-muted-foreground">{t("brand.tagline")}</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((path) => (
          <Link
            key={path}
            to={path}
            className={cn(
              "block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground",
            )}
          >
            {labels[path]}
          </Link>
        ))}
        {(user?.role === "SUPERADMIN" || user?.role === "ADMIN") && (
          <Link
            to="/admin"
            className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground"
          >
            {t("nav.admin")}
          </Link>
        )}
      </nav>
    </aside>
  );
}
