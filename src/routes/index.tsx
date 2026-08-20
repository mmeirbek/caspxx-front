import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { requireAuth } from "@/lib/auth/guards";
import { useAuth } from "@/lib/auth/auth-provider";
import { getAccessToken } from "@/lib/auth/storage";
import { listMineOrders, listAvailableOrders } from "@/lib/api/orders";
import {
  listSuperadminUsers,
  listSuperadminCarriers,
  listSuperadminVehicles,
  listSuperadminOrders,
} from "@/lib/api/superadmin";
import { cn } from "@/lib/utils";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { JetkizHome } from "@/components/jetkiz/JetkizHome";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => requireAuth(context),
  component: HomePage,
});

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

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

function ClientDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const {
    data: mine,
    isLoading: mineLoading,
    isError: mineError,
    refetch,
  } = useQuery({
    queryKey: ["orders", "mine"],
    queryFn: () => listMineOrders(getAccessToken() ?? ""),
    enabled: !!user,
  });

  const { data: available } = useQuery({
    queryKey: ["orders", "available"],
    queryFn: () => listAvailableOrders(getAccessToken() ?? ""),
    enabled: !!user && user?.role === "CARRIER",
  });

  if (mineLoading) return <LoadingState />;
  if (mineError) return <ErrorState onRetry={() => void refetch()} />;

  const orders = mine?.orders ?? [];
  const active = orders.filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELLED");
  const availableCount = user?.role === "CARRIER" ? (available?.orders.length ?? 0) : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("dashboard.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={t("dashboard.kpi.myOrders")} value={orders.length} />
        <KpiCard label={t("dashboard.kpi.activeOrders")} value={active.length} />
        {availableCount !== undefined ? (
          <KpiCard label={t("orders.available")} value={availableCount} />
        ) : (
          <KpiCard label="—" value="—" />
        )}
        <div className="flex items-end justify-end">
          <Button asChild>
            <Link to="/orders/new">{t("orders.create")}</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.recentOrders")}</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("orders.empty")}</p>
          ) : (
            <ul className="divide-y">
              {orders.slice(0, 5).map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <Link
                      to="/orders/$orderId"
                      params={{ orderId: o.id }}
                      className="truncate font-medium hover:underline"
                    >
                      {o.title}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {o.origin} → {o.destination}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AdminDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const users = useQuery({
    queryKey: ["superadmin", "users"],
    queryFn: () => listSuperadminUsers(getAccessToken() ?? "", { limit: 1 }),
    enabled: !!user,
  });
  const carriers = useQuery({
    queryKey: ["superadmin", "carriers"],
    queryFn: () => listSuperadminCarriers(getAccessToken() ?? "", { limit: 1 }),
    enabled: !!user,
  });
  const vehicles = useQuery({
    queryKey: ["superadmin", "vehicles"],
    queryFn: () => listSuperadminVehicles(getAccessToken() ?? "", { limit: 1 }),
    enabled: !!user,
  });
  const orders = useQuery({
    queryKey: ["superadmin", "orders"],
    queryFn: () => listSuperadminOrders(getAccessToken() ?? "", { limit: 200 }),
    enabled: !!user,
  });

  if (users.isLoading || orders.isLoading) return <LoadingState />;
  if (users.isError || orders.isError) return <ErrorState onRetry={() => void refetchAll()} />;

  function refetchAll() {
    void users.refetch();
    void orders.refetch();
  }

  const allOrders = orders.data?.orders ?? [];
  const byStatus = new Map<string, number>();
  for (const o of allOrders) {
    byStatus.set(o.status, (byStatus.get(o.status) ?? 0) + 1);
  }
  const chartData = [...byStatus.entries()].map(([status, count]) => ({
    name: t(`orders.status.${status}`),
    count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("dashboard.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={t("superadmin.users")} value={users.data?.meta.total ?? 0} />
        <KpiCard label={t("superadmin.carriers")} value={carriers.data?.meta.total ?? 0} />
        <KpiCard label={t("superadmin.vehicles")} value={vehicles.data?.meta.total ?? 0} />
        <KpiCard label={t("superadmin.orders")} value={orders.data?.meta.total ?? 0} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.ordersByStatus")}</CardTitle>
          <CardDescription>{t("dashboard.ordersByStatusHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.recentOrders")}</CardTitle>
        </CardHeader>
        <CardContent>
          {allOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("orders.empty")}</p>
          ) : (
            <ul className="divide-y">
              {allOrders.slice(0, 8).map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <Link
                      to="/orders/$orderId"
                      params={{ orderId: o.id }}
                      className="truncate font-medium hover:underline"
                    >
                      {o.title}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {o.origin} → {o.destination}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function HomePage() {
  return <JetkizHome />;
}
