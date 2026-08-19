import { AnimatePresence, motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Package, X } from "@phosphor-icons/react";

import { useIsMobile } from "@/hooks/use-mobile";
import { SwipeToAccept } from "./SwipeToAccept";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Order } from "@/lib/api/types";

function OrderSummary({ order, badge }: { order: Order; badge?: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Package className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate text-sm font-semibold">{order.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {order.origin} → {order.destination}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span>
            {order.weight} т · {order.volume} м³
          </span>
          {order.estimatedPrice != null && (
            <span>· {order.estimatedPrice.toLocaleString("ru-RU")} ₸</span>
          )}
          {badge}
        </div>
      </div>
    </div>
  );
}

function SwipeRow({
  order,
  onAccept,
  onDismiss,
}: {
  order: Order;
  onAccept: (o: Order) => void;
  onDismiss: (id: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-start justify-between gap-2">
        <OrderSummary order={order} />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => onDismiss(order.id)}
          aria-label={t("common.close")}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-3">
        <SwipeToAccept label={t("jetkiz.accept.swipe")} onAccept={() => onAccept(order)} />
      </div>
    </div>
  );
}

export function AcceptOrderNotification({
  queue,
  onAccept,
  onDismiss,
}: {
  queue: Order[];
  onAccept: (order: Order) => void;
  onDismiss: (id: string) => void;
}) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  if (queue.length === 0) return null;

  if (isMobile) {
    return (
      <div className="pointer-events-none fixed inset-x-0 top-14 z-[1200] flex flex-col gap-2 p-3">
        <AnimatePresence>
          {queue.slice(0, 3).map((order) => (
            <motion.div
              key={order.id}
              initial={{ y: -80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -80, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="pointer-events-auto"
            >
              <div className="rounded-xl border bg-card p-3 shadow-elevated">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-destructive" />
                  <span className="text-xs font-bold uppercase tracking-wider text-destructive">
                    {t("jetkiz.accept.title")}
                  </span>
                </div>
                <OrderSummary order={order} />
                <div className="mt-3">
                  <SwipeToAccept
                    label={t("jetkiz.accept.swipe")}
                    onAccept={() => onAccept(order)}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <Dialog open onOpenChange={(o) => !o && queue.forEach((q) => onDismiss(q.id))}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-destructive" />
            {t("jetkiz.accept.title")}
            <Badge variant="outline" className="ml-auto text-xs">
              {t("jetkiz.accept.newOrders", { count: queue.length })}
            </Badge>
          </DialogTitle>
          <DialogDescription />
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-3">
            {queue.map((order) => (
              <SwipeRow key={order.id} order={order} onAccept={onAccept} onDismiss={onDismiss} />
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
