import { useTranslation } from "react-i18next";
import { Package, TrendUp } from "@phosphor-icons/react";
import { SectionLabel } from "./SectionLabel";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Order } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export interface AvailableOrderRow {
  order: Order;
  compatible: boolean;
}

export function AvailableOrdersSection({
  rows,
  onTake,
  takePendingId,
  freeWeight,
  freeVolume,
  canTake,
}: {
  rows: AvailableOrderRow[];
  onTake: (order: Order) => void;
  takePendingId: string | null;
  freeWeight: number;
  freeVolume: number;
  canTake: boolean;
}) {
  const { t } = useTranslation();
  const sorted = [...rows].sort((a, b) => Number(b.compatible) - Number(a.compatible));

  return (
    <section className="space-y-2 rounded-md border bg-background/60 p-2 sm:p-3">
      <SectionLabel icon={TrendUp} label={t("orders.available")} tone="accent" />
      <p className="text-[10px] text-muted-foreground">
        {t("jetkiz.compatible.free", {
          weight: freeWeight.toFixed(1),
          volume: freeVolume.toFixed(0),
        })}
      </p>
      {!canTake && (
        <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-800">
          {t("carrier.pendingApproval")}
        </p>
      )}
      {sorted.length === 0 ? (
        <EmptyState title={t("jetkiz.compatible.empty")} />
      ) : (
        <div className="space-y-2">
          {sorted.map(({ order, compatible }) => (
            <div key={order.id} className="rounded-md border border-border/60 bg-background p-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{order.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {order.origin} → {order.destination}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span>
                      {order.weight} т · {order.volume} м³
                    </span>
                    {order.estimatedPrice != null && (
                      <span>· {order.estimatedPrice.toLocaleString("ru-RU")} ₸</span>
                    )}
                    {compatible && (
                      <Badge variant="secondary" className="text-[10px]">
                        <Package className="mr-0.5 h-2.5 w-2.5" />
                        {t("jetkiz.compatible.title")}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  className={cn(
                    "shrink-0",
                    compatible && "bg-accent text-accent-foreground hover:bg-accent/90",
                  )}
                  disabled={!canTake || takePendingId === order.id}
                  onClick={() => onTake(order)}
                >
                  {t("jetkiz.compatible.take")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
