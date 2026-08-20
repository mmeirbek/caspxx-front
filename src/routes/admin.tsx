import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";

import { requireAuth } from "@/lib/auth/guards";
import { useAuth } from "@/lib/auth/auth-provider";
import { getAccessToken } from "@/lib/auth/storage";
import {
  createSuperadminUser,
  deleteSuperadminOrder,
  listSuperadminCarriers,
  listSuperadminOrders,
  listSuperadminUsers,
  listSuperadminVehicles,
  resetUserPassword,
  setCarrierApproval,
  updateUserRole,
  updateUserStatus,
  type CarrierItem,
  type PaginationMeta,
  type SuperadminUser,
  type SuperadminVehicle,
} from "@/lib/api/superadmin";
import type { Order, UserRole } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AnalyticsTab } from "@/components/analytics/AnalyticsTab";

export const Route = createFileRoute("/admin")({
  beforeLoad: ({ context }) => requireAuth(context),
  component: AdminPage,
});

const USER_ROLES: UserRole[] = ["CLIENT", "CARRIER", "ADMIN", "SUPERADMIN"];

function Pagination({
  meta,
  onPage,
}: {
  meta: PaginationMeta | undefined;
  onPage: (page: number) => void;
}) {
  if (!meta || meta.pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <Button
        variant="outline"
        size="sm"
        disabled={meta.page <= 1}
        onClick={() => onPage(meta.page - 1)}
      >
        ←
      </Button>
      <span className="text-sm text-muted-foreground">
        {meta.page} / {meta.pages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={meta.page >= meta.pages}
        onClick={() => onPage(meta.page + 1)}
      >
        →
      </Button>
    </div>
  );
}

function UsersTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [passwordOpenFor, setPasswordOpenFor] = useState<SuperadminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "CLIENT" as UserRole,
    firstName: "",
    lastName: "",
    phone: "",
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["superadmin", "users", page, search],
    queryFn: () =>
      listSuperadminUsers(getAccessToken() ?? "", {
        page,
        limit: 10,
        ...(search ? { search } : {}),
      }),
  });

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ["superadmin", "users"] });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      updateUserRole(getAccessToken() ?? "", id, role),
    onSuccess: () => {
      toast.success(t("common.updated"));
      invalidate();
    },
    onError: () => toast.error(t("common.error")),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateUserStatus(getAccessToken() ?? "", id, isActive),
    onSuccess: () => {
      toast.success(t("common.updated"));
      invalidate();
    },
    onError: () => toast.error(t("common.error")),
  });

  const passwordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      resetUserPassword(getAccessToken() ?? "", id, password),
    onSuccess: () => {
      setPasswordOpenFor(null);
      setNewPassword("");
      toast.success(t("common.updated"));
    },
    onError: () => toast.error(t("common.error")),
  });

  const createMutation = useMutation({
    mutationFn: () => createSuperadminUser(getAccessToken() ?? "", form),
    onSuccess: () => {
      setCreateOpen(false);
      setForm({ email: "", password: "", role: "CLIENT", firstName: "", lastName: "", phone: "" });
      toast.success(t("common.updated"));
      invalidate();
    },
    onError: () => toast.error(t("common.error")),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;

  const users = data?.users ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          className="max-w-xs"
          placeholder={t("superadmin.fields.email")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          {t("superadmin.createUser")}
        </Button>
      </div>

      {users.length === 0 && <EmptyState title={t("superadmin.empty")} />}

      <div className="space-y-2">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  {user.email} · {user.phone}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="outline">{t(`superadmin.role.${user.role}`)}</Badge>
                  <Badge
                    className={cn(
                      user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700",
                    )}
                  >
                    {t(`superadmin.userStatus.${user.isActive ? "ACTIVE" : "SUSPENDED"}`)}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={user.role}
                  onValueChange={(v) => roleMutation.mutate({ id: user.id, role: v as UserRole })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {t(`superadmin.role.${r}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => statusMutation.mutate({ id: user.id, isActive: !user.isActive })}
                >
                  {t("superadmin.fields.changeStatus")}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPasswordOpenFor(user)}>
                  {t("superadmin.fields.resetPassword")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Pagination meta={data?.meta} onPage={setPage} />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("superadmin.createUser")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>{t("superadmin.fields.email")}</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("superadmin.fields.password")}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("superadmin.fields.firstName")}</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("superadmin.fields.lastName")}</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("superadmin.fields.phone")}</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("superadmin.fields.role")}</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v as UserRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {t(`superadmin.role.${r}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !form.email || !form.password}
            >
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!passwordOpenFor} onOpenChange={(o) => !o && setPasswordOpenFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("superadmin.fields.resetPassword")}</DialogTitle>
            <DialogDescription>{passwordOpenFor?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{t("superadmin.fields.password")}</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordOpenFor(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() =>
                passwordOpenFor &&
                passwordMutation.mutate({ id: passwordOpenFor.id, password: newPassword })
              }
              disabled={passwordMutation.isPending || !newPassword}
            >
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CarriersTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["superadmin", "carriers", page],
    queryFn: () => listSuperadminCarriers(getAccessToken() ?? "", { page, limit: 10 }),
  });

  const approvalMutation = useMutation({
    mutationFn: ({ id, isApproved }: { id: string; isApproved: boolean }) =>
      setCarrierApproval(getAccessToken() ?? "", id, isApproved),
    onSuccess: () => {
      toast.success(t("common.updated"));
      void queryClient.invalidateQueries({ queryKey: ["superadmin", "carriers"] });
    },
    onError: () => toast.error(t("common.error")),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;

  const carriers = data?.carriers ?? [];

  return (
    <div className="space-y-4">
      {carriers.length === 0 && <EmptyState title={t("superadmin.empty")} />}
      <div className="space-y-2">
        {carriers.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0 space-y-1">
                <p className="font-medium">
                  {[c.user.firstName, c.user.lastName].filter(Boolean).join(" ") || c.user.email}
                </p>
                <p className="text-sm text-muted-foreground">{c.user.email}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{c.transportType ?? "—"}</Badge>
                  <Badge variant="outline">
                    {t("superadmin.fields.experience")}: {c.experienceYears ?? 0}
                  </Badge>
                  <Badge variant="outline">
                    {t("superadmin.vehicles")}: {c.vehiclesCount}
                  </Badge>
                  <Badge
                    className={cn(
                      c.isApproved
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700",
                    )}
                  >
                    {c.isApproved
                      ? t("superadmin.userStatus.ACTIVE")
                      : t("superadmin.pendingApproval")}
                  </Badge>
                </div>
                {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}
              </div>
              <Button
                variant={c.isApproved ? "outline" : "default"}
                size="sm"
                onClick={() => approvalMutation.mutate({ id: c.id, isApproved: !c.isApproved })}
                disabled={approvalMutation.isPending}
              >
                {c.isApproved ? t("superadmin.revoke") : t("superadmin.approve")}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <Pagination meta={data?.meta} onPage={setPage} />
    </div>
  );
}

function VehiclesTab() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["superadmin", "vehicles", page],
    queryFn: () => listSuperadminVehicles(getAccessToken() ?? "", { page, limit: 10 }),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;

  const vehicles = data?.vehicles ?? [];

  return (
    <div className="space-y-4">
      {vehicles.length === 0 && <EmptyState title={t("superadmin.empty")} />}
      <div className="space-y-2">
        {vehicles.map((v: SuperadminVehicle) => (
          <Card key={v.id}>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {v.brand} {v.model} · {v.year}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {v.plateNumber} · {t("superadmin.vehicles")}: {v.type}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {v.carrierFirstName} {v.carrierLastName} ({v.carrierEmail})
                  </p>
                </div>
                <Badge variant="outline">
                  {v.capacityTons} t · {v.cargoVolume} m³
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Pagination meta={data?.meta} onPage={setPage} />
    </div>
  );
}

function OrdersTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["superadmin", "orders", page],
    queryFn: () => listSuperadminOrders(getAccessToken() ?? "", { page, limit: 10 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSuperadminOrder(getAccessToken() ?? "", id),
    onSuccess: () => {
      toast.success(t("common.updated"));
      void queryClient.invalidateQueries({ queryKey: ["superadmin", "orders"] });
    },
    onError: () => toast.error(t("common.error")),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;

  const orders = data?.orders ?? [];

  return (
    <div className="space-y-4">
      {orders.length === 0 && <EmptyState title={t("superadmin.empty")} />}
      <div className="space-y-2">
        {orders.map((o: Order) => (
          <Card key={o.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <Link
                  to="/orders/$orderId"
                  params={{ orderId: o.id }}
                  className="font-medium hover:underline"
                >
                  {o.title}
                </Link>
                <p className="truncate text-sm text-muted-foreground">
                  {o.origin} → {o.destination}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{t(`orders.status.${o.status}`)}</Badge>
                <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(o.id)}>
                  <Trash className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Pagination meta={data?.meta} onPage={setPage} />
    </div>
  );
}

function AdminPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === "SUPERADMIN" || user?.role === "ADMIN";

  if (!isAdmin) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight">{t("superadmin.title")}</h1>
        <EmptyState title={t("superadmin.noAccess")} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("superadmin.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("superadmin.adminOnlyHint")}</p>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="flex-wrap">
          <TabsTrigger value="users">{t("superadmin.users")}</TabsTrigger>
          <TabsTrigger value="carriers">{t("superadmin.carriers")}</TabsTrigger>
          <TabsTrigger value="vehicles">{t("superadmin.vehicles")}</TabsTrigger>
          <TabsTrigger value="orders">{t("superadmin.orders")}</TabsTrigger>
          <TabsTrigger value="analytics">{t("nav.analytics")}</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4">
          <UsersTab />
        </TabsContent>
        <TabsContent value="carriers" className="mt-4">
          <CarriersTab />
        </TabsContent>
        <TabsContent value="vehicles" className="mt-4">
          <VehiclesTab />
        </TabsContent>
        <TabsContent value="orders" className="mt-4">
          <OrdersTab />
        </TabsContent>
        <TabsContent value="analytics" className="mt-4">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
