import { Link, useNavigate } from "@tanstack/react-router";
import { MapTrifold as RouteIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/lib/auth/auth-provider";
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

  const userName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || (user?.email ?? "");

  async function handleLogout() {
    await logout();
    await navigate({ to: "/login" });
  }

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

      <nav className="flex min-w-0 flex-1 items-center gap-1" />

      <div className="ml-auto flex items-center gap-1">
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
