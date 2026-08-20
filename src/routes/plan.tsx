import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer } from "react-leaflet";
import { ArrowDown, ArrowUp, MapPinLine, Package, Truck } from "@phosphor-icons/react";

import { requireRole } from "@/lib/auth/guards";
import { getAccessToken } from "@/lib/auth/storage";
import { planCarrierRoute } from "@/lib/api/routes";
import { cn } from "@/lib/utils";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/plan")({
  beforeLoad: ({ context }) => requireRole(context, ["CARRIER"]),
  component: PlanPage,
});

function toLatLng(coords: number[][]): [number, number][] {
  return coords.map(([lng, lat]) => [lat, lng]);
}

function strategyLabel(strategy: string): string {
  switch (strategy) {
    case "vroom":
      return "VROOM";
    case "greedy":
      return "Greedy";
    default:
      return "—";
  }
}

function PlanMap({
  geometry,
  stops,
}: {
  geometry: number[][];
  stops: { orderId: string; action: "pickup" | "delivery"; lat: number; lng: number }[];
}) {
  return (
    <div className="h-80 w-full overflow-hidden rounded-lg border">
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
        {geometry.length > 0 && (
          <Polyline positions={toLatLng(geometry)} pathOptions={{ color: "#2563eb", weight: 4 }} />
        )}
        {stops.map((stop, idx) => (
          <CircleMarker
            key={`${stop.orderId}-${stop.action}-${idx}`}
            center={[stop.lat, stop.lng]}
            radius={7}
            pathOptions={{
              color: stop.action === "pickup" ? "#16a34a" : "#dc2626",
              fillColor: stop.action === "pickup" ? "#16a34a" : "#dc2626",
              fillOpacity: 0.8,
            }}
          >
            <Popup>
              <p className="text-xs font-medium">
                {idx + 1}. {stop.action === "pickup" ? "Pickup" : "Delivery"}
              </p>
              <p className="text-xs text-muted-foreground">
                {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
              </p>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

function StopRow({
  index,
  action,
  order,
}: {
  index: number;
  action: "pickup" | "delivery";
  order: { id: string; title: string; origin: string; destination: string };
}) {
  const { t } = useTranslation();
  const isPickup = action === "pickup";
  return (
    <li className="flex items-start gap-3 py-3">
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
          isPickup ? "bg-emerald-600" : "bg-red-600",
        )}
      >
        {index + 1}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {isPickup ? t("plan.pickup") : t("plan.delivery")}
          </span>
          <span className="truncate text-sm text-muted-foreground">
            {isPickup ? order.origin : order.destination}
          </span>
        </div>
        <Link
          to="/orders/$orderId"
          params={{ orderId: order.id }}
          className="mt-0.5 block truncate text-xs font-medium text-primary hover:underline"
        >
          {order.title}
        </Link>
      </div>
      {isPickup ? (
        <ArrowUp className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
      ) : (
        <ArrowDown className="h-4 w-4 shrink-0 text-red-600" aria-hidden />
      )}
    </li>
  );
}

function PlanPage() {
  const { t } = useTranslation();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["routes", "plan"],
    queryFn: () => planCarrierRoute(getAccessToken() ?? ""),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (!data) return null;

  const orderById = new Map(data.orders.map((o) => [o.id, o]));
  const stopsByOrder = data.stops.map((stop) => ({
    ...stop,
    order: orderById.get(stop.orderId),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("plan.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("plan.subtitle")}</p>
      </div>

      {data.orders.length === 0 ? (
        <EmptyState title={t("plan.noOrders")} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" aria-hidden />
                  {t("plan.ordersCount")}
                </div>
                <p className="mt-1 text-2xl font-bold tabular-nums">{data.orders.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Truck className="h-4 w-4" aria-hidden />
                  {t("plan.capacityTons")}
                </div>
                <p className="mt-1 text-2xl font-bold tabular-nums">{data.capacityTons}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPinLine className="h-4 w-4" aria-hidden />
                  {t("plan.freeTons")}
                </div>
                <p className="mt-1 text-2xl font-bold tabular-nums">{data.freeTons}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {t("plan.strategy")}
                </div>
                <p className="mt-1 text-2xl font-bold tabular-nums">
                  {strategyLabel(data.strategy)}
                </p>
              </CardContent>
            </Card>
          </div>

          {data.route && (
            <Card>
              <CardHeader>
                <CardTitle>{t("plan.route")}</CardTitle>
                <CardDescription>
                  {data.route.distanceKm.toFixed(1)} km · {Math.round(data.route.durationMinutes)}{" "}
                  min
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PlanMap geometry={data.route.geometry.coordinates} stops={data.stops} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{t("plan.sequence")}</CardTitle>
              <CardDescription>
                {data.vehicle
                  ? `${data.vehicle.plateNumber} · ${data.vehicle.capacityTons} t`
                  : t("plan.noVehicle")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stopsByOrder.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("plan.noRoute")}</p>
              ) : (
                <ol className="divide-y">
                  {stopsByOrder.map((stop, idx) =>
                    stop.order ? (
                      <StopRow
                        key={`${stop.orderId}-${stop.action}-${idx}`}
                        index={idx}
                        action={stop.action}
                        order={stop.order}
                      />
                    ) : null,
                  )}
                </ol>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
