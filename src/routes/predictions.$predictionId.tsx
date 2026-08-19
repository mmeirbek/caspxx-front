import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter, notFound } from "@tanstack/react-router";
import { ArrowLeft, Info, Lightbulb, ListChecks, Warning } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

import { FutureContextPanel } from "@/components/predictions/FutureContextPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { LoadingState } from "@/components/shared/LoadingState";
import { RiskBadge, riskColorVar } from "@/components/shared/RiskBadge";
import { RiskScoreBar } from "@/components/shared/RiskScoreBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApiError, apiRequest } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { PredictionExplanation, RiskPrediction } from "@/lib/api/types";
import type { SupportedLanguage } from "@/lib/i18n/config";
import { formatDateTime } from "@/lib/utils/format";
import { getFeatureDisplayName } from "@/lib/utils/feature-names";
import { getLocalizedText } from "@/lib/utils/localized-text";

export const Route = createFileRoute("/predictions/$predictionId")({
  head: ({ params }) => ({
    meta: [
      { title: `Прогноз ${params.predictionId.slice(0, 8)} — Jol` },
      {
        name: "description",
        content: "Полное AI-объяснение прогноза риска: SHAP-факторы и ограничения модели.",
      },
    ],
  }),
  component: PredictionPage,
  errorComponent: PredictionError,
  notFoundComponent: PredictionNotFound,
});

function PredictionError({ error, reset }: { error: Error; reset: () => void }) {
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

function PredictionNotFound() {
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

function PredictionPage() {
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
  const increasing = factors.filter((f) => f.direction === "INCREASES_RISK").slice(0, 5);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 md:p-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-3 gap-1">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" /> На главную
          </Link>
        </Button>
        <PageHeader
          title={t("prediction.title")}
          subtitle={p ? `${p.algorithm ?? "ML"} · v${p.modelVersionId?.slice(0, 8) ?? "?"}` : undefined}
          actions={p ? <RiskBadge level={p.riskLevel} /> : undefined}
        />
      </div>

      {pred.isLoading && <LoadingState rows={6} />}
      {pred.isError && <ApiErrorAlert error={pred.error} onRetry={() => pred.refetch()} />}

      {p && (
        <Card>
          <CardContent className="space-y-5 p-5">

            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ backgroundColor: riskColorVar(p.riskLevel) }}
              />
              <span className="text-sm font-semibold">{t(`risk.${p.riskLevel}`)}</span>
            </div>
            <RiskScoreBar level={p.riskLevel} score={p.score} />
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{t("prediction.forecastPeriod")}:</span>{" "}
              {formatDateTime(p.forecastPeriod.startAt, lang)} →{" "}
              {formatDateTime(p.forecastPeriod.endAt, lang)}
              <span className="ml-2">
                · {t("prediction.generatedAt")}: {formatDateTime(p.generatedAt, lang)}
              </span>
            </div>

            <FutureContextPanel futureContext={p.futureContext} />

            <section>
              <h2 className="mb-2 text-sm font-semibold">{t("prediction.factors")}</h2>
              {expl.isLoading && <LoadingState rows={3} />}
              {expl.isError && <ApiErrorAlert error={expl.error} onRetry={() => expl.refetch()} />}
              {expl.data && factors.length > 0 && (
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
                          <p className="truncate font-medium">{getFeatureDisplayName(f.feature, lang, f.displayName)}</p>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {t(`prediction.factorDirection.${f.direction}`)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{f.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {p.possiblePlan && p.possiblePlan.length > 0 ? (
              <section>
                <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <ListChecks className="h-4 w-4 text-primary" />
                  {t("prediction.recommendations")}
                </h2>
                <ul className="space-y-1.5 rounded-md border bg-primary-soft/40 p-3 text-sm">
                  {p.possiblePlan.map((plan, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span className="text-muted-foreground">{getLocalizedText(plan, lang)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : increasing.length > 0 && (
              <section>
                <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  {t("prediction.recommendations")}
                </h2>
                <ul className="space-y-1.5 rounded-md border bg-primary-soft/40 p-3 text-sm">
                  {increasing.map((f, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>
                        <span className="font-medium">{getFeatureDisplayName(f.feature, lang, f.displayName)}:</span>{" "}
                        <span className="text-muted-foreground">{f.text}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {expl.data && expl.data.limitations.length > 0 && (
              <section>
                <h2 className="mb-2 text-sm font-semibold">{t("prediction.limitations")}</h2>
                <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                  {expl.data.limitations.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              </section>
            )}

            <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-xs text-destructive">
              <Warning className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{t("prediction.humanReview")}</span>
            </div>
            <div className="flex items-start gap-2 rounded-md bg-muted p-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{t("common.disclaimer")}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}
