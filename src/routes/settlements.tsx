import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { useEffect, useMemo, useState } from "react";
import { MapPin } from "@phosphor-icons/react";

import { listSettlements } from "@/lib/api/settlements";
import type { Settlement } from "@/lib/api/types";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-provider";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/settlements")({
  component: SettlementsPage,
});

function localizeName(s: Settlement, lang: string): string {
  if (lang === "kk") return s.nameKk;
  if (lang === "ru") return s.nameRu;
  return s.name;
}

function SettlementMap({
  settlements,
  selected,
}: {
  settlements: Settlement[];
  selected: Settlement | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (selected) {
      map.flyTo([selected.latitude, selected.longitude], 10, { duration: 0.8 });
    }
  }, [selected, map]);

  const shown = selected ? [selected] : settlements;

  return (
    <div className="h-72 w-full overflow-hidden rounded-lg border">
      <MapContainer
        center={[43.65, 51.16]}
        zoom={8}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {shown.map((s) => (
          <CircleMarker
            key={s.id}
            center={[s.latitude, s.longitude]}
            radius={selected ? 10 : 6}
            pathOptions={
              selected
                ? { color: "#dc2626", fillColor: "#dc2626", fillOpacity: 0.85 }
                : { color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.7 }
            }
          >
            <Popup>
              <p className="font-medium">{s.nameRu}</p>
              <p className="text-xs text-muted-foreground">
                {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
              </p>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

function SettlementCard({
  settlement,
  lang,
  selected,
  onSelect,
}: {
  settlement: Settlement;
  lang: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Card
      className={cn(
        "cursor-pointer transition hover:border-primary/50 hover:shadow-sm",
        selected && "border-primary bg-primary/5 ring-2 ring-primary/30",
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium">{localizeName(settlement, lang)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t(`settlements.types.${settlement.type}`)}
            </p>
          </div>
          <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        </div>
        <dl className="mt-3 space-y-1 text-xs">
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">{t("settlements.latitude")}</dt>
            <dd className="font-medium tabular-nums">{settlement.latitude.toFixed(4)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">{t("settlements.longitude")}</dt>
            <dd className="font-medium tabular-nums">{settlement.longitude.toFixed(4)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

function SettlementsPage() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const lang = i18n.language;
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["settlements"],
    queryFn: () => listSettlements(),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex w-full max-w-2xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{t("auth.loginRequired")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/login">{t("auth.login")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const settlements = useMemo(() => {
    const all = data?.settlements ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((s) =>
      [s.name, s.nameRu, s.nameKk, s.district].some((v) => v.toLowerCase().includes(q)),
    );
  }, [data, query]);

  const byDistrict = useMemo(() => {
    const groups = new Map<string, Settlement[]>();
    for (const s of settlements) {
      const list = groups.get(s.district) ?? [];
      list.push(s);
      groups.set(s.district, list);
    }
    return [...groups.entries()];
  }, [settlements]);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("settlements.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("settlements.subtitle")}</p>
      </div>

      <Input
        type="search"
        placeholder={t("settlements.search")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-md"
      />

      <SettlementMap
        settlements={settlements}
        selected={settlements.find((s) => s.id === selectedId) ?? null}
      />

      {selectedId && (
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          {t("settlements.showAll")}
        </button>
      )}

      {settlements.length === 0 ? (
        <EmptyState title={t("settlements.empty")} />
      ) : (
        <div className="space-y-6">
          {byDistrict.map(([district, list]) => (
            <section key={district}>
              <CardHeader className="px-1 pb-2">
                <CardTitle className="text-base">{district}</CardTitle>
              </CardHeader>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {list.map((s) => (
                  <SettlementCard
                    key={s.id}
                    settlement={s}
                    lang={lang}
                    selected={s.id === selectedId}
                    onSelect={() => setSelectedId((cur) => (cur === s.id ? null : s.id))}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
