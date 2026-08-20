import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, MagnifyingGlass, Warning } from "@phosphor-icons/react";

import { geocodeSearch } from "@/lib/api/geocode";
import type { GeocodeResult } from "@/lib/api/types";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onSelect: (result: GeocodeResult) => void;
  onChange?: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function GeocodeAddressInput({ value, onSelect, onChange, placeholder, disabled }: Props) {
  const { t } = useTranslation();
  const [text, setText] = useState(value);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setText(value);
  }, [value]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = text.trim();
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      setFailed(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await geocodeSearch(q);
        setResults(res.results);
        setOpen(res.results.length > 0);
        setFailed(false);
      } catch {
        setResults([]);
        setOpen(false);
        setFailed(true);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [text]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(result: GeocodeResult) {
    setText(result.label);
    setOpen(false);
    onSelect(result);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          value={text}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => {
            setText(e.target.value);
            onChange?.(e.target.value);
          }}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-lg">
          {results.map((r, i) => (
            <li key={`${r.source}-${i}`}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted",
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(r)}
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0">
                  <span className="block truncate">{r.label}</span>
                  <span className="block text-[10px] text-muted-foreground">
                    {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)} ·{" "}
                    {r.settlementId ? t("orders.geocode.local") : t("orders.geocode.osm")}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {failed && (
        <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
          <Warning className="h-3 w-3" aria-hidden />
          {t("orders.geocode.failed")}
        </p>
      )}

      {open && results.length === 0 && !loading && (
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MagnifyingGlass className="h-3 w-3" aria-hidden />
          {t("orders.geocode.empty")}
        </p>
      )}
    </div>
  );
}
