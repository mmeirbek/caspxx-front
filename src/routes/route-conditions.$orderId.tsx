import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  MapPinLine,
  Thermometer,
  Wind,
  CloudRain,
  CloudSnow,
  Warning,
} from "@phosphor-icons/react";

import { requireAuth } from "@/lib/auth/guards";
import { getAccessToken } from "@/lib/auth/storage";
import { getRouteConditions } from "@/lib/api/route-conditions";
import type { RouteConditionWarning } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/route-conditions/$orderId")({
  beforeLoad: ({ context }) => requireAuth(context),
  component: RouteConditionsPage,
});

function severityClass(severity: RouteConditionWarning["severity"]): string {
  switch (severity) {
    case "critical":
      return "bg-red-100 text-red-700";
    case "warning":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-sky-100 text-sky-700";
  }
}

function WarningBadge({ warning }: { warning: RouteConditionWarning }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
      <Warning className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{warning.message}</p>
        <span
          className={cn(
            "mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase",
            severityClass(warning.severity),
          )}
        >
          {warning.severity}
        </span>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {icon}
          {label}
        </div>
        <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function RouteConditionsPage() {
  const { t } = useTranslation();
  const { orderId } = Route.useParams();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["route-conditions", orderId],
    queryFn: () => getRouteConditions(getAccessToken() ?? "", orderId),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (!data) return null;

  const c = data.conditions;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          to="/orders/$orderId"
          params={{ orderId }}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← {t("orders.title")}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{t("routeConditions.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {data.origin} → {data.destination}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<MapPinLine className="h-4 w-4" aria-hidden />}
          label={t("routeConditions.distance")}
          value={`${data.distanceKm.toFixed(1)} km`}
        />
        <StatCard
          icon={<MapPinLine className="h-4 w-4" aria-hidden />}
          label={t("routeConditions.duration")}
          value={`${Math.round(data.durationMinutes)} min`}
        />
        <StatCard
          icon={<MapPinLine className="h-4 w-4" aria-hidden />}
          label={t("routeConditions.eta")}
          value={`${Math.round(data.etaMinutes)} min`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("routeConditions.weather")}</CardTitle>
          <CardDescription>
            {data.weatherAvailable
              ? t("routeConditions.weatherAvailable")
              : t("routeConditions.weatherUnavailable")}
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          <div className="flex items-center justify-between py-2">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Thermometer className="h-4 w-4" aria-hidden />
              {t("routeConditions.temperature")}
            </span>
            <span className="text-sm font-medium tabular-nums">
              {c.minTemperature != null && c.maxTemperature != null
                ? `${c.minTemperature}°C … ${c.maxTemperature}°C`
                : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wind className="h-4 w-4" aria-hidden />
              {t("routeConditions.wind")}
            </span>
            <span className="text-sm font-medium tabular-nums">
              {c.maxWindMs != null ? `${c.maxWindMs} м/с` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <CloudRain className="h-4 w-4" aria-hidden />
              {t("routeConditions.rain")}
            </span>
            <span className="text-sm font-medium">{c.rain ? t("common.yes") : t("common.no")}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <CloudSnow className="h-4 w-4" aria-hidden />
              {t("routeConditions.snow")}
            </span>
            <span className="text-sm font-medium">{c.snow ? t("common.yes") : t("common.no")}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("routeConditions.warnings")}</CardTitle>
        </CardHeader>
        <CardContent>
          {data.warnings.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("routeConditions.noWarnings")}</p>
          ) : (
            <div className="space-y-2">
              {data.warnings.map((w, idx) => (
                <WarningBadge key={`${w.type}-${idx}`} warning={w} />
              ))}
            </div>
          )}
          {c.estimatedDelayMinutes > 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              {t("routeConditions.estimatedDelay", { minutes: c.estimatedDelayMinutes })}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("routeConditions.checkpoints")}</CardTitle>
        </CardHeader>
        <CardContent>
          {data.nearbyCheckpoints.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("routeConditions.noCheckpoints")}</p>
          ) : (
            <ul className="divide-y">
              {data.nearbyCheckpoints.map((cp) => (
                <li key={cp.name} className="flex items-center justify-between gap-4 py-2">
                  <span className="text-sm font-medium">{cp.name}</span>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {cp.loadPercent}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
