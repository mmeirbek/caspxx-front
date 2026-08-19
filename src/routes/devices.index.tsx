import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, PencilSimple, Trash, Warning } from "@phosphor-icons/react";

import { requireAuth } from "@/lib/auth/guards";
import { useAuth } from "@/lib/auth/auth-provider";
import { getAccessToken } from "@/lib/auth/storage";
import {
  bindDeviceVehicle,
  createDevice,
  deleteDevice,
  listDevices,
  rotateDeviceSecret,
} from "@/lib/api/devices";
import { listVehicles } from "@/lib/api/vehicles";
import { lastTelemetryForDevice } from "@/lib/api/telemetry";
import type { Device } from "@/lib/api/types";
import type { SupportedLanguage } from "@/lib/i18n/config";
import { formatRelative } from "@/lib/utils/format";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/devices/")({
  beforeLoad: ({ context }) => requireAuth(context),
  component: DevicesPage,
});

function statusColor(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-700";
    case "SUSPENDED":
      return "bg-amber-100 text-amber-700";
    case "RETIRED":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function DeviceActions({
  device,
  vehicles,
}: {
  device: Device;
  vehicles: { id: string; label: string }[];
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [attachOpen, setAttachOpen] = useState(false);
  const [secretOpen, setSecretOpen] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState<string>("");

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["devices"] });
  };

  const attachMutation = useMutation({
    mutationFn: (payload: { vehicleId?: string | null }) =>
      bindDeviceVehicle(getAccessToken() ?? "", device.id, payload),
    onSuccess: () => {
      setAttachOpen(false);
      toast.success(t("common.updated"));
      invalidate();
    },
    onError: () => toast.error(t("common.error")),
  });

  const rotateMutation = useMutation({
    mutationFn: () => rotateDeviceSecret(getAccessToken() ?? "", device.id),
    onSuccess: (data) => {
      setSecret(data.secret);
      setSecretOpen(true);
      invalidate();
    },
    onError: () => toast.error(t("common.error")),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteDevice(getAccessToken() ?? "", device.id),
    onSuccess: () => {
      toast.success(t("common.updated"));
      invalidate();
    },
    onError: () => toast.error(t("common.error")),
  });

  const isCarrier = user?.role === "CARRIER";
  const isSuperadmin = user?.role === "SUPERADMIN";
  if (!isCarrier && !isSuperadmin) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {isCarrier && vehicles.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setVehicleId(device.vehicleId ?? "");
            setAttachOpen(true);
          }}
        >
          <PencilSimple className="mr-1 h-4 w-4" />
          {t("devices.attachVehicle")}
        </Button>
      )}
      {isCarrier && (
        <Button variant="outline" size="sm" onClick={() => rotateMutation.mutate()}>
          {t("devices.rotateSecret")}
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate()}>
        <Trash className="h-4 w-4 text-destructive" />
      </Button>

      <Dialog open={attachOpen} onOpenChange={setAttachOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("devices.attachVehicle")}</DialogTitle>
            <DialogDescription>{device.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>{t("devices.fields.vehicleId")}</Label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttachOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => attachMutation.mutate(vehicleId ? { vehicleId } : { vehicleId: null })}
              disabled={attachMutation.isPending}
            >
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={secretOpen} onOpenChange={setSecretOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("devices.secretTitle")}</DialogTitle>
            <DialogDescription>{t("devices.secretHint")}</DialogDescription>
          </DialogHeader>
          {secret && <pre className="rounded-md bg-muted p-3 text-sm break-all">{secret}</pre>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DeviceCard({
  device,
  vehicles,
}: {
  device: Device;
  vehicles: { id: string; label: string }[];
}) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? "ru") as SupportedLanguage;

  const { data: last } = useQuery({
    queryKey: ["devices", device.id, "last-telemetry"],
    queryFn: () => lastTelemetryForDevice(getAccessToken() ?? "", device.id),
    refetchInterval: 15000,
  });

  const telemetry = last?.telemetry;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to="/devices/$deviceId"
              params={{ deviceId: device.id }}
              className="font-medium hover:underline"
            >
              {device.name}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  statusColor(device.status),
                )}
              >
                {t(`devices.status.${device.status}`)}
              </span>
              <Badge variant="outline" className="text-xs">
                {device.vehicleId ? t("devices.boundTo") : t("devices.noVehicle")}
              </Badge>
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-1 text-sm text-muted-foreground">
          <p>
            {t("devices.lastSeen")}:{" "}
            {device.lastSeenAt ? formatRelative(device.lastSeenAt, lang) : t("devices.neverSeen")}
          </p>
          {telemetry && (
            <p>
              {t("telemetry.temperature")}: {telemetry.temperature?.toFixed(1) ?? "—"}°C ·{" "}
              {t("telemetry.battery")}: {telemetry.battery?.toFixed(0) ?? "—"}% ·{" "}
              {t("telemetry.speed")}: {telemetry.speedKmh?.toFixed(0) ?? "—"} km/h
            </p>
          )}
        </div>

        <div className="mt-3">
          <DeviceActions device={device} vehicles={vehicles} />
        </div>
      </CardContent>
    </Card>
  );
}

function DevicesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [secret, setSecret] = useState<string | null>(null);

  const isCarrier = user?.role === "CARRIER";
  const isSuperadmin = user?.role === "SUPERADMIN";
  const canManage = isCarrier || isSuperadmin;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["devices"],
    queryFn: () => listDevices(getAccessToken() ?? ""),
    enabled: canManage,
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => listVehicles(getAccessToken() ?? ""),
    enabled: isCarrier,
    retry: 0,
  });

  const vehicles = useMemo(
    () =>
      (vehiclesData?.vehicles ?? []).map((v) => ({
        id: v.id,
        label: `${v.brand} ${v.model} (${v.plateNumber})`,
      })),
    [vehiclesData],
  );

  const createMutation = useMutation({
    mutationFn: (deviceName: string) => createDevice(getAccessToken() ?? "", { name: deviceName }),
    onSuccess: (data) => {
      setCreateOpen(false);
      setName("");
      setSecret(data.secret);
      void queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
    onError: () => toast.error(t("common.error")),
  });

  if (!canManage) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t("devices.title")}</h1>
        <EmptyState title={t("common.noBackend")} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("devices.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("devices.subtitle")}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          {t("devices.create")}
        </Button>
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState onRetry={() => void refetch()} />}
      {!isLoading && !isError && (data?.devices.length ?? 0) === 0 && (
        <EmptyState title={t("devices.empty")} />
      )}
      {!isLoading && !isError && (data?.devices.length ?? 0) > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data!.devices.map((device) => (
            <DeviceCard key={device.id} device={device} vehicles={vehicles} />
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("devices.create")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="device-name">{t("devices.fields.name")}</Label>
            <Input id="device-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => createMutation.mutate(name.trim())}
              disabled={createMutation.isPending || !name.trim()}
            >
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!secret} onOpenChange={(open) => !open && setSecret(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("devices.secretTitle")}</DialogTitle>
            <DialogDescription>{t("devices.secretHint")}</DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            <Warning className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t("devices.secretHint")}</span>
          </div>
          {secret && <pre className="rounded-md bg-muted p-3 text-sm break-all">{secret}</pre>}
          <DialogFooter>
            <Button onClick={() => setSecret(null)}>{t("common.close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
