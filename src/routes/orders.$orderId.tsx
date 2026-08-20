import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { requireAuth } from "@/lib/auth/guards";
import { useAuth } from "@/lib/auth/auth-provider";
import { getAccessToken } from "@/lib/auth/storage";
import { assignOrder, getOrder, updateOrderStatus } from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";
import type { Order, OrderStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/orders/$orderId")({
  beforeLoad: ({ context }) => requireAuth(context),
  component: OrderDetailPage,
});

function statusColor(status: string): string {
  switch (status) {
    case "DELIVERED":
      return "bg-emerald-100 text-emerald-700";
    case "CANCELLED":
      return "bg-destructive/10 text-destructive";
    case "IN_TRANSIT":
    case "PICKED_UP":
      return "bg-blue-100 text-blue-700";
    case "AT_CHECKPOINT":
      return "bg-amber-100 text-amber-700";
    case "NEW":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        statusColor(status),
      )}
    >
      {t(`orders.status.${status}`)}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value ?? "—"}</span>
    </div>
  );
}

function OrderDetailPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { orderId } = Route.useParams();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["orders", orderId],
    queryFn: () => getOrder(getAccessToken() ?? "", orderId),
    enabled: !!user,
  });

  const assign = useMutation({
    mutationFn: () => assignOrder(getAccessToken() ?? "", orderId),
    onSuccess: async (res) => {
      toast.success(t("orders.assignSuccess"));
      queryClient.setQueryData(["orders", orderId], res);
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : t("common.error")),
  });

  const setStatus = useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatus(getAccessToken() ?? "", orderId, status),
    onSuccess: async (res) => {
      toast.success(t("orders.statusUpdated"));
      queryClient.setQueryData(["orders", orderId], res);
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : t("common.error")),
  });

  if (isLoading) return <LoadingState />;
  if (isError || !data?.order) return <ErrorState onRetry={() => void refetch()} />;

  const order: Order = data.order;
  const isOwner = user?.id === order.clientId;
  const isCarrier = user?.role === "CARRIER";
  const isSuperadmin = user?.role === "SUPERADMIN";
  const canAssign = isCarrier && order.status === "SEARCHING";
  const isCancellable = isOwner && (order.status === "NEW" || order.status === "SEARCHING");
  const canMoveToInTransit =
    isCarrier &&
    (order.status === "ASSIGNED" ||
      order.status === "PICKED_UP" ||
      order.status === "AT_CHECKPOINT");
  const canDeliver =
    isCarrier && (order.status === "IN_TRANSIT" || order.status === "AT_CHECKPOINT");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to="/orders" className="text-sm text-muted-foreground hover:underline">
          ← {t("orders.title")}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{order.title}</h1>
        <div className="mt-2">
          <StatusBadge status={order.status} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("orders.details")}</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <InfoRow
            label={t("orders.fields.cargoType")}
            value={t(`orders.cargoTypes.${order.cargoType}`)}
          />
          <InfoRow label={t("orders.fields.weight")} value={`${order.weight} т`} />
          <InfoRow label={t("orders.fields.volume")} value={`${order.volume} м³`} />
          <InfoRow
            label={t("orders.fields.origin")}
            value={[order.origin, order.originCity, order.originCountry].filter(Boolean).join(", ")}
          />
          <InfoRow
            label={t("orders.fields.destination")}
            value={[order.destination, order.destinationCity, order.destinationCountry]
              .filter(Boolean)
              .join(", ")}
          />
          {order.comment && <InfoRow label={t("orders.fields.comment")} value={order.comment} />}
          {order.isReefer && (
            <InfoRow
              label={t("orders.fields.isReefer")}
              value={`${order.tempMin ?? "—"}°C … ${order.tempMax ?? "—"}°C`}
            />
          )}
          {order.estimatedPrice != null && (
            <InfoRow
              label={t("orders.fields.estimatedPrice")}
              value={order.estimatedPrice.toLocaleString("ru-RU")}
            />
          )}
          {order.estimatedDeliveryTime != null && (
            <InfoRow
              label={t("orders.fields.estimatedDeliveryTime")}
              value={`${order.estimatedDeliveryTime}`}
            />
          )}
          <InfoRow
            label={t("orders.createdAt")}
            value={new Date(order.createdAt).toLocaleString()}
          />
        </CardContent>
      </Card>

      {(canAssign || canMoveToInTransit || canDeliver || isCancellable) && (
        <Card>
          <CardHeader>
            <CardTitle>{t("orders.actions")}</CardTitle>
            <CardDescription>{t("orders.actionsHint")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {canAssign && (
              <Button onClick={() => assign.mutate()} disabled={assign.isPending}>
                {t("orders.assign")}
              </Button>
            )}
            {canMoveToInTransit && (
              <Button onClick={() => setStatus.mutate("IN_TRANSIT")} disabled={setStatus.isPending}>
                {t("orders.setInTransit")}
              </Button>
            )}
            {canDeliver && (
              <Button onClick={() => setStatus.mutate("DELIVERED")} disabled={setStatus.isPending}>
                {t("orders.setDelivered")}
              </Button>
            )}
            {isCancellable && (
              <Button
                variant="destructive"
                onClick={() => setStatus.mutate("CANCELLED")}
                disabled={setStatus.isPending}
              >
                {t("orders.cancelOrder")}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("orders.routeConditions")}</CardTitle>
          <CardDescription>{t("orders.routeConditionsHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to="/route-conditions/$orderId" params={{ orderId }}>
              {t("orders.viewRouteConditions")}
            </Link>
          </Button>
        </CardContent>
      </Card>

      {isSuperadmin && (
        <p className="text-sm text-muted-foreground">{t("superadmin.adminOnlyHint")}</p>
      )}
    </div>
  );
}
