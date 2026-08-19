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
import type { AuditEvent } from "@/lib/api/types";
import { formatDateTime } from "@/lib/utils/format";
import type { SupportedLanguage } from "@/lib/i18n/config";

export const Route = createFileRoute("/admin/history")({
  head: () => ({ meta: [{ name: "robots", content: "noindex" }, { title: "History — Jol" }] }),
  component: () => (
    <AdminModuleGate module="history">
      <History />
    </AdminModuleGate>
  ),
});

function History() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? "ru") as SupportedLanguage;
  const token = getModuleToken("history");
  const q = useQuery({
    queryKey: ["admin", "audit"],
    queryFn: ({ signal }) =>
      apiRequestPaginated<AuditEvent>(endpoints.audit, { auth: token, signal }),
    retry: 1,
  });

  if (q.isLoading) return <LoadingState rows={8} />;
  if (q.isError) return <ApiErrorAlert error={q.error} onRetry={() => q.refetch()} />;
  const items = q.data?.items ?? [];
  if (items.length === 0) return <EmptyState />;

  return (
    <Card>
      <CardContent className="p-0">
        <ol className="divide-y">
          {items.map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-4 p-4">
              <div>
                <p className="text-sm font-semibold">{e.eventType.replaceAll("_", " ")}</p>
                <p className="text-xs text-muted-foreground">
                  {e.resourceType} · {e.resourceId.slice(0, 8)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {formatDateTime(e.createdAt, lang)}
                </p>
              </div>
              <span
                className={
                  "rounded-full px-2 py-0.5 text-xs font-semibold " +
                  (e.status === "SUCCEEDED"
                    ? "bg-risk-low/15 text-risk-low"
                    : e.status === "FAILED"
                      ? "bg-destructive/15 text-destructive"
                      : "bg-muted")
                }
              >
                {e.status}
              </span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
