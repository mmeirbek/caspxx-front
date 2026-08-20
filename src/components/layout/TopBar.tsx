import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, MapTrifold as RouteIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/lib/auth/auth-provider";
import { getAccessToken } from "@/lib/auth/storage";
import { listAlerts } from "@/lib/api/alerts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { AlertsDialog } from "@/components/alerts/AlertsDialog";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function TopBar() {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [alertsOpen, setAlertsOpen] = useState(false);

  const userName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || (user?.email ?? "");

  const { data: openAlerts } = useQuery({
    queryKey: ["alerts", "count"],
    queryFn: () => listAlerts(getAccessToken() ?? "", { status: "OPEN", take: 1 }),
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });

  async function handleLogout() {
    await logout();
    await navigate({ to: "/login" });
  }

  const isAdmin = user?.role === "SUPERADMIN" || user?.role === "ADMIN";

  const navItems = [
    { to: "/", label: t("nav.map"), icon: "MapTrifold", mobile: true },
    { to: "/orders", label: t("nav.orders"), icon: "Package", mobile: true },
    { to: "/devices", label: t("nav.devices"), icon: "DeviceMobile", mobile: true },
    { to: "/predictions", label: t("nav.predictions"), icon: "Sparkle", mobile: false },
  ];

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-card/95 px-2 backdrop-blur sm:gap-3 sm:px-3 md:px-5">
      <Link to={isAuthenticated ? "/" : "/login"} className="flex shrink-0 items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
          <RouteIcon className="h-4 w-4" aria-hidden />
        </div>
        <div className="hidden leading-tight md:block">
          <p className="text-sm font-semibold tracking-tight">{t("brand.name")}</p>
          <p className="text-[10px] text-muted-foreground">{t("brand.tagline")}</p>
        </div>
      </Link>

      {isAuthenticated && (
        <nav className="flex min-w-0 flex-1 items-center gap-1">
          {navItems.map((item) => (
            <Button
              key={item.to}
              asChild
              variant="ghost"
              size="sm"
              className={cn(
                "gap-1.5",
                !item.mobile && "hidden sm:inline-flex",
                isActive(item.to) && "bg-primary/15 text-primary shadow-sm ring-1 ring-primary/20",
              )}
            >
              <Link to={item.to}>{item.label}</Link>
            </Button>
          ))}
          {isAdmin && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={cn(
                "hidden lg:inline-flex gap-1.5",
                isActive("/admin") && "bg-primary/15 text-primary shadow-sm ring-1 ring-primary/20",
              )}
            >
              <Link to="/admin">{t("nav.admin")}</Link>
            </Button>
          )}
          {user?.role === "CARRIER" && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={cn(
                "hidden sm:inline-flex gap-1.5",
                isActive("/plan") && "bg-primary/15 text-primary shadow-sm ring-1 ring-primary/20",
              )}
            >
              <Link to="/plan">{t("nav.plan")}</Link>
            </Button>
          )}
        </nav>
      )}

      <div className="ml-auto flex items-center gap-1">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className={cn(
            "hidden sm:inline-flex gap-1.5",
            isActive("/settlements") &&
              "bg-primary/15 text-primary shadow-sm ring-1 ring-primary/20",
          )}
        >
          <Link to="/settlements">{t("nav.settlements")}</Link>
        </Button>
        {isAuthenticated && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label={t("alerts.title")}
              onClick={() => setAlertsOpen(true)}
            >
              <Bell className="h-4 w-4" aria-hidden />
              {(openAlerts?.total ?? 0) > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
                  {Math.min(openAlerts?.total ?? 0, 99)}
                </span>
              )}
            </Button>
            <AlertsDialog open={alertsOpen} onOpenChange={setAlertsOpen} />
          </>
        )}
        <LanguageSwitcher />
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-muted">
                <Avatar className="h-8 w-8">
                  {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={userName} /> : null}
                  <AvatarFallback>{initials(userName)}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{userName}</span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>{t("common.logout")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">{t("auth.login")}</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
