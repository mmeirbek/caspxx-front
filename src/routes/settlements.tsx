import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { useMemo, useState } from "react";
import { MapPin } from "@phosphor-icons/react";

import { listSettlements } from "@/lib/api/settlements";
import type { Settlement } from "@/lib/api/types";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/settlements")({
  component: SettlementsPage,
});

function localizeName(s: Settlement, lang: string): string {
  if (lang === "kk") return s.nameKk;
  if (lang === "ru") return s.nameRu;
  return s.name;
}

function SettlementMap({ settlements }: { settlements: Settlement[] }) {
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
        {settlements.map((s) => (
          <CircleMarker
            key={s.id}
            center={[s.latitude, s.longitude]}
            radius={6}
            pathOptions={{ color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.7 }}
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

function SettlementCard({ settlement, lang }: { settlement: Settlement; lang: string }) {
  const { t } = useTranslation();
  return (
    <Card className="transition hover:border-primary/50 hover:shadow-sm">
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
  const lang = i18n.language;
  const [query, setQuery] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["settlements"],
    queryFn: () => listSettlements(),
  });

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

      <SettlementMap settlements={settlements} />

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
                  <SettlementCard key={s.id} settlement={s} lang={lang} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
