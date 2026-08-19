// Nominatim geocoding provider (public OSM). Debounced, cancellable, cached.

export interface GeocodeResult {
  displayName: string;
  lat: number;
  lon: number;
}

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const CACHE = new Map<string, GeocodeResult[]>();

// Loose Astana viewbox for biasing (lon_min, lat_min, lon_max, lat_max)
const ASTANA_VIEWBOX = "71.10,50.95,71.75,51.35";

export async function geocodeAstana(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  const key = query.trim().toLowerCase();
  if (key.length < 2) return [];
  const cached = CACHE.get(key);
  if (cached) return cached;

  const url = new URL(NOMINATIM);
  url.searchParams.set("q", `${query}, Astana`);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "6");
  url.searchParams.set("viewbox", ASTANA_VIEWBOX);
  url.searchParams.set("bounded", "1");
  url.searchParams.set("addressdetails", "0");

  const res = await fetch(url.toString(), {
    signal,
    headers: { "Accept-Language": "ru,kk,en" },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
  const out: GeocodeResult[] = json.map((r) => ({
    displayName: r.display_name,
    lat: Number.parseFloat(r.lat),
    lon: Number.parseFloat(r.lon),
  }));
  CACHE.set(key, out);
  return out;
}

// Rough Astana bounds check
const ASTANA_BOUNDS = { minLon: 71.1, maxLon: 71.75, minLat: 50.95, maxLat: 51.35 };
export function isWithinAstana(lon: number, lat: number): boolean {
  return (
    lon >= ASTANA_BOUNDS.minLon &&
    lon <= ASTANA_BOUNDS.maxLon &&
    lat >= ASTANA_BOUNDS.minLat &&
    lat <= ASTANA_BOUNDS.maxLat
  );
}

export const ASTANA_CENTER: [number, number] = [51.128, 71.43]; // [lat, lon]
