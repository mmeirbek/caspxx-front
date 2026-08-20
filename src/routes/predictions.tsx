import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  CloudRain,
  MapPin,
  Sparkle,
  Timer,
  Train,
  Warning,
  Wind,
} from "@phosphor-icons/react";

import { requireAuth } from "@/lib/auth/guards";
import { useAuth } from "@/lib/auth/auth-provider";
import { getAccessToken } from "@/lib/auth/storage";
import { listPredictions } from "@/lib/api/predictions";
import type { LandPrediction } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/predictions")({
  beforeLoad: ({ context }) => requireAuth(context),
  component: PredictionsPage,
});

function riskColor(risk: string): string {
  switch (risk) {
    case "high":
      return "bg-red-100 text-red-700";
    case "medium":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-emerald-100 text-emerald-700";
  }
}

function recColor(rec: string): string {
  switch (rec) {
    case "wait":
      return "bg-amber-100 text-amber-700";
    case "alternative":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-emerald-100 text-emerald-700";
  }
}

function PredictionCard({
  prediction,
  lang,
  onOpen,
}: {
  prediction: LandPrediction;
  lang: string;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Card
      className="cursor-pointer transition hover:border-primary/50 hover:shadow-sm"
      onClick={onOpen}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium">{prediction.title}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              {prediction.origin}
              <ArrowRight className="h-3 w-3" aria-hidden />
              {prediction.destination}
            </p>
          </div>
          <Sparkle className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge className={cn("font-medium", recColor(prediction.recommendation))}>
            {t(`predictions.rec.${prediction.recommendation}`)}
          </Badge>
          <Badge className={cn("font-medium", riskColor(prediction.riskLevel))}>
            {t(`predictions.risk.${prediction.riskLevel.toLowerCase()}`)}
          </Badge>
        </div>

        <div className="mt-3 space-y-1 text-sm">
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <Timer className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {t("predictions.bestDeparture")}:{" "}
            <span className="font-medium text-foreground">
              {new Date(prediction.bestDepartureTime).toLocaleString(lang)}
            </span>
          </p>
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <Warning className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {t("predictions.expectedDelay")}:{" "}
            <span className="font-medium text-foreground">
              {prediction.expectedDelayMinutes} {t("common.minutes")}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function PredictionModal({
  prediction,
  lang,
  onClose,
}: {
  prediction: LandPrediction | null;
  lang: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  if (!prediction) return null;

  const { data } = prediction;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkle className="h-4 w-4 text-primary" aria-hidden />
            {prediction.title}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {prediction.origin}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            {prediction.destination}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("font-medium", recColor(prediction.recommendation))}>
              {t(`predictions.rec.${prediction.recommendation}`)}
            </Badge>
            <Badge className={cn("font-medium", riskColor(prediction.riskLevel))}>
              {t(`predictions.risk.${prediction.riskLevel.toLowerCase()}`)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {t("predictions.source")}: {prediction.source === "ai" ? "AI" : "Engine"}
            </Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs font-medium text-muted-foreground">
                {t("predictions.bestDeparture")}
              </p>
              <p className="mt-1 text-sm font-medium">
                {new Date(prediction.bestDepartureTime).toLocaleString(lang)}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs font-medium text-muted-foreground">
                {t("predictions.expectedDelay")}
              </p>
              <p className="mt-1 text-sm font-medium">
                {prediction.expectedDelayMinutes} {t("common.minutes")}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs font-medium text-muted-foreground">{t("predictions.route")}</p>
              <p className="mt-1 text-sm font-medium">
                {data.route.distanceKm} км · {data.route.durationHours} ч
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-muted/60 p-3 text-sm">
            <p className="text-xs font-medium text-muted-foreground">
              {t("predictions.explanation")}
            </p>
            <p className="mt-1">{prediction.shortExplanation}</p>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold">{t("predictions.dataTitle")}</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <CloudRain className="h-4 w-4" aria-hidden /> {t("predictions.weather")}
                </span>
                <span className="font-medium">
                  {t("predictions.wind")}: {data.weather.wind} м/с ·{" "}
                  {data.weather.rain ? t("predictions.rain") : t("predictions.noRain")} ·{" "}
                  {t(`predictions.risk.${data.weather.risk}`)}
                </span>
              </div>

              <div className="rounded-md border">
                <div className="flex items-center gap-2 border-b px-3 py-2 text-muted-foreground">
                  <Warning className="h-4 w-4" aria-hidden />
                  {t("predictions.checkpoints")} ({data.checkpoints.length})
                </div>
                {data.checkpoints.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-muted-foreground">
                    {t("predictions.noCheckpoints")}
                  </p>
                ) : (
                  <ul className="divide-y">
                    {data.checkpoints.map((cp) => (
                      <li
                        key={cp.name}
                        className="flex items-center justify-between gap-2 px-3 py-2"
                      >
                        <span>{cp.name}</span>
                        <span className="font-medium tabular-nums">
                          {cp.load}% · {cp.wait} {t("common.minutes")}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-md border">
                <div className="flex items-center gap-2 border-b px-3 py-2 text-muted-foreground">
                  <Train className="h-4 w-4" aria-hidden />
                  {t("predictions.railway")} ({data.railway.length})
                </div>
                {data.railway.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-muted-foreground">
                    {t("predictions.noRailway")}
                  </p>
                ) : (
                  <ul className="divide-y">
                    {data.railway.map((rn) => (
                      <li
                        key={rn.station}
                        className="flex items-center justify-between gap-2 px-3 py-2"
                      >
                        <span>{rn.station}</span>
                        <span className="font-medium tabular-nums">{rn.load}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">{t("predictions.disclaimer")}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PredictionsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const lang = i18n.resolvedLanguage ?? "ru";
  const [selected, setSelected] = useState<LandPrediction | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["predictions", "list"],
    queryFn: () => listPredictions(getAccessToken() ?? ""),
    enabled: !!user,
  });

  const predictions = data?.predictions ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("predictions.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("predictions.subtitle")}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t("predictions.autoHint")} — {predictions.length}
        </p>
        <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isLoading}>
          {t("common.refresh")}
        </Button>
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState onRetry={() => void refetch()} />}
      {!isLoading && !isError && predictions.length === 0 && (
        <EmptyState title={t("predictions.noResult")} />
      )}
      {!isLoading && !isError && predictions.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {predictions.map((p) => (
            <PredictionCard
              key={p.orderId}
              prediction={p}
              lang={lang}
              onOpen={() => setSelected(p)}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">{t("predictions.disclaimer")}</p>

      <PredictionModal prediction={selected} lang={lang} onClose={() => setSelected(null)} />
    </div>
  );
}
