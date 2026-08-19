import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import { geocode, type GeocodeResult } from "@/lib/geocoding/geocode";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface LatLngValue {
  lat: number;
  lng: number;
}

interface PointPickerProps {
  value: LatLngValue | null;
  onChange: (value: LatLngValue) => void;
  hint?: string;
}

const DEFAULT_CENTER: [number, number] = [43.6532, 51.1975];

export function PointPicker({ value, onChange, hint }: PointPickerProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      void geocode(query, controller.signal).then((r) => setResults(r));
    }, 400);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const center: [number, number] = useMemo(
    () => (value ? [value.lat, value.lng] : DEFAULT_CENTER),
    [value],
  );

  return (
    <div className="space-y-2">
      <Popover open={openSearch} onOpenChange={setOpenSearch}>
        <PopoverTrigger asChild>
          <Input placeholder={t("map.searchPlaceholder")} className="w-full" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 p-0">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("map.searchPlaceholder")}
            className="border-0 focus-visible:ring-0"
            autoFocus
          />
          <div className="max-h-56 overflow-y-auto border-t">
            {results.map((r, i) => (
              <button
                key={i}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => {
                  onChange({ lat: r.lat, lng: r.lon });
                  setQuery(r.displayName);
                  setOpenSearch(false);
                }}
              >
                {r.displayName}
              </button>
            ))}
            {results.length === 0 && query.trim().length >= 2 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">{t("common.empty")}</p>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <div className="relative h-48 w-full overflow-hidden rounded-md border">
        <MapContainer center={center} zoom={10} className="h-full w-full" scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {value && (
            <CircleMarker
              center={[value.lat, value.lng]}
              radius={8}
              pathOptions={{ color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.8 }}
            />
          )}
        </MapContainer>
        <button
          type="button"
          className="absolute bottom-2 right-2 z-[500] rounded-md bg-background px-2 py-1 text-xs shadow ring-1 ring-border"
          onClick={() => setOpen(true)}
        >
          {t("map.pickOnMap")}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4">
          <div className="relative h-[70vh] w-full max-w-3xl overflow-hidden rounded-lg border bg-background">
            <MapContainer center={center} zoom={12} className="h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {value && (
                <CircleMarker
                  center={[value.lat, value.lng]}
                  radius={8}
                  pathOptions={{ color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.8 }}
                />
              )}
              <ClickCapture onChange={onChange} />
            </MapContainer>
            <div className="absolute left-2 top-2 z-[500] rounded-md bg-background px-3 py-2 text-xs shadow ring-1 ring-border">
              {hint ?? t("map.pickHint")}
            </div>
            <button
              type="button"
              className="absolute bottom-2 right-2 z-[500] rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground shadow"
              onClick={() => setOpen(false)}
            >
              {t("common.confirm")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ClickCapture({ onChange }: { onChange: (v: LatLngValue) => void }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}
