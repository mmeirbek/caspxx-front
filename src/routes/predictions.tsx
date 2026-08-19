import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

import { FutureContextPanel } from "@/components/predictions/FutureContextPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { RiskBadge, riskColorVar } from "@/components/shared/RiskBadge";
import { RiskScoreBar } from "@/components/shared/RiskScoreBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequestPaginated } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { RiskPrediction } from "@/lib/api/types";
import type { SupportedLanguage } from "@/lib/i18n/config";
import { formatDateTime } from "@/lib/utils/format";

export const Route = createFileRoute("/predictions")({
  head: () => ({
    meta: [
      { title: "Прогнозы риска — Jol" },
      { name: "description", content: "Все прогнозы риска, сформированные ML-моделью." },
    ],
  }),
  component: PredictionsPage,
});

function PredictionsPage() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? "ru") as SupportedLanguage;

  const q = useQuery({
    queryKey: ["predictions", "list"],
    queryFn: ({ signal }) =>
      apiRequestPaginated<RiskPrediction>(endpoints.predictions.list, { signal }),
    retry: 1,
    staleTime: 60_000,
  });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6">
      <PageHeader title={t("predictions.title")} subtitle={t("predictions.subtitle")} />

      {q.isLoading && <LoadingState rows={6} />}
      {q.isError && <ApiErrorAlert error={q.error} onRetry={() => q.refetch()} />}
      {q.data && q.data.items.length === 0 && <EmptyState />}
      {q.data && q.data.items.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {t("predictions.total")}: {q.data.meta.total}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {q.data.items.map((p) => (
              <Card key={p.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-muted-foreground">
                      #{p.id.slice(0, 8)}
                    </p>
                    <RiskBadge level={p.riskLevel} />
                  </div>

                  <RiskScoreBar level={p.riskLevel} score={p.score} />

                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(p.forecastPeriod.startAt, lang)} →{" "}
                    {formatDateTime(p.forecastPeriod.endAt, lang)}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: riskColorVar(p.riskLevel) }}
                    />
                    {p.algorithm} · v{p.modelVersionId?.slice(0, 8) ?? "?"}
                  </div>

                  <FutureContextPanel futureContext={p.futureContext} />

                  <Button asChild variant="outline" size="sm" className="w-full gap-1">
                    <Link to="/predictions/$predictionId" params={{ predictionId: p.id }}>
                      {t("predictions.details")} <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {q.data.meta.pages > 1 && (
            <p className="text-center text-xs text-muted-foreground">
              {t("predictions.page")} {q.data.meta.page} / {q.data.meta.pages}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
