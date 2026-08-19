import { useTranslation } from "react-i18next";
import { Drop, Thermometer } from "@phosphor-icons/react";
import { SectionLabel } from "./SectionLabel";
import { EmptyState } from "@/components/shared/EmptyState";

export interface SensorItem {
  orderId: string;
  title: string;
  temperature: number | null;
  humidity: number | null;
}

function SensorValue({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Thermometer;
  label: string;
  value: number | null;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium">
      <Icon className="h-3 w-3 text-primary" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="tabular-nums">{value != null ? `${value.toFixed(1)}°` : "—"}</span>
    </span>
  );
}

export function SensorsSection({ items }: { items: SensorItem[] }) {
  const { t } = useTranslation();
  return (
    <section className="space-y-2 rounded-md border bg-background/60 p-2 sm:p-3">
      <SectionLabel icon={Thermometer} label={t("jetkiz.sensors.title")} tone="accent" />
      {items.length === 0 ? (
        <EmptyState title={t("jetkiz.sensors.empty")} />
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.orderId} className="rounded-md border border-border/60 bg-background p-2">
              <p className="truncate text-xs font-medium">{it.title}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <SensorValue
                  icon={Thermometer}
                  label={t("jetkiz.sensors.temperature")}
                  value={it.temperature}
                />
                <SensorValue icon={Drop} label={t("jetkiz.sensors.humidity")} value={it.humidity} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
