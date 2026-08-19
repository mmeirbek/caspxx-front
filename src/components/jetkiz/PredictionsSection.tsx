import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Sparkle } from "@phosphor-icons/react";
import { SectionLabel } from "./SectionLabel";
import { EmptyState } from "@/components/shared/EmptyState";
import { predictLand } from "@/lib/api/predictions";
import type { LandPrediction, Order } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const RISK_STYLES: Record<string, string> = {
  low: "bg-risk-low text-risk-low-foreground",
  medium: "bg-risk-medium text-risk-medium-foreground",
  high: "bg-risk-high text-risk-high-foreground",
};

function riskBadgeClass(risk: string): string {
  return RISK_STYLES[risk] ?? "bg-muted text-muted-foreground";
}

export function PredictionsSection({ orders }: { orders: Order[] }) {
  const { t } = useTranslation();
  const target = orders.filter((o) => o.originLat != null && o.destinationLat != null).slice(0, 3);
  const ids = target.map((o) => o.id).join(",");

  const { data, isFetching } = useQuery({
    queryKey: ["predictions", "auto", ids],
    queryFn: async () => {
      const results = await Promise.all(
        target.map(async (o) => {
          try {
            const p = await predictLand(o.id);
            return { order: o, prediction: p as LandPrediction, error: false };
          } catch {
            return { order: o, prediction: null, error: true };
          }
        }),
      );
      return results;
    },
    enabled: target.length > 0,
    staleTime: 10 * 60_000,
  });

  return (
    <section className="space-y-2 rounded-md border bg-background/60 p-2 sm:p-3">
      <SectionLabel icon={Sparkle} label={t("jetkiz.predictions.title")} tone="accent" />
      {target.length === 0 ? (
        <EmptyState title={t("jetkiz.predictions.empty")} />
      ) : isFetching && !data ? (
        <div className="space-y-2">
          {target.map((o) => (
            <div key={o.id} className="h-14 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {(data ?? []).map(({ order, prediction, error }) => (
            <div key={order.id} className="rounded-md border border-border/60 bg-background p-2">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-medium">{order.title}</p>
                {prediction && (
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      riskBadgeClass(prediction.riskLevel),
                    )}
                  >
                    {t(`predictions.risk.${prediction.riskLevel}`)}
                  </span>
                )}
              </div>
              {error ? (
                <p className="mt-1 text-[11px] text-destructive">{t("jetkiz.predictions.error")}</p>
              ) : prediction ? (
                <div className="mt-1 space-y-0.5">
                  <p className="text-[11px] text-muted-foreground">{prediction.shortExplanation}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {t("predictions.bestDeparture")}:{" "}
                    {new Date(prediction.bestDepartureTime).toLocaleTimeString("ru-RU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {prediction.expectedDelayMinutes > 0 &&
                      ` · ${t("predictions.expectedDelay")}: ${prediction.expectedDelayMinutes} ${t("common.minutes")}`}
                  </p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
