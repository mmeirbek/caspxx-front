import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarBlank,
  Car,
  CaretDown,
  CaretUp,
  Crosshair,
  Eye,
  MapPin,
  ShieldCheck,
  Warning,
} from "@phosphor-icons/react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { PageHeader } from "@/components/layout/PageHeader";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PoliceGate } from "@/features/module-access/PoliceGate";
import { getModuleToken } from "@/features/module-access/store";
import { apiRequest } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

export const Route = createFileRoute("/police")({
  head: () => ({
    meta: [
      { title: "Полиция — Jol" },
      { name: "description", content: "Ежедневный план патрулирования на основе ML-модели." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <PoliceGate>
      <PolicePage />
    </PoliceGate>
  ),
});

interface PatrolPlan {
  date: string;
  summary: string;
  hotspots: Array<{
    label: string;
    address: string;
    risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    recommendation: string;
  }>;
  stats: {
    totalHotspots: number;
    highPriority: number;
    patrolCarsRecommended: number;
  };
}

function PolicePage() {
  const { t } = useTranslation();
  const [showCarAllocation, setShowCarAllocation] = useState(false);

  const plan = useQuery({
    queryKey: ["police", "plan"],
    queryFn: ({ signal }) => {
      const token = getModuleToken("police");
      return apiRequest<PatrolPlan>(endpoints.police.plan, { auth: token, signal });
    },
    enabled: false,
    retry: 1,
  });

  const generate = useCallback(() => {
    void plan.refetch();
  }, [plan.refetch]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6">
      <PageHeader title={t("police.title")} subtitle={t("police.subtitle")} />

      <div className="flex justify-center">
        <Button size="lg" onClick={generate} disabled={plan.isFetching} className="gap-2 px-8">
          <ShieldCheck className="h-5 w-5" />
          {plan.isFetching ? t("police.generating") : t("police.generate")}
        </Button>
      </div>

      {plan.isFetching && <LoadingState rows={6} />}
      {plan.isError && (
        <ApiErrorAlert error={plan.error} onRetry={() => plan.refetch()} />
      )}
      {plan.data && plan.data.hotspots.length === 0 && (
        <EmptyState title={t("police.empty")} />
      )}

      {plan.data && plan.data.hotspots.length > 0 && (
        <>
          <div className="flex flex-wrap gap-4">
            <Card className="flex-1">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-risk-high/15 text-risk-high">
                  <Warning className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{plan.data.stats.highPriority}</p>
                  <p className="text-xs text-muted-foreground">{t("police.highPriority")}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{plan.data.stats.totalHotspots}</p>
                  <p className="text-xs text-muted-foreground">{t("police.totalHotspots")}</p>
                </div>
              </CardContent>
            </Card>
            <Card
              className="flex-1 cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => setShowCarAllocation(!showCarAllocation)}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-risk-low/15 text-risk-low">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold">{plan.data.stats.patrolCarsRecommended}</p>
                    {showCarAllocation ? <CaretUp className="h-4 w-4 text-muted-foreground" /> : <CaretDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{t("police.patrolCars")}</p>
                </div>
              </CardContent>
              {showCarAllocation && (
                <div className="border-t px-4 pb-4 pt-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">{t("police.carAllocation")}</p>
                  <div className="space-y-1.5">
                    {plan.data.hotspots.map((h, i) => (
                      <div key={i} className="flex items-center justify-between rounded bg-muted/50 px-2 py-1.5 text-xs">
                        <div className="flex items-center gap-1.5 truncate">
                          <Car className="h-3 w-3 shrink-0 text-muted-foreground" />
                          <span className="truncate">{h.label}</span>
                        </div>
                        <span className="shrink-0 font-medium">{h.recommendation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CalendarBlank className="h-4 w-4 text-muted-foreground" />
                {plan.data.date}
              </div>
              <p className="text-sm text-muted-foreground">{plan.data.summary}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan.data.hotspots.map((h, i) => (
                <div key={i} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{h.label}</p>
                      <p className="truncate text-xs text-muted-foreground">{h.address}</p>
                    </div>
                    <RiskBadge level={h.risk} />
                  </div>
                  <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{h.recommendation}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function RiskBadge({ level }: { level: PatrolPlan["hotspots"][number]["risk"] }) {
  const cls: Record<string, string> = {
    LOW: "bg-risk-low/15 text-risk-low",
    MEDIUM: "bg-risk-medium/15 text-risk-medium",
    HIGH: "bg-risk-high/15 text-risk-high",
    CRITICAL: "bg-destructive/15 text-destructive",
  };
  return (
    <span className={"flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold " + (cls[level] ?? "")}>
      <Crosshair className="h-3 w-3" />
      {level}
    </span>
  );
}