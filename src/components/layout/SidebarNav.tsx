import { Link } from "@tanstack/react-router";
import { MapTrifold as RouteIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

export function SidebarNav() {
  const { t } = useTranslation();

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

      <nav className="flex-1 space-y-1 px-3" />
    </aside>
  );
}
