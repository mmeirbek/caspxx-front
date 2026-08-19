import { useQuery } from "@tanstack/react-query";
import { Bell } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequestPaginated } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { RiskAlert } from "@/lib/api/types";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { EmptyState } from "@/components/shared/EmptyState";

export function AlertIndicator() {
  const { t } = useTranslation();
  const alerts = useQuery({
    queryKey: ["risk-alerts", { status: "NEW" }],
    queryFn: ({ signal }) =>
      apiRequestPaginated<RiskAlert>(endpoints.risks.alerts, {
        query: { status: "NEW", limit: 10 },
        signal,
      }),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    retry: 1,
  });

  const items = alerts.data?.items ?? [];
  const count = items.length;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={t("alerts.title")}>
          <Bell className="h-5 w-5" aria-hidden />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-80 p-0">
        <DialogHeader className="border-b p-3">
          <DialogTitle className="text-sm font-semibold">{t("alerts.title")}</DialogTitle>
        </DialogHeader>
        <div className="max-h-80 overflow-y-auto p-2">
          {items.length === 0 ? (
            <EmptyState title={t("alerts.empty")} className="border-0" />
          ) : (
            <ul className="space-y-1">
              {items.map((a) => (
                <li key={a.id} className="rounded-md p-2 hover:bg-muted">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{a.title}</p>
                    <RiskBadge level={a.riskLevel} size="sm" />
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {a.description}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
