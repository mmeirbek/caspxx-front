import { Outlet, useRouterState } from "@tanstack/react-router";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Database,
  GitBranch,
  ClockCounterClockwise,
  ShieldCheck,
  Lock,
} from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useLockAdmin } from "@/features/module-access/hooks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — Jol" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isRoot = pathname === "/admin";
  const lock = useLockAdmin();

  const items = [
    { to: "/admin/data-management", labelKey: "admin.dataManagement", icon: Database },
    { to: "/admin/model-registry", labelKey: "admin.modelRegistry", icon: GitBranch },
    { to: "/admin/moderation", labelKey: "admin.moderation", icon: ShieldCheck },
    { to: "/admin/history", labelKey: "admin.history", icon: ClockCounterClockwise },
  ] as const;

  async function handleLock() {
    await lock.mutateAsync();
    toast.success("Admin-сессия закрыта");
    void navigate({ to: "/" });
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("nav.admin")}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {isRoot ? t("nav.admin") : ""}
          </h1>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleLock}
          disabled={lock.isPending}
          className="gap-2"
        >
          <Lock className="h-4 w-4" /> Закрыть admin-сессию
        </Button>
      </div>

      <nav className="flex flex-wrap gap-2 border-b pb-3">
        {items.map((it) => {
          const active = pathname.startsWith(it.to);
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors",
                active ? "border-primary bg-primary-soft text-primary" : "hover:bg-muted",
              )}
            >
              <Icon className="h-4 w-4" /> {t(it.labelKey)}
            </Link>
          );
        })}
      </nav>

      {isRoot ? (
        <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          {t("admin.passwordDescription")}
        </div>
      ) : (
        <Outlet />
      )}
    </div>
  );
}
