import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkle } from "@phosphor-icons/react";

import { requireAuth } from "@/lib/auth/guards";
import { useAuth } from "@/lib/auth/auth-provider";
import { getAccessToken } from "@/lib/auth/storage";
import { listMineOrders } from "@/lib/api/orders";
import { predictLand } from "@/lib/api/predictions";
import type { LandPrediction } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

function ResultCard({ prediction, lang }: { prediction: LandPrediction; lang: string }) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkle className="h-4 w-4 text-primary" aria-hidden />
          {t("predictions.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs font-medium text-muted-foreground">
              {t("predictions.recommendation")}
            </p>
            <p className="mt-1 text-sm font-medium capitalize">{prediction.recommendation}</p>
          </div>
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
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("predictions.riskLevel")}:</span>
          <Badge className={cn("font-medium", riskColor(prediction.riskLevel))}>
            {t(`predictions.risk.${prediction.riskLevel.toLowerCase()}`)}
          </Badge>
        </div>

        <div className="rounded-lg bg-muted/60 p-3 text-sm">
          <p className="text-xs font-medium text-muted-foreground">
            {t("predictions.explanation")}
          </p>
          <p className="mt-1">{prediction.shortExplanation}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function PredictionsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [orderId, setOrderId] = useState<string>("");

  const {
    data: ordersData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["predictions", "orders"],
    queryFn: () => listMineOrders(getAccessToken() ?? ""),
    enabled: !!user,
  });

  const mutation = useMutation({
    mutationFn: (id: string) => predictLand(id),
  });

  const orders = ordersData?.orders ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("predictions.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("predictions.subtitle")}</p>
      </div>

      <Card className="border-amber-300 bg-amber-50">
        <CardContent className="p-4 text-sm">{t("predictions.landOnly")}</CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-56 flex-1 space-y-2">
              <p className="text-sm font-medium">{t("predictions.order")}</p>
              <Select value={orderId} onValueChange={setOrderId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("predictions.selectOrder")} />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.title} · {o.origin} → {o.destination}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => orderId && mutation.mutate(orderId)}
              disabled={!orderId || mutation.isPending}
            >
              <Sparkle className="mr-1 h-4 w-4" aria-hidden />
              {t("predictions.calculate")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && <LoadingState />}
      {isError && <ErrorState onRetry={() => void refetch()} />}

      {mutation.isPending && <LoadingState />}
      {mutation.isError && <ErrorState onRetry={() => mutation.mutate(orderId)} />}
      {mutation.data && !mutation.isPending && (
        <ResultCard prediction={mutation.data} lang={i18n.resolvedLanguage ?? "ru"} />
      )}
      {!mutation.data && !mutation.isPending && (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            {t("predictions.noResult")}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">{t("predictions.disclaimer")}</p>
    </div>
  );
}
