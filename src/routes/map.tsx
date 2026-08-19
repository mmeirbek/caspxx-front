import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { ChartBar, Crosshair, MagnifyingGlass, X } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { toast } from "sonner";
import { z } from "zod";

import { MapCanvas } from "@/components/map/MapCanvas";
import { MapLayerControl } from "@/components/map/MapLayerControl";
import { MapLegend } from "@/components/map/MapLegend";
import type { MapLayerVisibility, SelectedFeature } from "@/components/map/MapView";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { EmptyState } from "@/components/shared/EmptyState";
import { RiskBadge, riskColorVar } from "@/components/shared/RiskBadge";
import { RiskScoreBar } from "@/components/shared/RiskScoreBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { AppMapResponse } from "@/lib/api/types";
import { geocodeAstana, type GeocodeResult } from "@/lib/geocoding/nominatim";
import { formatDateTime } from "@/lib/utils/format";
import type { SupportedLanguage } from "@/lib/i18n/config";
import { getFeatureDisplayName } from "@/lib/utils/feature-names";
import { useIsMobile } from "@/hooks/use-mobile";

const mapSearchSchema = z.object({
  risk: fallback(z.boolean(), true).default(true),
  hot: fallback(z.boolean(), false).default(false),
  live: fallback(z.boolean(), false).default(false),
  heat: fallback(z.boolean(), false).default(false),
});

export const Route = createFileRoute("/map")({
  validateSearch: zodValidator(mapSearchSchema),
  head: () => ({
    meta: [
      { title: "Карта риска — Jol" },
      {
        name: "description",
        content: "Интерактивная карта риска Астаны: зоны, hotspots, подтверждённые события.",
      },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? "ru") as SupportedLanguage;
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/map" });

  const layers: MapLayerVisibility = useMemo(
    () => ({
      riskAreas: search.risk,
      hotspots: search.hot,
      liveEvents: search.live,
      heatmap: search.heat,
    }),
    [search.risk, search.hot, search.live, search.heat],
  );

  const setLayers = useCallback(
    (v: MapLayerVisibility) => {
      navigate({
        search: {
          risk: v.riskAreas,
          hot: v.hotspots,
          live: v.liveEvents,
          heat: v.heatmap,
        },
        replace: true,
      });
    },
    [navigate],
  );

  const [selected, setSelected] = useState<SelectedFeature | null>(null);
  const [locateTrigger, setLocateTrigger] = useState(0);
  const [center, setCenter] = useState<[number, number] | undefined>(undefined);
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const mapQuery = useQuery({
    queryKey: ["app", "map"],
    queryFn: ({ signal }) =>
      apiRequest<AppMapResponse>(endpoints.app.map, {
        signal,
        query: {
          showRiskAreas: true,
          showHotspots: true,
          showLiveEvents: true,
          showHeatmap: true,
        },
      }),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 2,
  });

  const isMobile = useIsMobile();
  const autoLocatedRef = useRef(false);
  useEffect(() => {
    if (!isMobile || autoLocatedRef.current) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    autoLocatedRef.current = true;
    setLocateTrigger((n) => n + 1);
  }, [isMobile]);

  // Debounced geocoding
  useEffect(() => {
    if (searchText.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const handle = window.setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const results = await geocodeAstana(searchText, ac.signal);
        setSuggestions(results);
      } catch {
        /* aborted or offline */
      }
    }, 350);
    return () => window.clearTimeout(handle);
  }, [searchText]);

  const selectedDetails = useMemo(() => {
    if (!selected || !mapQuery.data) return null;
    if (selected.kind === "riskArea") {
      return mapQuery.data.riskAreas.find((a) => a.id === selected.id) ?? null;
    }
    if (selected.kind === "hotspot") {
      return mapQuery.data.hotspots.find((h) => h.id === selected.id) ?? null;
    }
    return mapQuery.data.liveConfirmedEvents.find((e) => e.id === selected.id) ?? null;
  }, [selected, mapQuery.data]);

  function requestLocation() {
    if (!navigator.geolocation) {
      toast.error(t("map.myLocationDenied"));
      return;
    }
    setLocateTrigger((n) => n + 1);
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem-4rem)] md:h-[calc(100vh-3.5rem)] min-w-0">
      {/* Sidebar filters / details */}
      <aside className="hidden w-80 shrink-0 flex-col border-r bg-card lg:flex">
        <div className="border-b p-4">
          <h1 className="text-lg font-semibold">{t("map.title")}</h1>
          <p className="text-xs text-muted-foreground">
            {mapQuery.data?.context.generatedAt
              ? `${t("map.lastUpdate")}: ${formatDateTime(mapQuery.data.context.generatedAt, lang)}`
              : t("common.loading")}
          </p>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <SelectedPanel
            details={selectedDetails}
            kind={selected?.kind}
            onClear={() => setSelected(null)}
          />
        </div>
      </aside>

      {/* Map area */}
      <div className="relative min-w-0 flex-1">
        {mapQuery.isError && (
          <div className="absolute inset-4 z-[400]">
            <ApiErrorAlert
              error={mapQuery.error}
              onRetry={() => mapQuery.refetch()}
              className="bg-card"
            />
          </div>
        )}

        <MapCanvas
          riskAreas={mapQuery.data?.riskAreas}
          hotspots={mapQuery.data?.hotspots}
          liveEvents={mapQuery.data?.liveConfirmedEvents}
          heatmapData={mapQuery.data?.heatmapData}
          layers={layers}
          onSelect={setSelected}
          requestLocation={locateTrigger}
          onLocationFound={(lat, lon) => setCenter([lat, lon])}
          center={center}
        />

        {/* Search & controls overlay */}
        <div className="pointer-events-none absolute inset-x-0 top-3 z-[400] flex justify-center px-3">
          <div className="pointer-events-auto flex w-full max-w-xl items-center gap-2">
            <div className="relative flex-1">
              <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder={t("map.searchPlaceholder")}
                className="h-10 pl-9 shadow-sm"
                aria-label={t("map.searchPlaceholder")}
              />
              {suggestions.length > 0 && (
                <div className="absolute inset-x-0 top-11 max-h-64 overflow-y-auto rounded-md border bg-popover p-1 shadow-lg">
                  {suggestions.map((s) => (
                    <button
                      key={`${s.lat}-${s.lon}`}
                      type="button"
                      className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                      onClick={() => {
                        setCenter([s.lat, s.lon]);
                        setSearchText("");
                        setSuggestions([]);
                      }}
                    >
                      {s.displayName}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              size="icon"
              variant="secondary"
              className="hidden h-10 w-10 shadow-sm md:inline-flex"
              onClick={requestLocation}
              aria-label={t("map.myLocation")}
            >
              <Crosshair className="h-4 w-4" />
            </Button>
            <MapLayerControl value={layers} onChange={setLayers} />
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-3 left-3 z-[400]">
          <MapLegend />
        </div>

        {/* Mobile bottom panel with details */}
        {selected && (
          <div className="pointer-events-auto absolute inset-x-3 bottom-3 z-[400] lg:hidden">
            <Card>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold">{t("map.details")}</p>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setSelected(null)}
                    aria-label={t("common.close")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <SelectedPanel
                  details={selectedDetails}
                  kind={selected.kind}
                  onClear={() => setSelected(null)}
                  compact
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

interface SelectedPanelProps {
  details: unknown;
  kind: SelectedFeature["kind"] | undefined;
  onClear: () => void;
  compact?: boolean;
}

function SelectedPanel({ details, kind, compact }: SelectedPanelProps) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? "ru") as SupportedLanguage;
  if (!details || !kind) {
    return <EmptyState title={t("map.selectHint")} className="border-0" />;
  }
  if (kind === "riskArea") {
    const area = details as import("@/lib/api/types").RiskAreaWithPrediction;
    const p = area.prediction;
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Risk area</p>
          {p && <RiskBadge level={p.riskLevel} />}
        </div>
        {p && (
          <>
            <div>
              <p className="text-xs text-muted-foreground">{t("risk.score")}</p>
              <RiskScoreBar level={p.riskLevel} score={p.score} className="mt-1" />
            </div>
            {p.futureContext && p.futureContext.signals.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {p.futureContext.signals.map((s, i) => (
                  <span key={i} className="text-xs" title={s.title.ru ?? s.title.en}>
                    {s.flag === "severe_weather" ? "\u2601\uFE0F" :
                     s.flag === "heavy_traffic" ? "\uD83D\uDE97" :
                     s.flag === "road_repair" ? "\uD83D\uDD27" :
                     s.flag === "major_event" ? "\uD83C\uDFAA" : ""}
                  </span>
                ))}
              </div>
            )}
            <ExplanationPreview predictionId={p.id} riskLevel={p.riskLevel} />
          </>
        )}
      </div>
    );
  }
  if (kind === "hotspot") {
    const h = details as import("@/lib/api/types").Hotspot;
    return (
      <div className="space-y-2 text-sm">
        <p className="font-semibold">Hotspot</p>
        <p>
          {t("hotspots.accidents")}: <b>{h.accidentCount}</b>
        </p>
        <p>
          {t("hotspots.density")}: <b>{h.density.toFixed(2)}</b>
        </p>
        <p>
          {t("hotspots.algorithm")}: <b>{h.algorithm}</b>
        </p>
      </div>
    );
  }
  const ev = details as import("@/lib/api/types").LiveConfirmedEvent;
  return (
    <div className="space-y-2 text-sm">
      <p className="font-semibold">{ev.title}</p>
      {ev.description && <p className="text-muted-foreground">{ev.description}</p>}
      <p className="text-xs text-muted-foreground">{formatDateTime(ev.confirmedAt, lang)}</p>
    </div>
  );
}

function ExplanationPreview({ predictionId, riskLevel }: { predictionId: string; riskLevel: string }) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? "ru") as SupportedLanguage;
  const isMobile = useIsMobile();
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  const expl = useQuery({
    queryKey: ["prediction", predictionId, "explanation"],
    queryFn: ({ signal }) =>
      apiRequest<import("@/lib/api/types").PredictionExplanation>(
        endpoints.predictions.explanation(predictionId),
        { signal },
      ),
    retry: 1,
  });

  const allFactors = (expl.data?.factors ?? [])
    .slice()
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  const topFactors = allFactors.slice(0, 3);

  const chartData = allFactors.map((f) => ({
    name: getFeatureDisplayName(f.feature, lang, f.displayName),
    impact: f.direction === "INCREASES_RISK" ? f.impact : -f.impact,
    direction: f.direction,
  }));
  const maxAbsImpact = Math.max(...chartData.map((d) => Math.abs(d.impact)), 0.01);

  return (
    <div className="space-y-2">
      {expl.isLoading && <p className="text-xs text-muted-foreground animate-pulse">Загрузка факторов...</p>}
      {expl.isError && (
        <p className="text-xs text-destructive">{t("common.error")}</p>
      )}
      {topFactors.length > 0 && (
        <div className="space-y-1.5 rounded-md border bg-muted/30 p-2">
          <p className="text-xs font-medium flex items-center gap-1">
            <ChartBar className="h-3 w-3" />
            {t("analytics.prediction.topFactors")}
          </p>
          <ul className="space-y-1">
            {topFactors.map((f, i) => (
              <li key={i} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-muted-foreground">
                  {getFeatureDisplayName(f.feature, lang, f.displayName)}
                </span>
                <span
                  className="shrink-0 font-medium"
                  style={{
                    color:
                      f.direction === "INCREASES_RISK"
                        ? riskColorVar("HIGH")
                        : riskColorVar("LOW"),
                  }}
                >
                  {f.direction === "INCREASES_RISK" ? "+" : "-"}{f.impact.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {riskLevel !== "LOW" && !isMobile && (
        <Button asChild size="sm" variant="outline" className="w-full gap-1">
          <Link to="/graph-analytics/$predictionId" params={{ predictionId }}>
            <ChartBar className="h-3.5 w-3.5" />
            {t("analytics.prediction.fullAnalytics")}
          </Link>
        </Button>
      )}
      {riskLevel !== "LOW" && isMobile && (
        <>
          <Button size="sm" variant="outline" className="w-full gap-1" onClick={() => setAnalyticsOpen(true)}>
            <ChartBar className="h-3.5 w-3.5" />
            {t("analytics.prediction.fullAnalytics")}
          </Button>
          <Dialog open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t("analytics.prediction.title")}</DialogTitle>
              </DialogHeader>
              {chartData.length > 0 && (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      layout="vertical"
                      margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
                      barSize={16}
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
                        width={120}
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
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
