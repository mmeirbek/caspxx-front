import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { MapCanvas } from "@/components/map/MapCanvas";
import { PageHeader } from "@/components/layout/PageHeader";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { LoadingState } from "@/components/shared/LoadingState";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { RiskScoreBar } from "@/components/shared/RiskScoreBar";
import { Button } from "@/components/ui/button";
import { PredictionModal } from "@/components/predictions/PredictionModal";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { AppRoadResponse } from "@/lib/api/types";

export const Route = createFileRoute("/roads/$roadId")({
  head: ({ params }) => ({
    meta: [
      { title: `Дорога — Jol` },
      { name: "description", content: `Прогноз риска и статистика для дороги ${params.roadId}.` },
    ],
  }),
  component: RoadPage,
});

function RoadPage() {
  const { t } = useTranslation();
  const { roadId } = Route.useParams();

  const q = useQuery({
    queryKey: ["app", "road", roadId],
    queryFn: ({ signal }) => apiRequest<AppRoadResponse>(endpoints.app.road(roadId), { signal }),
    retry: 1,
  });

  if (q.isLoading)
    return (
      <div className="p-6">
        <LoadingState rows={8} />
      </div>
    );
  if (q.isError)
    return (
      <div className="p-6">
        <ApiErrorAlert error={q.error} onRetry={() => q.refetch()} />
      </div>
    );
  if (!q.data) return null;

  const { road, riskAreas, hotspots, statistics } = q.data;
  const top = riskAreas.find((a) => a.prediction)?.prediction ?? null;
  const statsData = [
    { label: t("hotspots.accidents"), value: statistics.accidentCount },
    {
      label: t("risk.score"),
      value:
        statistics.averageRiskScore === null
          ? "—"
          : `${Math.round(statistics.averageRiskScore * 100)}%`,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
      <nav className="text-xs text-muted-foreground">
        <Link to="/map" className="hover:text-foreground">
          {t("nav.map")}
        </Link>
        <span className="mx-1">/</span>
        <span>{road.name}</span>
      </nav>
      <PageHeader title={road.name} subtitle={t("brand.city")} />

      <Card className="overflow-hidden">
        <div className="h-72 w-full md:h-96">
          <MapCanvas
            riskAreas={riskAreas}
            hotspots={hotspots}
            liveEvents={[]}
            layers={{
              riskAreas: true,
              hotspots: true,
              liveEvents: true,
              heatmap: false,
            }}
          />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <h2 className="text-sm font-semibold">{t("prediction.title")}</h2>
            {top ? (
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-3">
                  <RiskBadge level={top.riskLevel} />
                  <span className="text-sm text-muted-foreground">
                    {t("risk.score")}: {(top.score * 100).toFixed(0)}%
                  </span>
                </div>
                <RiskScoreBar level={top.riskLevel} score={top.score} />
                {top.futureContext && top.futureContext.signals.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {top.futureContext.signals.map((s, i) => (
                      <span key={i} className="text-xs" title={s.title.ru ?? s.title.en}>
                        {s.flag === "severe_weather" ? "\u2601\uFE0F" :
                         s.flag === "heavy_traffic" ? "\uD83D\uDE97" :
                         s.flag === "road_repair" ? "\uD83D\uDD27" :
                         s.flag === "major_event" ? "\uD83C\uDFAA" : ""}
                      </span>
                    ))}
                  </div>
                )}
                <ReasonButton predictionId={top.id} label={t("map.reasonButton")} />
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">{t("dashboard.aiInsight.empty")}</p>
            )}
            <p className="mt-4 rounded-md bg-muted p-3 text-xs text-muted-foreground">
              {t("common.disclaimer")} {t("prediction.humanReview")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-semibold">{t("road.statistics")}</h2>
            <div className="mt-3 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ReasonButton({ predictionId, label }: { predictionId: string; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <PredictionModal
        predictionId={open ? predictionId : null}
        onOpenChange={(v: boolean) => setOpen(v)}
      />
    </>
  );
}
