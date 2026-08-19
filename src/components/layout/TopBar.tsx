import { Link, useRouterState } from "@tanstack/react-router";
import {
  ChartBar,
  Lock,
  MapTrifold as MapIcon,
  ChatTeardropText,
  Path as RouteIcon,
  ClipboardText,
} from "@phosphor-icons/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { AlertIndicator } from "./AlertIndicator";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ReportModal } from "./ReportModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  labelKey: string;
  icon: typeof MapIcon;
  exact?: boolean;
};
const navItems: NavItem[] = [
  { to: "/", labelKey: "nav.home", icon: MapIcon, exact: true },
  { to: "/roads", labelKey: "nav.roads", icon: RouteIcon },
  { to: "/predictions", labelKey: "nav.predictions", icon: ClipboardText },
  { to: "/analytics", labelKey: "nav.analytics", icon: ChartBar },
];

export function TopBar() {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-card/95 px-2 backdrop-blur sm:gap-3 sm:px-3 md:px-5">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
            <RouteIcon className="h-4 w-4" aria-hidden />
          </div>
          <div className="hidden leading-tight md:block">
            <p className="text-sm font-semibold tracking-tight">{t("brand.name")}</p>
            <p className="text-[10px] text-muted-foreground">{t("brand.city")}</p>
          </div>
        </Link>

        <nav className="flex min-w-0 flex-1 items-center gap-1">
          {navItems.map((it) => {
            const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                aria-label={t(it.labelKey)}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                  "sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-sm",
                  active
                    ? "bg-primary/15 text-primary shadow-sm ring-1 ring-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span className="hidden md:inline">{t(it.labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Button
            size="sm"
            variant="default"
            className="hidden gap-1.5 md:inline-flex"
            onClick={() => setReportOpen(true)}
          >
            <ChatTeardropText className="h-4 w-4" />
            {t("nav.submit")}
          </Button>
          <Button
            size="icon"
            variant="default"
            className="md:hidden"
            onClick={() => setReportOpen(true)}
            aria-label={t("nav.submit")}
          >
            <ChatTeardropText className="h-4 w-4" />
          </Button>
          <AlertIndicator />
          <LanguageSwitcher />
          <Link
            to="/police"
            aria-label={t("police.entry")}
            className="ml-1 hidden rounded-md p-1.5 text-muted-foreground/60 transition-colors hover:text-foreground md:inline-flex"
          >
            <Lock className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </header>
      <ReportModal open={reportOpen} onOpenChange={setReportOpen} />
    </>
  );
}
