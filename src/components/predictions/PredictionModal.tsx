import { useQuery } from "@tanstack/react-query";
import { Warning, Info, Lightbulb, ListChecks } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

import { FutureContextPanel } from "@/components/predictions/FutureContextPanel";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { LoadingState } from "@/components/shared/LoadingState";
import { RiskBadge, riskColorVar } from "@/components/shared/RiskBadge";
import { RiskScoreBar } from "@/components/shared/RiskScoreBar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { PredictionExplanation, RiskPrediction } from "@/lib/api/types";
import type { SupportedLanguage } from "@/lib/i18n/config";
import { formatDateTime } from "@/lib/utils/format";
import { getFeatureDisplayName } from "@/lib/utils/feature-names";
import { getLocalizedText } from "@/lib/utils/localized-text";

interface Props {
  predictionId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function PredictionModal({ predictionId, onOpenChange }: Props) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? "ru") as SupportedLanguage;
  const open = predictionId !== null;

  const pred = useQuery({
    enabled: open,
    queryKey: ["prediction", predictionId],
    queryFn: ({ signal }) =>
      apiRequest<RiskPrediction>(endpoints.predictions.detail(predictionId!), { signal }),
    retry: 1,
  });

  const expl = useQuery({
    enabled: open,
    queryKey: ["prediction", predictionId, "explanation"],
    queryFn: ({ signal }) =>
      apiRequest<PredictionExplanation>(endpoints.predictions.explanation(predictionId!), {
        signal,
      }),
    retry: 1,
  });

  const p = pred.data;
  const factors = (expl.data?.factors ?? [])
    .slice()
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  const increasing = factors.filter((f) => f.direction === "INCREASES_RISK").slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {t("prediction.title")}
            {p && <RiskBadge level={p.riskLevel} />}
          </DialogTitle>
          <DialogDescription>
            {p ? `${p.algorithm ?? "ML"} · v${p.modelVersionId?.slice(0, 8) ?? "?"} · ${formatDateTime(p.generatedAt, lang)}` : t("prediction.loading")}
          </DialogDescription>
        </DialogHeader>

        {pred.isLoading && <LoadingState rows={6} />}
        {pred.isError && <ApiErrorAlert error={pred.error} onRetry={() => pred.refetch()} />}

        {p && (
          <div className="space-y-5">

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
            </div>

            <FutureContextPanel futureContext={p.futureContext} />

            <section>
              <h3 className="mb-2 text-sm font-semibold">{t("prediction.factors")}</h3>
              {expl.isLoading && <LoadingState rows={3} />}
              {expl.isError && <ApiErrorAlert error={expl.error} onRetry={() => expl.refetch()} />}
              {expl.data && factors.length > 0 && (
                <ul className="space-y-2">
                  {factors.map((f, i) => (
                    <li key={f.feature} className="flex items-start gap-3 rounded-md border p-3 text-sm">
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
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <ListChecks className="h-4 w-4 text-primary" />
                  {t("prediction.recommendations")}
                </h3>
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
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  {t("prediction.recommendations")}
                </h3>
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
                <h3 className="mb-2 text-sm font-semibold">{t("prediction.limitations")}</h3>
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
          </div>
        )}
      </DialogContent>
    </Dialog>
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
