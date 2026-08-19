import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";

import { requireAuth } from "@/lib/auth/guards";
import { useAuth } from "@/lib/auth/auth-provider";
import { getAccessToken } from "@/lib/auth/storage";
import {
  acknowledgeAlert,
  createAlertRule,
  deleteAlertRule,
  listAlertRules,
  listAlerts,
  resolveAlert,
} from "@/lib/api/alerts";
import type { AlertRule, RuleOperator, TelemetryMetric } from "@/lib/api/types";
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

export const Route = createFileRoute("/alerts/")({
  beforeLoad: ({ context }) => requireAuth(context),
  component: AlertsPage,
});

const METRICS: TelemetryMetric[] = ["TEMPERATURE", "HUMIDITY", "BATTERY", "SPEED"];
const OPERATORS: RuleOperator[] = ["GT", "GTE", "LT", "LTE"];

function severityColor(severity: string): string {
  return severity === "CRITICAL" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700";
}

function statusColor(status: string): string {
  switch (status) {
    case "OPEN":
      return "bg-red-100 text-red-700";
    case "ACKNOWLEDGED":
      return "bg-blue-100 text-blue-700";
    case "RESOLVED":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function AlertsList({ status }: { status?: string }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canMutate = user?.role === "SUPERADMIN" || user?.role === "CARRIER";

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["alerts", status ?? "all"],
    queryFn: () =>
      listAlerts(getAccessToken() ?? "", {
        ...(status ? { status: status as "OPEN" | "ACKNOWLEDGED" | "RESOLVED" } : {}),
        take: 100,
      }),
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => acknowledgeAlert(getAccessToken() ?? "", id),
    onSuccess: () => {
      toast.success(t("common.updated"));
      void queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: () => toast.error(t("common.error")),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => resolveAlert(getAccessToken() ?? "", id),
    onSuccess: () => {
      toast.success(t("common.updated"));
      void queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: () => toast.error(t("common.error")),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;

  const alerts = data?.alerts ?? [];
  if (alerts.length === 0) return <EmptyState title={t("alerts.empty")} />;

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <Card key={alert.id}>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      severityColor(alert.severity),
                    )}
                  >
                    {t(`alerts.severity.${alert.severity}`)}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      statusColor(alert.status),
                    )}
                  >
                    {t(`alerts.status.${alert.status}`)}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {t(`alerts.metric.${alert.metric}`)} · {alert.value}
                  </Badge>
                </div>
                <p className="text-sm">{alert.message}</p>
                <p className="text-xs text-muted-foreground">
                  {alert.deviceId} · {new Date(alert.createdAt).toLocaleString()}
                </p>
              </div>
              {canMutate && alert.status !== "RESOLVED" && (
                <div className="flex gap-2">
                  {alert.status === "OPEN" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => acknowledgeMutation.mutate(alert.id)}
                      disabled={acknowledgeMutation.isPending}
                    >
                      {t("alerts.acknowledge")}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => resolveMutation.mutate(alert.id)}
                    disabled={resolveMutation.isPending}
                  >
                    {t("alerts.resolve")}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RuleRow({ rule }: { rule: AlertRule }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteAlertRule(getAccessToken() ?? "", rule.id),
    onSuccess: () => {
      toast.success(t("common.updated"));
      void queryClient.invalidateQueries({ queryKey: ["alerts", "rules"] });
    },
    onError: () => toast.error(t("common.error")),
  });

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <div className="min-w-0 space-y-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">
            {t(`alerts.metric.${rule.metric}`)} {t(`alerts.operator.${rule.operator}`)}{" "}
            {rule.threshold}
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              severityColor(rule.severity),
            )}
          >
            {t(`alerts.severity.${rule.severity}`)}
          </span>
          {!rule.isActive && (
            <Badge variant="secondary" className="text-xs">
              OFF
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{rule.id}</p>
      </div>
      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate()}>
        <Trash className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

function RulesTab() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [metric, setMetric] = useState<TelemetryMetric>("TEMPERATURE");
  const [operator, setOperator] = useState<RuleOperator>("GT");
  const [threshold, setThreshold] = useState("24");
  const [severity, setSeverity] = useState("WARNING");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["alerts", "rules"],
    queryFn: () => listAlertRules(getAccessToken() ?? ""),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createAlertRule(getAccessToken() ?? "", {
        metric,
        operator,
        threshold: Number(threshold),
        severity: severity as "WARNING" | "CRITICAL",
      }),
    onSuccess: () => {
      setOpen(false);
      toast.success(t("common.updated"));
      void refetch();
    },
    onError: () => toast.error(t("common.error")),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          {t("alerts.createRule")}
        </Button>
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState onRetry={() => void refetch()} />}
      {!isLoading && !isError && (data?.rules.length ?? 0) === 0 && (
        <EmptyState title={t("alerts.empty")} />
      )}
      {!isLoading && !isError && (data?.rules.length ?? 0) > 0 && (
        <div className="space-y-2">
          {data!.rules.map((rule) => (
            <RuleRow key={rule.id} rule={rule} />
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("alerts.createRule")}</DialogTitle>
            <DialogDescription>{t("alerts.rulesHint")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("alerts.metricLabel")}</Label>
              <Select value={metric} onValueChange={(v) => setMetric(v as TelemetryMetric)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METRICS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {t(`alerts.metric.${m}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("alerts.operatorLabel")}</Label>
                <Select value={operator} onValueChange={(v) => setOperator(v as RuleOperator)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map((op) => (
                      <SelectItem key={op} value={op}>
                        {t(`alerts.operator.${op}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("alerts.thresholdLabel")}</Label>
                <Input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("alerts.severityLabel")}</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WARNING">{t("alerts.severity.WARNING")}</SelectItem>
                  <SelectItem value="CRITICAL">{t("alerts.severity.CRITICAL")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !Number.isFinite(Number(threshold))}
            >
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AlertsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canManageRules = user?.role === "SUPERADMIN" || user?.role === "CARRIER";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("alerts.title")}</h1>
      </div>

      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">{t("alerts.status.OPEN")}</TabsTrigger>
          <TabsTrigger value="acknowledged">{t("alerts.status.ACKNOWLEDGED")}</TabsTrigger>
          <TabsTrigger value="resolved">{t("alerts.status.RESOLVED")}</TabsTrigger>
          <TabsTrigger value="all">{t("common.all")}</TabsTrigger>
          {canManageRules && <TabsTrigger value="rules">{t("alerts.rules")}</TabsTrigger>}
        </TabsList>
        <TabsContent value="open" className="mt-4">
          <AlertsList status="OPEN" />
        </TabsContent>
        <TabsContent value="acknowledged" className="mt-4">
          <AlertsList status="ACKNOWLEDGED" />
        </TabsContent>
        <TabsContent value="resolved" className="mt-4">
          <AlertsList status="RESOLVED" />
        </TabsContent>
        <TabsContent value="all" className="mt-4">
          <AlertsList />
        </TabsContent>
        {canManageRules && (
          <TabsContent value="rules" className="mt-4">
            <RulesTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
