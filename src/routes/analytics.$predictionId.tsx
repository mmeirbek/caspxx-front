import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Warning } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { LoadingState } from "@/components/shared/LoadingState";
import { RiskBadge, riskColorVar } from "@/components/shared/RiskBadge";
import { RiskScoreBar } from "@/components/shared/RiskScoreBar";
import { Card, CardContent } from "@/components/ui/card";
import { ApiError, apiRequest } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { PredictionExplanation, RiskPrediction } from "@/lib/api/types";
import type { SupportedLanguage } from "@/lib/i18n/config";
import { getFeatureDisplayName } from "@/lib/utils/feature-names";

export const Route = createFileRoute("/graph-analytics/$predictionId")({
  head: ({ params }) => ({
    meta: [
      { title: `Аналитика прогноза ${params.predictionId.slice(0, 8)} — Jol` },
      {
        name: "description",
        content: "Граф-аналитика прогноза риска: SHAP-факторы и влияние на решение модели.",
      },
    ],
  }),
  component: AnalyticsPage,
  errorComponent: AnalyticsError,
  notFoundComponent: AnalyticsNotFound,
});

function AnalyticsError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-3xl p-6">
      <ApiErrorAlert
        error={error}
        onRetry={() => {
          router.invalidate();
          reset();
        }}
      />
    </div>
  );
}

function AnalyticsNotFound() {
  const { predictionId } = Route.useParams();
  return (
    <div className="mx-auto max-w-3xl p-6">
      <p className="text-sm text-muted-foreground">Прогноз {predictionId} не найден.</p>
      <Button asChild variant="outline" className="mt-4">
        <Link to="/">На главную</Link>
      </Button>
    </div>
  );
}

import { Button } from "@/components/ui/button";

function AnalyticsPage() {
  const { predictionId } = Route.useParams();
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? "ru") as SupportedLanguage;

  const pred = useQuery({
    queryKey: ["prediction", predictionId],
    queryFn: async ({ signal }) => {
      try {
        return await apiRequest<RiskPrediction>(endpoints.predictions.detail(predictionId), {
          signal,
        });
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) throw notFound();
        throw err;
      }
    },
    staleTime: 120_000,
    gcTime: 600_000,
    retry: 2,
  });

  const expl = useQuery({
    enabled: !!pred.data,
    queryKey: ["prediction", predictionId, "explanation"],
    queryFn: ({ signal }) =>
      apiRequest<PredictionExplanation>(endpoints.predictions.explanation(predictionId), {
        signal,
      }),
    staleTime: 120_000,
    gcTime: 600_000,
    retry: 2,
  });

  const p = pred.data;

  const factors = (expl.data?.factors ?? [])
    .slice()
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  const chartData = factors.map((f) => ({
    name: getFeatureDisplayName(f.feature, lang, f.displayName),
    impact: f.direction === "INCREASES_RISK" ? f.impact : -f.impact,
    direction: f.direction,
    text: f.text,
  }));

  const maxAbsImpact = Math.max(...chartData.map((d) => Math.abs(d.impact)), 0.01);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 md:p-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-3 gap-1">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" /> На главную
          </Link>
        </Button>
      </div>

      {pred.isLoading && <LoadingState rows={6} />}
      {pred.isError && <ApiErrorAlert error={pred.error} onRetry={() => pred.refetch()} />}

      {p && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">{t("analytics.prediction.title")}</h1>
              <p className="text-xs text-muted-foreground">
                {p.algorithm ?? "ML"} · v{p.modelVersionId?.slice(0, 8) ?? "?"}
              </p>
            </div>
            <RiskBadge level={p.riskLevel} />
          </div>

          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-sm"
                  style={{ backgroundColor: riskColorVar(p.riskLevel) }}
                />
                <span className="text-sm font-semibold">{t(`risk.${p.riskLevel}`)}</span>
              </div>
              <RiskScoreBar level={p.riskLevel} score={p.score} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h2 className="mb-4 text-sm font-semibold">{t("analytics.prediction.factorChart")}</h2>
              {expl.isLoading && <LoadingState rows={4} />}
              {expl.isError && <ApiErrorAlert error={expl.error} onRetry={() => expl.refetch()} />}
              {expl.data && chartData.length > 0 && (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      layout="vertical"
                      margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
                      barSize={20}
                      barGap={4}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis
                        type="number"
                        domain={[-maxAbsImpact * 1.2, maxAbsImpact * 1.2]}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v: number) => Math.abs(v).toFixed(2)}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={140}
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        formatter={(value: number) => `${Math.abs(value).toFixed(3)}`}
                        labelFormatter={(label: string) => label}
                      />
                      <Bar dataKey="impact" minPointSize={3}>
                        {chartData.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={
                              entry.direction === "INCREASES_RISK"
                                ? riskColorVar("HIGH")
                                : riskColorVar("LOW")
                            }
                            fillOpacity={0.85}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {expl.data && chartData.length === 0 && (
                <p className="text-sm text-muted-foreground">{t("analytics.prediction.noFactors")}</p>
              )}
            </CardContent>
          </Card>

          {factors.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h2 className="mb-3 text-sm font-semibold">{t("prediction.factors")}</h2>
                <ul className="space-y-2">
                  {factors.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 rounded-md border p-3 text-sm">
                      <span
                        className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            f.direction === "INCREASES_RISK"
                              ? riskColorVar("HIGH")
                              : f.direction === "DECREASES_RISK"
                                ? riskColorVar("LOW")
                                : "var(--color-muted-foreground)",
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate font-medium">
                            {getFeatureDisplayName(f.feature, lang, f.displayName)}
                          </p>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {t(`prediction.factorDirection.${f.direction}`)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{f.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {p.warnings && p.warnings.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Warning className="h-4 w-4 text-amber-500" />
                  {t("analytics.prediction.warnings")}
                </h2>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {p.warnings.map((w, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      {w}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {expl.data && expl.data.limitations.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h2 className="mb-2 text-sm font-semibold">{t("prediction.limitations")}</h2>
                <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                  {expl.data.limitations.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
