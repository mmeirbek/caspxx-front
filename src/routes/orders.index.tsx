import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { requireAuth } from "@/lib/auth/guards";
import { useAuth } from "@/lib/auth/auth-provider";
import { getAccessToken } from "@/lib/auth/storage";
import { listMineOrders, listAvailableOrders } from "@/lib/api/orders";
import { getCarrierProfile } from "@/lib/api/carrier";
import { cn } from "@/lib/utils";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/orders/")({
  beforeLoad: ({ context }) => requireAuth(context),
  component: OrdersPage,
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

function OrderCard({
  id,
  title,
  origin,
  destination,
  status,
}: {
  id: string;
  title: string;
  origin: string;
  destination: string;
  status: string;
}) {
  return (
    <Link to="/orders/$orderId" params={{ orderId: id }}>
      <Card className="transition hover:border-primary/50 hover:shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{title}</p>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {origin} → {destination}
              </p>
            </div>
            <StatusBadge status={status} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function OrdersList({ mode }: { mode: "mine" | "available" }) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["orders", mode],
    queryFn: () =>
      mode === "mine"
        ? listMineOrders(getAccessToken() ?? "")
        : listAvailableOrders(getAccessToken() ?? ""),
    enabled: !!user,
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;

  const orders = data?.orders ?? [];
  if (orders.length === 0) {
    return <EmptyState title={t("orders.empty")} />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {orders.map((o) => (
        <OrderCard
          key={o.id}
          id={o.id}
          title={o.title}
          origin={o.origin}
          destination={o.destination}
          status={o.status}
        />
      ))}
    </div>
  );
}

function OrdersPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isCarrier = user?.role === "CARRIER";
  const isClient = user?.role === "CLIENT";

  const { data: carrierProfile, isError: carrierError } = useQuery({
    queryKey: ["carrier", "profile"],
    queryFn: () => getCarrierProfile(getAccessToken() ?? ""),
    enabled: isCarrier,
    retry: 0,
  });

  const carrierNeedsProfile = isCarrier && (carrierError || !carrierProfile);
  const carrierPending =
    carrierProfile?.carrierProfile && !carrierProfile.carrierProfile.isApproved;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("orders.title")}</h1>
        </div>
        {isClient && (
          <Button asChild>
            <Link to="/orders/new">{t("orders.create")}</Link>
          </Button>
        )}
      </div>

      {carrierNeedsProfile && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm">{t("carrier.noProfile")}</p>
            <Button asChild size="sm">
              <Link to="/carrier/apply">{t("carrier.goToApply")}</Link>
            </Button>
          </CardContent>
        </Card>
      )}
      {carrierPending && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-4">
            <p className="text-sm">{t("carrier.pendingApproval")}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue={isCarrier ? "available" : "mine"}>
        <TabsList>
          <TabsTrigger value="mine">{t("orders.mine")}</TabsTrigger>
          {isCarrier && <TabsTrigger value="available">{t("orders.available")}</TabsTrigger>}
        </TabsList>
        <TabsContent value="mine" className="mt-4">
          <OrdersList mode="mine" />
        </TabsContent>
        {isCarrier && (
          <TabsContent value="available" className="mt-4">
            <OrdersList mode="available" />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
