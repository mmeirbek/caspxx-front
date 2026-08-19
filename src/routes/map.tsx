import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer } from "react-leaflet";
import { MapTrifold as MapIcon } from "@phosphor-icons/react";

import { requireAuth } from "@/lib/auth/guards";
import { useAuth } from "@/lib/auth/auth-provider";
import { getAccessToken } from "@/lib/auth/storage";
import { listMineOrders } from "@/lib/api/orders";
import { calculateRoute } from "@/lib/api/routes";
import { ApiError } from "@/lib/api/client";
import type { Order } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export const Route = createFileRoute("/map")({
  beforeLoad: ({ context }) => requireAuth(context),
  component: MapPage,
});

interface RouteResult {
  geometry: number[][];
  distanceKm: number;
  durationMinutes: number;
}

const CENTER: [number, number] = [43.6532, 51.1975];

function MapPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["orders", "mine"],
    queryFn: () => listMineOrders(getAccessToken() ?? ""),
    enabled: !!user,
  });

  const routeCalc = useMutation({
    mutationFn: (order: Order) =>
      calculateRoute(getAccessToken() ?? "", {
        orderId: order.id,
        startLat: order.originLat ?? undefined,
        startLng: order.originLng ?? undefined,
        endLat: order.destinationLat ?? undefined,
        endLng: order.destinationLng ?? undefined,
      }),
    onSuccess: (res) => {
      setRoute({
        geometry: res.geometry.coordinates,
        distanceKm: res.distanceKm,
        durationMinutes: res.durationMinutes,
      });
      setRouteError(null);
    },
    onError: (err) => {
      setRoute(null);
      setRouteError(err instanceof ApiError ? err.message : t("common.error"));
    },
  });

  const orders = useMemo(
    () => (data?.orders ?? []).filter((o) => o.originLat != null && o.destinationLat != null),
    [data],
  );
  const selected = orders.find((o) => o.id === selectedId) ?? null;

  const polyline: [number, number][] = useMemo(
    () => (route?.geometry ?? []).map(([lng, lat]) => [lat, lng] as [number, number]),
    [route],
  );

  function selectOrder(order: Order) {
    setSelectedId(order.id);
    routeCalc.mutate(order);
  }

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col md:flex-row">
      <div className="relative min-h-[50vh] flex-1 md:min-h-0">
        <MapContainer center={CENTER} zoom={9} className="h-full w-full" scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {orders.map((o) => (
            <CircleMarker
              key={o.id}
              center={[o.originLat as number, o.originLng as number]}
              radius={6}
              pathOptions={{
                color: "#2563eb",
                fillColor: selectedId === o.id ? "#dc2626" : "#2563eb",
                fillOpacity: 0.9,
              }}
              eventHandlers={{ click: () => selectOrder(o) }}
            >
              <Popup>{o.title}</Popup>
            </CircleMarker>
          ))}
          {selected && selected.destinationLat != null && (
            <CircleMarker
              center={[selected.destinationLat, selected.destinationLng as number]}
              radius={6}
              pathOptions={{ color: "#16a34a", fillColor: "#16a34a", fillOpacity: 0.9 }}
            />
          )}
          {polyline.length > 0 && (
            <Polyline
              positions={polyline}
              pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.9 }}
            />
          )}
        </MapContainer>

        {route && (
          <div className="absolute left-2 top-2 z-[500] rounded-md bg-background px-3 py-2 text-xs shadow ring-1 ring-border">
            {t("map.routeCalculated", {
              distance: route.distanceKm.toFixed(1),
              duration: Math.round(route.durationMinutes),
            })}
          </div>
        )}
        {routeError && (
          <div className="absolute left-2 top-2 z-[500] max-w-xs rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive shadow ring-1 ring-destructive/30">
            {routeError}
          </div>
        )}
      </div>

      <Card className="h-1/2 overflow-hidden rounded-none border-0 border-t md:h-auto md:w-80 md:border-l md:border-t-0">
        <CardContent className="p-0">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <MapIcon className="h-4 w-4 text-primary" aria-hidden />
            <h2 className="text-sm font-semibold">{t("orders.mine")}</h2>
          </div>
          <ScrollArea className="h-[calc(50vh-3.5rem)] md:h-[calc(100vh-7rem)]">
            <ul className="divide-y">
              {orders.length === 0 && (
                <li className="px-4 py-6 text-sm text-muted-foreground">{t("orders.empty")}</li>
              )}
              {orders.map((o) => (
                <li key={o.id}>
                  <button
                    className={cn(
                      "w-full px-4 py-3 text-left transition hover:bg-muted/60",
                      selectedId === o.id && "bg-primary/5",
                    )}
                    onClick={() => selectOrder(o)}
                  >
                    <p className="truncate text-sm font-medium">{o.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {o.origin} → {o.destination}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
            <div className="p-3">
              <Button asChild variant="outline" className="w-full">
                <Link to="/orders">{t("orders.title")}</Link>
              </Button>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
