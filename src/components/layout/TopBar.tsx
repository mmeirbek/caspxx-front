import { Link } from "@tanstack/react-router";
import { MapTrifold as RouteIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

import { LanguageSwitcher } from "./LanguageSwitcher";

export function TopBar() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-card/95 px-2 backdrop-blur sm:gap-3 sm:px-3 md:px-5">
      <Link to="/" className="flex shrink-0 items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
          <RouteIcon className="h-4 w-4" aria-hidden />
        </div>
        <div className="hidden leading-tight md:block">
          <p className="text-sm font-semibold tracking-tight">{t("brand.name")}</p>
          <p className="text-[10px] text-muted-foreground">{t("brand.tagline")}</p>
        </div>
      </Link>

      <nav className="flex min-w-0 flex-1 items-center gap-1" />

      <div className="ml-auto flex items-center gap-1">
        <LanguageSwitcher />
      </div>
    </header>
  );
}
