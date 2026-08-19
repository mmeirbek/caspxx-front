import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import type { Order, RouteGeometry } from "@/lib/api/types";

const CENTER: [number, number] = [43.6532, 51.1975];

function abIcon(letter: "A" | "B") {
  return L.divIcon({
    className: "",
    html: `<div class="jetkiz-ab" data-letter="${letter}">${letter}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

const truckIcon = L.divIcon({
  className: "",
  html: `
  <div class="jetkiz-truck">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>
    </svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export interface JetkizMapProps {
  orders: Order[];
  routes: Record<string, RouteGeometry>;
  trucks: Record<string, { lat: number; lng: number }>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onOrderClick?: (order: Order) => void;
}

export function JetkizMap({
  orders,
  routes,
  trucks,
  selectedId,
  onSelect,
  onOrderClick,
}: JetkizMapProps) {
  const { t } = useTranslation();

  const polyline = useMemo(
    () => (id: string) =>
      (routes[id]?.coordinates ?? []).map(([lng, lat]) => [lat, lng] as [number, number]),
    [routes],
  );

  return (
    <MapContainer center={CENTER} zoom={9} className="h-full w-full" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {orders.map((o) => {
        if (o.originLat == null || o.originLng == null) return null;
        const hasRoute = routes[o.id] != null;
        if (hasRoute) {
          return (
            <Marker
              key={o.id}
              position={[o.originLat, o.originLng]}
              icon={abIcon("A")}
              eventHandlers={{ click: () => onSelect(o.id) }}
            >
              <Popup>{o.title}</Popup>
            </Marker>
          );
        }
        return (
          <CircleMarker
            key={o.id}
            center={[o.originLat, o.originLng]}
            radius={6}
            pathOptions={{
              color: "#2563eb",
              fillColor: selectedId === o.id ? "#dc2626" : "#2563eb",
              fillOpacity: 0.9,
            }}
            eventHandlers={{
              click: () => {
                onSelect(o.id);
                onOrderClick?.(o);
              },
            }}
          >
            <Popup>{o.title}</Popup>
          </CircleMarker>
        );
      })}

      {Object.keys(routes).map((id) => {
        const o = orders.find((x) => x.id === id);
        if (!o) return null;
        return (
          <div key={`route-${id}`}>
            {polyline(id).length > 0 && (
              <Polyline
                positions={polyline(id)}
                pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.9 }}
              />
            )}
            {o.destinationLat != null && o.destinationLng != null && (
              <Marker position={[o.destinationLat, o.destinationLng]} icon={abIcon("B")}>
                <Popup>{o.destination}</Popup>
              </Marker>
            )}
            {trucks[id] && <Marker position={[trucks[id].lat, trucks[id].lng]} icon={truckIcon} />}
          </div>
        );
      })}
    </MapContainer>
  );
}
