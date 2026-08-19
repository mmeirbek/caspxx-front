import { Stack } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import type { MapLayerVisibility } from "./MapView";

interface Props {
  value: MapLayerVisibility;
  onChange: (v: MapLayerVisibility) => void;
}

const KEYS: Array<{ key: keyof MapLayerVisibility; labelKey: string }> = [
  { key: "riskAreas", labelKey: "map.layer.riskAreas" },
  { key: "hotspots", labelKey: "map.layer.hotspots" },
  { key: "liveEvents", labelKey: "map.layer.liveEvents" },
  { key: "heatmap", labelKey: "map.layer.heatmap" },
];

export function MapLayerControl({ value, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          aria-label={t("map.layers")}
          className="h-10 w-10 shadow-md p-0 md:h-9 md:w-auto md:px-3 md:gap-2"
        >
          <Stack className="h-4 w-4" aria-hidden />
          <span className="hidden md:inline">{t("map.layers")}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <p className="mb-3 text-sm font-semibold">{t("map.layers")}</p>
        <div className="space-y-3">
          {KEYS.map(({ key, labelKey }) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <Label htmlFor={`layer-${key}`} className="text-sm">
                {t(labelKey)}
              </Label>
              <Switch
                id={`layer-${key}`}
                checked={value[key]}
                onCheckedChange={(checked) => onChange({ ...value, [key]: checked })}
              />
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
