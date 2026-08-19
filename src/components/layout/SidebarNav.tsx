import { Link, useRouterState } from "@tanstack/react-router";
import {
  FileText,
  Fire,
  House,
  Lock,
  MapTrifold as MapIcon,
  ChatTeardropText,
  Path as RouteIcon,
} from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

const items = [
  { to: "/", labelKey: "nav.home", icon: House },
  { to: "/map", labelKey: "nav.map", icon: MapIcon },
  { to: "/roads", labelKey: "nav.roads", icon: RouteIcon },
  { to: "/hotspots", labelKey: "nav.hotspots", icon: Fire },
  { to: "/reports", labelKey: "nav.reports", icon: FileText },
  { to: "/submit", labelKey: "nav.submit", icon: ChatTeardropText },
] as const;

export function SidebarNav() {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden w-56 shrink-0 border-r bg-sidebar md:flex md:flex-col">
      <Link to="/" className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <RouteIcon className="h-5 w-5" aria-hidden />
        </div>
        <div className="leading-tight">
          <p className="text-base font-semibold tracking-tight">{t("brand.name")}</p>
          <p className="text-[11px] text-muted-foreground">{t("brand.city")}</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((it) => {
          const active = it.to === "/" ? pathname === "/" : pathname.startsWith(it.to);
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-primary-soft text-primary" : "text-sidebar-foreground hover:bg-muted",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {t(it.labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <Link
          to="/police"
          aria-label={t("police.entry")}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground/70 transition-colors hover:text-foreground"
        >
          <Lock className="h-3.5 w-3.5" aria-hidden />
          <span>·</span>
        </Link>
      </div>
    </aside>
  );
}
