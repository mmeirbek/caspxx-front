import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ClockCounterClockwise } from "@phosphor-icons/react";
import { SectionLabel } from "./SectionLabel";
import { EmptyState } from "@/components/shared/EmptyState";
import type { Order } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-destructive/10 text-destructive",
  IN_TRANSIT: "bg-blue-100 text-blue-700",
  PICKED_UP: "bg-blue-100 text-blue-700",
  AT_CHECKPOINT: "bg-amber-100 text-amber-700",
  ASSIGNED: "bg-amber-100 text-amber-700",
  SEARCHING: "bg-slate-100 text-slate-700",
  NEW: "bg-slate-100 text-slate-700",
};

export function RecentOrders({ orders }: { orders: Order[] }) {
  const { t } = useTranslation();
  const recent = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return (
    <section className="space-y-2 rounded-md border bg-background/60 p-2 sm:p-3">
      <SectionLabel icon={ClockCounterClockwise} label={t("jetkiz.recentOrders")} />
      {recent.length === 0 ? (
        <EmptyState title={t("orders.empty")} />
      ) : (
        <ul className="space-y-1.5">
          {recent.map((o) => (
            <li key={o.id}>
              <Link
                to="/orders/$orderId"
                params={{ orderId: o.id }}
                className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-background px-2 py-1.5 transition hover:bg-muted/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{o.title}</p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {o.origin} → {o.destination}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                    STATUS_STYLES[o.status] ?? "bg-muted text-muted-foreground",
                  )}
                >
                  {t(`orders.status.${o.status}`)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
