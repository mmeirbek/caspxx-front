import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { Card, CardContent } from "@/components/ui/card";
import { AdminModuleGate } from "@/features/module-access/AdminModuleGate";
import { getModuleToken } from "@/features/module-access/store";
import { apiRequestPaginated } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { ModelVersion } from "@/lib/api/types";
import { formatDateTime } from "@/lib/utils/format";
import type { SupportedLanguage } from "@/lib/i18n/config";

export const Route = createFileRoute("/admin/model-registry")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex" }, { title: "Model registry — Jol" }],
  }),
  component: () => (
    <AdminModuleGate module="model-registry">
      <Registry />
    </AdminModuleGate>
  ),
});

function Registry() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? "ru") as SupportedLanguage;
  const token = getModuleToken("model-registry");
  const q = useQuery({
    queryKey: ["admin", "models"],
    queryFn: ({ signal }) =>
      apiRequestPaginated<ModelVersion>(endpoints.models.list, { auth: token, signal }),
    retry: 1,
  });

  if (q.isLoading) return <LoadingState rows={6} />;
  if (q.isError) return <ApiErrorAlert error={q.error} onRetry={() => q.refetch()} />;
  const items = q.data?.items ?? [];
  if (items.length === 0) return <EmptyState />;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((m) => (
        <Card key={m.id} className={m.isActive ? "border-primary" : ""}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">CatBoost · v{m.id.slice(0, 8)}</p>
                <p className="text-xs text-muted-foreground">
                  {t("registry.trainedAt")}: {formatDateTime(m.trainedAt, lang)}
                </p>
              </div>
              {m.isActive && (
                <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
                  {t("registry.activeModel")}
                </span>
              )}
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <Metric label="Precision" value={m.metrics.precision} />
              <Metric label="Recall" value={m.metrics.recall} />
              <Metric label="F1" value={m.metrics.f1} />
              <Metric label="ROC-AUC" value={m.metrics.rocAuc} />
              <Metric label="PR-AUC" value={m.metrics.prAuc} />
              <Metric label="Calib." value={m.metrics.calibrationError} />
            </dl>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-muted px-2 py-1">
      <dt className="text-[10px] uppercase text-muted-foreground">{label}</dt>
      <dd className="font-semibold">{(value * 100).toFixed(1)}%</dd>
    </div>
  );
}
