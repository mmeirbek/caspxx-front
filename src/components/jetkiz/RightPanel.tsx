import { useTranslation } from "react-i18next";
import { X } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { KpiCell } from "./KpiCell";
import { SensorsSection, type SensorItem } from "./SensorsSection";
import { LiveCameraSection, type CameraItem } from "./LiveCameraSection";
import { AvailableOrdersSection, type AvailableOrderRow } from "./AvailableOrdersSection";
import { PredictionsSection } from "./PredictionsSection";
import { RecentOrders } from "./RecentOrders";
import { formatDateTime } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import type { Order, UserRole } from "@/lib/api/types";

export interface KpiItem {
  icon: Icon;
  label: string;
  value: string | number | undefined;
  accent?: boolean;
}

export function RightPanel({
  role,
  kpis,
  updatedAt,
  sensorItems,
  cameraItems,
  availableRows,
  freeWeight,
  freeVolume,
  takePendingId,
  onTake,
  predictionOrders,
  recentOrders,
  onClose,
  canTake,
}: {
  role: UserRole;
  kpis: KpiItem[];
  updatedAt: string | null;
  sensorItems: SensorItem[];
  cameraItems: CameraItem[];
  availableRows: AvailableOrderRow[];
  freeWeight: number;
  freeVolume: number;
  takePendingId: string | null;
  onTake: (order: Order) => void;
  predictionOrders: Order[];
  recentOrders: Order[];
  onClose?: () => void;
  canTake: boolean;
}) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? "ru") as "ru" | "en" | "kk";

  return (
    <div className="flex h-full w-full flex-col gap-2 overflow-y-auto border-l bg-card p-2 shadow-xl sm:gap-3 sm:p-3">
      <div className="flex items-start justify-between gap-2 border-b pb-2">
        <div className="min-w-0">
          <h1 className="truncate font-display text-lg font-extrabold tracking-tight text-primary sm:text-xl">
            {t("brand.name")}
          </h1>
          {updatedAt && (
            <p className="font-mono text-[10px] text-muted-foreground">
              {t("jetkiz.updated")}: {formatDateTime(updatedAt, lang)}
            </p>
          )}
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-2">
        {kpis.map((kpi) => (
          <KpiCell
            key={kpi.label}
            icon={kpi.icon}
            label={kpi.label}
            value={kpi.value}
            accent={kpi.accent}
          />
        ))}
      </div>

      {role === "CARRIER" ? (
        <AvailableOrdersSection
          rows={availableRows}
          onTake={onTake}
          takePendingId={takePendingId}
          freeWeight={freeWeight}
          freeVolume={freeVolume}
          canTake={canTake}
        />
      ) : (
        <SensorsSection items={sensorItems} />
      )}

      <PredictionsSection orders={predictionOrders} />

      <RecentOrders orders={recentOrders} />

      <div className="pb-2 sm:pb-3">
        <LiveCameraSection items={cameraItems} />
      </div>
    </div>
  );
}
