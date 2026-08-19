import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import {
  ArrowRight,
  CaretLeft,
  CaretRight,
  Fire,
  Info,
  Crosshair,
  List,
  MapPin,
  MagnifyingGlass,
  Skull,
  Sparkle,
  TrendUp,
  Users,
  X,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import customPulseIcon from "@/assets/custom-pulse-icon.png.asset.json";
import { MapCanvas } from "@/components/map/MapCanvas";
import { MapLayerControl } from "@/components/map/MapLayerControl";
import { MapLegend } from "@/components/map/MapLegend";
import type { MapLayerVisibility, SelectedFeature } from "@/components/map/MapView";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { NoBackendError } from "@/lib/api/client";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { RiskScoreBar } from "@/components/shared/RiskScoreBar";
import { PredictionModal } from "@/components/predictions/PredictionModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { AppDashboardResponse, AppMapResponse } from "@/lib/api/types";
import { geocodeAstana, type GeocodeResult } from "@/lib/geocoding/nominatim";
import { cn } from "@/lib/utils";
import { formatDateTime, formatNumber } from "@/lib/utils/format";
import type { SupportedLanguage } from "@/lib/i18n/config";
import { useIsMobile } from "@/hooks/use-mobile";

const PulseIcon = ({ className }: { className?: string }) => (
  <img src={customPulseIcon.url} alt="" className={className} />
);

const searchSchema = z.object({
  risk: fallback(z.boolean(), true).default(true),
  hot: fallback(z.boolean(), false).default(false),
  live: fallback(z.boolean(), false).default(false),
  heat: fallback(z.boolean(), false).default(false),
});

export const Route = createFileRoute("/")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Jol" },
      {
        name: "description",
        content:
          "Полноэкранная карта риска Астаны с подтверждёнными событиями, AI-прогнозами и статистикой в реальном времени.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? "ru") as SupportedLanguage;
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/" });

  const layers: MapLayerVisibility = useMemo(
    () => ({
      riskAreas: search.risk,
      hotspots: search.hot,
      liveEvents: search.live,
      heatmap: search.heat,
    }),
    [search.risk, search.hot, search.live, search.heat],
  );

  const setLayers = (v: MapLayerVisibility) => {
    navigate({
      search: {
        risk: v.riskAreas,
        hot: v.hotspots,
        live: v.liveEvents,
        heat: v.heatmap,
      },
      replace: true,
    });
  };

  const [locateTrigger, setLocateTrigger] = useState(0);
  const [center, setCenter] = useState<[number, number] | undefined>(undefined);
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  // Default: open on desktop, closed on mobile. Runs once on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    setSidebarOpen(window.matchMedia("(min-width: 768px)").matches);
  }, []);

  const isMobile = useIsMobile();
  const autoLocatedRef = useRef(false);
  useEffect(() => {
    if (!isMobile || autoLocatedRef.current) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    autoLocatedRef.current = true;
    setLocateTrigger((n) => n + 1);
  }, [isMobile]);

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
    staleTime: 60_000,
    retry: 2,
  });

  const dashboard = useQuery({
    queryKey: ["app", "dashboard"],
    queryFn: ({ signal }) => apiRequest<AppDashboardResponse>(endpoints.app.dashboard, { signal }),
    staleTime: 120_000,
    retry: 2,
  });

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
        setSuggestions(await geocodeAstana(searchText, ac.signal));
      } catch {
        /* aborted */
      }
    }, 350);
    return () => window.clearTimeout(handle);
  }, [searchText]);

  function requestLocation() {
    if (!navigator.geolocation) {
      toast.error(t("map.myLocationDenied"));
      return;
    }
    setLocateTrigger((n) => n + 1);
  }

  const stats = dashboard.data?.statistics;
  const top = dashboard.data?.topPredictions[0];
  const liveEvents = dashboard.data?.liveConfirmedEvents ?? [];

  return (
    <div className="relative block h-[calc(100vh-3.5rem)] w-full overflow-hidden">
      {/* Map: full-bleed background on all sizes */}
      <div className="absolute inset-0 z-0">
        <MapCanvas
          riskAreas={mapQuery.data?.riskAreas}
          hotspots={mapQuery.data?.hotspots}
          liveEvents={mapQuery.data?.liveConfirmedEvents}
          heatmapData={mapQuery.data?.heatmapData}
          layers={layers}
          requestLocation={locateTrigger}
          onLocationFound={(lat, lon) => setCenter([lat, lon])}
          onSelect={(f) => { if (f.kind === 'riskArea') navigate({ to: '/map', search: { risk: layers.riskAreas, hot: layers.hotspots, live: layers.liveEvents, heat: layers.heatmap } }) }}
          center={center}
        />
        {/* Bottom prediction CTA — anchored to map area */}
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-[450] -translate-x-1/2 md:bottom-6">
          <PredictCta topPredictionId={top?.id} />
        </div>
      </div>

      {/* Search + locate + layers — top-center, smoothly shifts when sidebar toggles */}
      <div
        className={
          "pointer-events-none absolute inset-x-0 top-3 z-[450] flex justify-center px-3 pr-14 transition-[padding] duration-300 ease-out md:top-4 md:pr-3 " +
          (sidebarOpen
            ? "md:pr-[calc(38%+0.75rem)] lg:pr-[calc(34%+0.75rem)] xl:pr-[calc(30%+0.75rem)]"
            : "")
        }
      >
        <div className="pointer-events-auto flex w-full max-w-xl items-center gap-2">
          <div className="relative flex-1">
            <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={t("map.searchPlaceholder")}
              className="h-10 bg-card pl-9 shadow-md"
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
            className="hidden h-10 w-10 shadow-md md:inline-flex"
            onClick={requestLocation}
            aria-label={t("map.myLocation")}
          >
            <Crosshair className="h-4 w-4" />
          </Button>
          <MapLayerControl value={layers} onChange={setLayers} />
        </div>
      </div>

      {/* Mobile open-panel button (top-right). Hidden when panel is open. */}
      {!sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Показать панель"
          className="pointer-events-auto absolute right-3 top-3 z-[455] flex h-10 w-10 items-center justify-center rounded-md border bg-card shadow-md hover:bg-muted md:hidden animate-fade-in"
        >
          <List className="h-4 w-4" />
        </button>
      )}

      {/* Legend — bottom-left */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-[450] md:bottom-4 md:left-4">
        <MapLegend />
      </div>

      {/* Desktop sidebar toggle — sits at panel's left edge, slides with it */}
      <button
        type="button"
        onClick={() => setSidebarOpen((v) => !v)}
        aria-label={sidebarOpen ? "Скрыть панель" : "Показать панель"}
        aria-expanded={sidebarOpen}
        className={
          "pointer-events-auto absolute top-1/2 z-[460] hidden -translate-y-1/2 items-center justify-center rounded-l-md border border-r-0 bg-card p-1.5 shadow-md transition-[right] duration-300 ease-out hover:bg-muted md:flex " +
          (sidebarOpen ? "md:right-[38%] lg:right-[34%] xl:right-[30%]" : "right-0")
        }
      >
        {sidebarOpen ? <CaretRight className="h-4 w-4" /> : <CaretLeft className="h-4 w-4" />}
      </button>

      {/* Mobile backdrop */}
      <div
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
        className={
          "absolute inset-0 z-[455] bg-background/60 backdrop-blur-[1px] transition-opacity duration-300 md:hidden " +
          (sidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0")
        }
      />

      {/* Right side panel — dashboards / stats. Always overlay; slides in/out. */}
      <aside
        aria-hidden={!sidebarOpen}
        className={
          "pointer-events-auto absolute inset-y-0 right-0 z-[458] flex w-[85%] max-w-sm transition-transform duration-300 ease-out md:w-[38%] md:max-w-none lg:w-[34%] xl:w-[30%] " +
          (sidebarOpen ? "translate-x-0" : "translate-x-full")
        }
      >
        <div className="flex h-full w-full flex-col gap-2 overflow-y-auto border-l bg-card p-2 shadow-xl sm:gap-3 sm:p-3 md:pb-4">
          {/* Hero header */}
          <div className="flex items-start justify-between gap-2 border-b pb-2 sm:pb-3">
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-lg font-extrabold leading-tight tracking-tight text-primary sm:text-xl">
                {t("dashboard.heroTitle")}
              </h1>
              <p className="font-mono text-[10px] text-muted-foreground">
                {t("common.updated")}:{" "}
                {dashboard.data?.context.dataFreshAt
                  ? formatDateTime(dashboard.data.context.dataFreshAt, lang)
                  : "—"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Скрыть панель"
              className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted md:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* KPI grid */}
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-2">
            <KpiCell
              icon={Fire}
              label={t("dashboard.kpi.highRiskAreas")}
              value={stats?.highRiskAreas}
              lang={lang}
            />
            <KpiCell
              icon={Fire}
              label={t("dashboard.kpi.criticalRiskAreas")}
              value={stats?.criticalRiskAreas}
              lang={lang}
              accent
            />
            <KpiCell
              icon={MapPin}
              label={t("dashboard.kpi.hotspots")}
              value={stats?.hotspotCount}
              lang={lang}
            />
            <KpiCell
              icon={TrendUp}
              label={t("dashboard.kpi.readyPredictions")}
              value={stats?.readyPredictions}
              lang={lang}
            />
            <KpiCell
              icon={Skull}
              label={t("dashboard.kpi.deceased")}
              value={stats?.deceasedCount}
              lang={lang}
            />
            <KpiCell
              icon={Users}
              label={t("dashboard.kpi.injured")}
              value={stats?.injuredCount}
              lang={lang}
            />
          </div>

          {/* AI Insight */}
          <div className="rounded-md border bg-background/60 p-2 sm:p-3">
            <SectionLabel icon={PulseIcon} label={t("dashboard.aiInsight.title")} accent />
            <div className="mt-3">
              {dashboard.isLoading && <LoadingState rows={3} />}
              {dashboard.isError && !(dashboard.error instanceof NoBackendError) && (
                <ApiErrorAlert error={dashboard.error} onRetry={() => dashboard.refetch()} />
              )}
              {!dashboard.isLoading && !top && (
                <EmptyState title={t("dashboard.aiInsight.empty")} className="border-0" />
              )}
              {top && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <RiskBadge level={top.riskLevel} />
                    <span className="text-xs text-muted-foreground">
                      {t("risk.score")}: {(top.score * 100).toFixed(0)}%
                    </span>
                  </div>
                  {top.futureContext && top.futureContext.signals.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {top.futureContext.signals.map((s, i) => (
                        <span key={i} className="text-xs" title={s.title.ru ?? s.title.en}>
                          {s.flag === "severe_weather" ? "\u2601\uFE0F" :
                           s.flag === "heavy_traffic" ? "\uD83D\uDE97" :
                           s.flag === "road_repair" ? "\uD83D\uDD27" :
                           s.flag === "major_event" ? "\uD83C\uDFAA" : ""}
                        </span>
                      ))}
                    </div>
                  )}
                  <RiskScoreBar level={top.riskLevel} score={top.score} />
                  <OpenPredictionButton
                    predictionId={top.id}
                    label={t("dashboard.aiInsight.openFull")}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Live events */}
          <div className="flex min-h-[140px] flex-1 flex-col rounded-md border bg-card p-2 shadow-sm sm:min-h-0 sm:p-3">
            <div className="flex items-center justify-between">
              <SectionLabel icon={PulseIcon} label={t("dashboard.live.title")} destructive />
              <span className="rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-destructive">
                {t("map.liveBadge")}
              </span>
            </div>
            <div
              className={cn(
                "mt-2 flex-1 overflow-y-auto pr-1",
                liveEvents.length === 0 ? "flex items-center justify-center" : "space-y-1.5",
              )}
            >
              {liveEvents.length === 0 ? (
                <EmptyState
                  title={t("dashboard.live.empty")}
                  icon={<PulseIcon className="h-7 w-7" aria-hidden />}
                  className="border-0 p-0"
                />
              ) : (
                liveEvents.slice(0, 8).map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-start gap-2 rounded border border-border/60 bg-background p-2"
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{ev.title}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {formatDateTime(ev.confirmedAt, lang)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            <span>{t("common.disclaimer")}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

function PredictCta({ topPredictionId }: { topPredictionId?: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  if (topPredictionId) {
    return (
      <>
        <Button
          size="lg"
          className="pointer-events-auto gap-2 rounded-full px-6 shadow-xl"
          onClick={() => setOpen(true)}
        >
          <Sparkle className="h-4 w-4" />
          {t("dashboard.predict.cta")}
          <ArrowRight className="h-4 w-4" />
        </Button>
        <PredictionModal
          predictionId={open ? topPredictionId : null}
          onOpenChange={(v: boolean) => setOpen(v)}
        />
      </>
    );
  }
  return (
    <Button size="lg" className="pointer-events-auto gap-2 rounded-full px-6 shadow-xl" disabled>
      <Sparkle className="h-4 w-4" />
      {t("dashboard.predict.pending")}
    </Button>
  );
}

function OpenPredictionButton({ predictionId, label }: { predictionId: string; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" className="w-full" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <PredictionModal
        predictionId={open ? predictionId : null}
        onOpenChange={(v: boolean) => setOpen(v)}
      />
    </>
  );
}

function SectionLabel({
  icon: Icon,
  label,
  accent,
  destructive,
}: {
  icon: React.ElementType;
  label: string;
  accent?: boolean;
  destructive?: boolean;
}) {
  const color = destructive
    ? "bg-destructive/10 text-destructive"
    : accent
      ? "bg-accent/15 text-accent"
      : "bg-primary/10 text-primary";
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <div className={"flex h-5 w-5 items-center justify-center rounded sm:h-6 sm:w-6 " + color}>
        <Icon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
      </div>
      <h2 className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground">
        {label}
      </h2>
    </div>
  );
}

function KpiCell({
  icon: Icon,
  label,
  value,
  lang,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number | undefined;
  lang: SupportedLanguage;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 bg-background p-2 sm:flex-col sm:items-start sm:justify-start sm:gap-1.5 sm:p-3">
      <div className="flex items-center gap-1 font-sans text-[10px] font-semibold uppercase leading-tight tracking-wide text-foreground sm:flex-row sm:items-center sm:gap-1.5 sm:text-[11px] sm:leading-snug sm:tracking-wider">
        <Icon
          className={
            "h-2.5 w-2.5 shrink-0 sm:h-2.5 sm:w-2.5 " +
            (accent ? "text-destructive" : "text-accent")
          }
        />
        <span className="max-sm:inline-block max-sm:truncate sm:line-clamp-3" title={label}>
          {label}
        </span>
      </div>
      <p
        className={
          "font-display text-base font-bold tabular-nums leading-none sm:text-xl " +
          (accent ? "text-destructive" : "text-primary")
        }
      >
        {value === undefined ? "—" : formatNumber(value, lang)}
      </p>
    </div>
  );
}
