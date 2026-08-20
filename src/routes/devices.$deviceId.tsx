import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { MapPin } from "@phosphor-icons/react";

import { requireAuth } from "@/lib/auth/guards";
import { getAccessToken } from "@/lib/auth/storage";
import { telemetryHistoryForDevice, lastTelemetryForDevice } from "@/lib/api/telemetry";
import type { RealtimeTelemetryEvent } from "@/lib/api/types";
import {
  connectRealtime,
  disconnectRealtime,
  subscribeRealtime,
  setRealtimeHandlers,
} from "@/lib/realtime/realtime";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/devices/$deviceId")({
  beforeLoad: ({ context }) => requireAuth(context),
  component: DeviceDetailPage,
});

function MetricCard({
  label,
  value,
  unit,
  live,
}: {
  label: string;
  value: string;
  unit?: string;
  live?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-semibold">
          {value}
          {unit && <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>}
        </p>
        {live && (
          <Badge variant="outline" className="mt-1 text-xs">
            LIVE
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

function DeviceDetailPage() {
  const { deviceId } = Route.useParams();
  const { t, i18n } = useTranslation();
  const [live, setLive] = useState<RealtimeTelemetryEvent | null>(null);
  const [isLive, setIsLive] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["devices", deviceId, "telemetry"],
    queryFn: async () => {
      const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [history, last] = await Promise.all([
        telemetryHistoryForDevice(getAccessToken() ?? "", deviceId, { from, bucket: "5m" }),
        lastTelemetryForDevice(getAccessToken() ?? "", deviceId),
      ]);
      return { history, last: last.telemetry };
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    connectRealtime(null);
    setRealtimeHandlers({
      onTelemetry: (event) => {
        if (event.deviceId === deviceId) {
          setLive(event);
          setIsLive(true);
        }
      },
    });
    subscribeRealtime({ type: "device", id: deviceId });
    return () => {
      disconnectRealtime();
      setLive(null);
      setIsLive(false);
    };
  }, [deviceId]);

  const latest = live ?? data?.last ?? null;

  const history = useMemo(() => {
    const base = data?.history?.points ?? [];
    const merged = live
      ? [
          ...base.filter((p) => p.time !== new Date(live.eventTime).toISOString().slice(0, 15)),
          {
            time: new Date(live.eventTime).toISOString(),
            count: 1,
            lat: live.lat,
            lng: live.lng,
            temperature:
              live.temperature != null
                ? { sum: live.temperature, count: 1, min: live.temperature, max: live.temperature }
                : null,
            speed:
              live.speedKmh != null
                ? { sum: live.speedKmh, count: 1, min: live.speedKmh, max: live.speedKmh }
                : null,
          },
        ]
      : base;
    return [...merged]
      .sort((a, b) => a.time.localeCompare(b.time))
      .slice(-60)
      .map((p) => ({
        time: new Date(p.time).toLocaleTimeString(i18n.resolvedLanguage, {
          hour: "2-digit",
          minute: "2-digit",
        }),
        temperature: p.temperature ? p.temperature.sum / p.temperature.count : null,
        speed: p.speed ? p.speed.sum / p.speed.count : null,
      }));
  }, [data, live, i18n.resolvedLanguage]);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (!data || (!latest && history.length === 0)) {
    return <EmptyState title={t("telemetry.noLiveData")} />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("devices.telemetry")}</h1>
          <p className="text-sm text-muted-foreground">{deviceId}</p>
        </div>
        {isLive && <Badge className="bg-emerald-500 text-white">LIVE</Badge>}
      </div>

      {latest && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            label={t("telemetry.temperature")}
            value={latest.temperature?.toFixed(1) ?? "—"}
            unit="°C"
            live={!!live}
          />
          <MetricCard
            label={t("telemetry.humidity")}
            value={latest.humidity?.toFixed(0) ?? "—"}
            unit="%"
            live={!!live}
          />
          <MetricCard
            label={t("telemetry.battery")}
            value={latest.battery?.toFixed(0) ?? "—"}
            unit="%"
            live={!!live}
          />
          <MetricCard
            label={t("telemetry.speed")}
            value={latest.speedKmh?.toFixed(0) ?? "—"}
            unit="km/h"
            live={!!live}
          />
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">{t("telemetry.title")}</p>
              <p className="mt-1 flex items-center gap-1 text-sm">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                {latest.lat.toFixed(5)}, {latest.lng.toFixed(5)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(latest.eventTime).toLocaleString(i18n.resolvedLanguage)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("telemetry.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <EmptyState title={t("telemetry.noLiveData")} />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    name={t("telemetry.temperature")}
                    stroke="#0ea5e9"
                    dot={false}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="speed"
                    name={t("telemetry.speed")}
                    stroke="#10b981"
                    dot={false}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Button variant="outline" onClick={() => void refetch()}>
        {t("common.retry")}
      </Button>
    </div>
  );
}
