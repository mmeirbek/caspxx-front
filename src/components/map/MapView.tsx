import L, { type LatLngExpression } from "leaflet";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";

import { riskColorVar } from "@/components/shared/RiskBadge";
import { ASTANA_CENTER } from "@/lib/geocoding/nominatim";
import type {
  HeatPoint,
  Hotspot,
  LiveConfirmedEvent,
  RiskAreaWithPrediction,
  RiskLevel,
} from "@/lib/api/types";

// Fix default marker asset paths for Leaflet with bundlers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const pickedIcon = L.divIcon({
  className: "",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  html:
    '<div style="width:22px;height:22px;border-radius:9999px;background:hsl(var(--primary));' +
    "border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);" +
    'display:flex;align-items:center;justify-content:center;">' +
    '<div style="width:6px;height:6px;border-radius:9999px;background:#fff"></div></div>',
});

function hotspotIcon(count: number): L.DivIcon {
  const badge = count > 99 ? "99+" : String(count);
  return L.divIcon({
    className: "",
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    html:
      '<div style="position:relative;width:44px;height:44px;">' +
      '<div style="width:36px;height:36px;border-radius:9999px;background:#7c3aed;color:#fff;' +
      'border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);' +
      'display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;' +
      'position:absolute;top:0;left:4px;">⚠️</div>' +
      '<div style="min-width:18px;height:18px;border-radius:9999px;background:#ef4444;color:#fff;' +
      'border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3);' +
      'display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;' +
      'padding:0 3px;position:absolute;top:-2px;right:-2px;">' + badge + '</div>' +
      '</div>',
  });
}

const liveEventIcon = L.divIcon({
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  html:
    '<div style="width:32px;height:32px;border-radius:9999px;background:#f59e0b;color:#fff;' +
    'border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);' +
    'display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;">' +
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>' +
    '<path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>' +
    '</svg></div>',
});

function polygonCentroid(coords: number[][][]): [number, number] {
  const ring = coords[0];
  let latSum = 0, lngSum = 0;
  for (const [lng, lat] of ring) {
    latSum += lat;
    lngSum += lng;
  }
  return [latSum / ring.length, lngSum / ring.length];
}

export type MapLayerVisibility = {
  riskAreas: boolean;
  hotspots: boolean;
  liveEvents: boolean;
  heatmap: boolean;
};

export interface SelectedFeature {
  kind: "riskArea" | "hotspot" | "liveEvent";
  id: string;
}

interface Props {
  riskAreas?: RiskAreaWithPrediction[];
  hotspots?: Hotspot[];
  liveEvents?: LiveConfirmedEvent[];
  heatmapData?: HeatPoint[];
  layers: MapLayerVisibility;
  onSelect?: (f: SelectedFeature) => void;
  onLocationFound?: (lat: number, lon: number) => void;
  requestLocation?: number; // increment to trigger locate
  center?: [number, number];
  initialZoom?: number;
  onMapClick?: (lat: number, lon: number) => void;
  pickedPoint?: [number, number] | null;
}

function polygonRings(coords: number[][][]): LatLngExpression[][] {
  return coords.map((ring) => ring.map(([lon, lat]) => [lat, lon] as LatLngExpression));
}

function LocateHandler({
  trigger,
  onFound,
}: {
  trigger?: number;
  onFound?: (lat: number, lon: number) => void;
}) {
  const map = useMap();
  const onFoundRef = useRef(onFound);
  onFoundRef.current = onFound;

  useEffect(() => {
    if (!trigger) return;
    map.locate({ setView: true, maxZoom: 15 });
    const onLoc = (e: L.LocationEvent) => onFoundRef.current?.(e.latlng.lat, e.latlng.lng);
    map.on("locationfound", onLoc);
    return () => {
      map.off("locationfound", onLoc);
    };
  }, [trigger, map]);
  return null;
}

function CenterUpdater({ center }: { center?: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (!center) return;
    map.setView(center, Math.max(map.getZoom(), 14), { animate: true });
  }, [center, map]);
  return null;
}

function ClickHandler({ onMapClick }: { onMapClick?: (lat: number, lon: number) => void }) {
  useMapEvents({
    click: (e) => onMapClick?.(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

function ZoomHandler({ onZoom }: { onZoom: (zoom: number) => void }) {
  const map = useMap();
  useEffect(() => {
    onZoom(map.getZoom());
    const handler = () => onZoom(map.getZoom());
    map.on("zoomend", handler);
    return () => {
      map.off("zoomend", handler);
    };
  }, [map, onZoom]);
  return null;
}

function lineWeight(zoom: number): number {
  if (zoom >= 14) return 4;
  if (zoom <= 10) return 1.5;
  return 1.5 + (2.5 * (zoom - 10)) / 4;
}

function HeatmapLayer({ data, visible }: { data: HeatPoint[]; visible: boolean }) {
  const map = useMap();
  const layerRef = useRef<L.HeatLayer | null>(null);

  useEffect(() => {
    if (!visible || data.length === 0) {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await import("leaflet.heat");
        if (cancelled) return;
        if (!("heatLayer" in L)) return;
        if (!layerRef.current) {
          layerRef.current = L.heatLayer(
            data.map((p) => [p.lat, p.lng, p.intensity ?? 1] as unknown as L.HeatLatLngTuple),
            { radius: 25, blur: 15, maxZoom: 17, max: 1.0, gradient: { 0.4: "blue", 0.6: "lime", 0.8: "yellow", 1.0: "red" } },
          );
          layerRef.current.addTo(map);
        }
      } catch {
        /* leaflet.heat not available — skip */
      }
    })();
    return () => {
      cancelled = true;
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, data, visible]);

  return null;
}

export default function MapView({
  riskAreas = [],
  hotspots = [],
  liveEvents = [],
  heatmapData = [],
  layers,
  onSelect,
  onLocationFound,
  requestLocation,
  center = ASTANA_CENTER,
  initialZoom = 12,
  onMapClick,
  pickedPoint,
}: Props) {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState(initialZoom);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const displayHotspots = hotspots.slice(0, 60);

  return (
    <MapContainer center={center} zoom={initialZoom} className="h-full w-full" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocateHandler trigger={requestLocation} onFound={onLocationFound} />
      <CenterUpdater center={center} />
      {onMapClick && <ClickHandler onMapClick={onMapClick} />}
      <ZoomHandler onZoom={setZoom} />

      <HeatmapLayer data={heatmapData} visible={layers.heatmap} />

      {layers.riskAreas &&
        riskAreas.map((area) => {
          const level: RiskLevel = area.prediction?.riskLevel ?? "LOW";
          const color = riskColorVar(level);
          const geom = area.geometry;
          if (geom.type === "Polygon") {
            return (
              <Polygon
                key={area.id}
                positions={polygonRings(geom.coordinates)}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.28, weight: 1.5 }}
                eventHandlers={{ click: () => onSelectRef.current?.({ kind: "riskArea", id: area.id }) }}
              >
                <Tooltip>{t(`risk.${level}`)}</Tooltip>
              </Polygon>
            );
          }
          if (geom.type === "MultiPolygon") {
            return (
              <Polygon
                key={area.id}
                positions={geom.coordinates.map(polygonRings)}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.28, weight: 1.5 }}
                eventHandlers={{ click: () => onSelectRef.current?.({ kind: "riskArea", id: area.id }) }}
              >
                <Tooltip>{t(`risk.${level}`)}</Tooltip>
              </Polygon>
            );
          }
          if (geom.type === "LineString") {
            const weight = lineWeight(zoom);
            return (
              <Polyline
                key={area.id}
                positions={geom.coordinates.map(([lon, lat]) => [lat, lon] as LatLngExpression)}
                pathOptions={{ color, weight, opacity: 0.85 }}
                interactive
                eventHandlers={{ click: () => onSelectRef.current?.({ kind: "riskArea", id: area.id }) }}
              >
                <Tooltip sticky>{t(`risk.${level}`)}</Tooltip>
              </Polyline>
            );
          }
          return null;
        })}

      {layers.hotspots &&
        displayHotspots.map((h) => (
          <Polygon
            key={h.id}
            positions={polygonRings(h.geometry.coordinates)}
            pathOptions={{
              color: "#7c3aed",
              fillColor: "#7c3aed",
              fillOpacity: 0.15,
              weight: 1,
              dashArray: "4 3",
            }}
            eventHandlers={{ click: () => onSelectRef.current?.({ kind: "hotspot", id: h.id }) }}
          >
            <Tooltip>{t("hotspots.title")}</Tooltip>
          </Polygon>
        ))}

      {layers.hotspots &&
        displayHotspots.map((h) => {
          const center = polygonCentroid(h.geometry.coordinates);
          return (
            <Marker
              key={`marker-${h.id}`}
              position={center}
              icon={hotspotIcon(h.accidentCount)}
              eventHandlers={{ click: () => onSelectRef.current?.({ kind: "hotspot", id: h.id }) }}
            >
              <Tooltip direction="top" offset={[0, -22]}>
                {t("hotspots.title")}: {h.accidentCount}
              </Tooltip>
            </Marker>
          );
        })}

      {layers.liveEvents &&
        liveEvents.map((ev) => (
          <Marker
            key={ev.id}
            position={[ev.location.coordinates[1], ev.location.coordinates[0]]}
            icon={liveEventIcon}
            eventHandlers={{ click: () => onSelectRef.current?.({ kind: "liveEvent", id: ev.id }) }}
          >
            <Tooltip direction="top" offset={[0, -16]}>
              {ev.title}
            </Tooltip>
          </Marker>
        ))}

      {pickedPoint && <Marker position={pickedPoint} icon={pickedIcon} />}
    </MapContainer>
  );
}
