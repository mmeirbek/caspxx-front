export interface GeocodeResult {
  displayName: string;
  lat: number;
  lon: number;
}

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const CACHE = new Map<string, GeocodeResult[]>();

export async function geocode(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  const key = query.trim().toLowerCase();
  if (key.length < 2) return [];
  const cached = CACHE.get(key);
  if (cached) return cached;

  const url = new URL(NOMINATIM);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "6");
  url.searchParams.set("addressdetails", "0");

  try {
    const res = await fetch(url.toString(), { signal });
    if (!res.ok) return [];
    const data = (await res.json()) as GeocodeResult[];
    CACHE.set(key, data);
    return data;
  } catch {
    return [];
  }
}
