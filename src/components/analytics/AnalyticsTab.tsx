import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GasPump, Clock, CurrencyKzt, RoadHorizon } from "@phosphor-icons/react";

import { getAccessToken } from "@/lib/auth/storage";
import {
  getAnalyticsEconomic,
  getAnalyticsFlows,
  getAnalyticsRegionalSummary,
} from "@/lib/api/analytics";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function EconRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

export function AnalyticsTab() {
  const { t } = useTranslation();
  const token = getAccessToken() ?? "";

  const summary = useQuery({
    queryKey: ["analytics", "regional-summary"],
    queryFn: () => getAnalyticsRegionalSummary(token),
  });
  const flows = useQuery({
    queryKey: ["analytics", "flows"],
    queryFn: () => getAnalyticsFlows(token),
  });
  const economic = useQuery({
    queryKey: ["analytics", "economic"],
    queryFn: () => getAnalyticsEconomic(token),
  });

  const loading = summary.isLoading || flows.isLoading || economic.isLoading;
  const error = summary.isError || flows.isError || economic.isError;

  if (loading) return <LoadingState />;
  if (error)
    return (
      <ErrorState
        onRetry={() => {
          void summary.refetch();
          void flows.refetch();
          void economic.refetch();
        }}
      />
    );
  if (!summary.data || !flows.data || !economic.data) return null;

  const topFlows = flows.data.flows.slice(0, 10).map((f) => ({
    name: `${f.origin} → ${f.destination}`,
    count: f.count,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {t("analytics.generatedAt", { at: new Date(summary.data.generatedAt).toLocaleString() })}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            void summary.refetch();
            void flows.refetch();
            void economic.refetch();
          }}
        >
          {t("common.refresh")}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label={t("analytics.totalOrders")} value={summary.data.totalOrders} />
        <KpiCard label={t("analytics.deliveredOrders")} value={summary.data.deliveredOrders} />
        <KpiCard label={t("analytics.activeTrips")} value={summary.data.activeTrips} />
        <KpiCard label={t("analytics.activeVehicles")} value={summary.data.activeVehicles} />
        <KpiCard
          label={t("analytics.totalKm")}
          value={summary.data.totalKm.toLocaleString("ru-RU")}
        />
        <KpiCard
          label={t("analytics.totalTelemetryReadings")}
          value={summary.data.totalTelemetryReadings.toLocaleString("ru-RU")}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("analytics.flows")}</CardTitle>
          <CardDescription>{t("analytics.flowsHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          {topFlows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("analytics.noData")}</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topFlows}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("analytics.economicTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <EconRow
            icon={<GasPump className="h-4 w-4" aria-hidden />}
            label={t("analytics.savedFuelLiters")}
            value={`${economic.data.savedFuelLiters.toLocaleString("ru-RU")} л`}
          />
          <EconRow
            icon={<CurrencyKzt className="h-4 w-4" aria-hidden />}
            label={t("analytics.savedMoneyTenge")}
            value={`${economic.data.savedMoneyTenge.toLocaleString("ru-RU")} ₸`}
          />
          <EconRow
            icon={<Clock className="h-4 w-4" aria-hidden />}
            label={t("analytics.savedHours")}
            value={`${economic.data.savedHours} ч`}
          />
          <EconRow
            icon={<RoadHorizon className="h-4 w-4" aria-hidden />}
            label={t("analytics.savedEmptyKm")}
            value={`${economic.data.savedEmptyKm.toLocaleString("ru-RU")} км`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
