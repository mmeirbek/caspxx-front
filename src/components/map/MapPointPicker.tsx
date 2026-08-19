import { Crosshair, MagnifyingGlass } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { MapCanvas } from "@/components/map/MapCanvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ASTANA_CENTER, geocodeAstana, type GeocodeResult } from "@/lib/geocoding/nominatim";

interface Props {
  value: { lat: number; lon: number };
  onChange: (v: { lat: number; lon: number }) => void;
  className?: string;
}

const emptyLayers = {
  riskAreas: false,
  hotspots: false,
  liveEvents: false,
  heatmap: false,
};

export function MapPointPicker({ value, onChange, className }: Props) {
  const { t } = useTranslation();
  const [center, setCenter] = useState<[number, number]>([value.lat, value.lon]);
  const [locate, setLocate] = useState(0);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (search.trim().length < 2) {
      setSuggestions([]);
      setActiveIdx(-1);
      return;
    }
    const handle = window.setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const res = await geocodeAstana(search, ac.signal);
        setSuggestions(res);
        setActiveIdx(res.length > 0 ? 0 : -1);
      } catch {
        /* ignore */
      }
    }, 350);
    return () => window.clearTimeout(handle);
  }, [search]);

  function pick(s: GeocodeResult) {
    onChange({ lat: s.lat, lon: s.lon });
    setCenter([s.lat, s.lon]);
    setSearch("");
    setSuggestions([]);
    setActiveIdx(-1);
    queueMicrotask(() => inputRef.current?.focus());
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const s = suggestions[activeIdx >= 0 ? activeIdx : 0];
      if (s) pick(s);
    } else if (e.key === "Escape") {
      setSuggestions([]);
      setActiveIdx(-1);
    }
  }

  useEffect(() => {
    if (suggestions.length > 0 && listRef.current) {
      listRef.current.focus();
    }
  }, [suggestions]);

  function onListKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const s = suggestions[activeIdx >= 0 ? activeIdx : 0];
      if (s) pick(s);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setSuggestions([]);
      setActiveIdx(-1);
      inputRef.current?.focus();
    } else if (e.key === "Backspace") {
      e.preventDefault();
      inputRef.current?.focus();
      setSearch((prev) => prev.slice(0, -1));
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      inputRef.current?.focus();
      setSearch((prev) => prev + e.key);
    }
  }

  useEffect(() => {
    if (activeIdx < 0 || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  function useMy() {
    if (!navigator.geolocation) {
      toast.error(t("map.myLocationDenied"));
      return;
    }
    setLocate((n) => n + 1);
  }

  const picked: [number, number] = [value.lat, value.lon];

  return (
    <div className={className}>
      <div className="relative">
        <div className="h-64 w-full overflow-hidden rounded-lg border">
          <MapCanvas
            layers={emptyLayers}
            center={center}
            initialZoom={13}
            pickedPoint={picked}
            onMapClick={(lat, lon) => {
              onChange({ lat, lon });
            }}
            onLocationFound={(lat, lon) => {
              onChange({ lat, lon });
              setCenter([lat, lon]);
            }}
            requestLocation={locate}
          />
        </div>

        <div className="pointer-events-none absolute inset-x-2 top-2 z-[400]">
          <div className="pointer-events-auto flex items-center gap-2">
            <div className="relative flex-1">
              <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={t("map.searchPlaceholder")}
                className="h-9 border-border bg-background/95 pl-9 shadow-md backdrop-blur"
                role="combobox"
                aria-expanded={suggestions.length > 0}
                aria-controls="map-picker-suggestions"
                aria-activedescendant={activeIdx >= 0 ? `map-picker-opt-${activeIdx}` : undefined}
                autoComplete="off"
              />
              {suggestions.length > 0 && (
                <div
                  ref={listRef}
                  id="map-picker-suggestions"
                  role="listbox"
                  tabIndex={0}
                  onKeyDown={onListKeyDown}
                  className="absolute inset-x-0 top-10 z-[500] max-h-56 overflow-y-auto rounded-md border bg-popover p-1 shadow-lg outline-none"
                >
                  {suggestions.map((s, i) => {
                    const active = i === activeIdx;
                    return (
                      <button
                        key={`${s.lat}-${s.lon}`}
                        id={`map-picker-opt-${i}`}
                        data-idx={i}
                        role="option"
                        aria-selected={active}
                        type="button"
                        className={
                          "w-full rounded px-2 py-1.5 text-left text-sm " +
                          (active ? "bg-primary text-primary-foreground" : "hover:bg-muted")
                        }
                        onMouseEnter={() => setActiveIdx(i)}
                        onClick={() => pick(s)}
                      >
                        {s.displayName}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-9 w-9 shadow-sm"
              onClick={useMy}
              aria-label={t("map.myLocation")}
            >
              <Crosshair className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {t("submit.fields.pickHint")} · {value.lat.toFixed(5)}, {value.lon.toFixed(5)}
      </p>
    </div>
  );
}

export { ASTANA_CENTER };
