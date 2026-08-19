import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download, ArrowSquareOut, FileText } from "@phosphor-icons/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/PageHeader";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
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
import { apiRequest, apiRequestPaginated } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { Report, ReportDownload } from "@/lib/api/types";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import type { SupportedLanguage } from "@/lib/i18n/config";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Отчёты — Jol" },
      { name: "description", content: "Готовые PDF и XLSX отчёты о дорожной безопасности." },
    ],
  }),
  component: ReportsPage,
});

interface PreviewState {
  report: Report;
  link: ReportDownload;
}

function ReportsPage() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? "ru") as SupportedLanguage;
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["reports", "ready"],
    queryFn: ({ signal }) =>
      apiRequestPaginated<Report>(endpoints.reports.list, { query: { status: "READY" }, signal }),
    retry: 1,
  });

  async function openPreview(report: Report) {
    setLoadingId(report.id);
    try {
      const link = await apiRequest<ReportDownload>(endpoints.reports.download(report.id));
      setPreview({ report, link });
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoadingId(null);
    }
  }

  async function download(report: Report) {
    try {
      const link = await apiRequest<ReportDownload>(endpoints.reports.download(report.id));
      window.open(link.downloadUrl, "_blank", "noopener");
    } catch {
      toast.error(t("common.error"));
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6">
      <PageHeader title={t("reports.title")} subtitle={t("reports.subtitle")} />
      {q.isLoading && <LoadingState rows={6} />}
      {q.isError && <ApiErrorAlert error={q.error} onRetry={() => q.refetch()} />}
      {q.data && q.data.items.length === 0 && <EmptyState title={t("reports.empty")} />}
      {q.data && q.data.items.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {q.data.items.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-soft text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{r.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {r.format} · {t("reports.created")} {formatDate(r.createdAt, lang)}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {r.description ?? ""}
                    </p>
                    {r.includes.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {r.includes.map((inc) => (
                          <span
                            key={inc}
                            className="rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground"
                          >
                            {t(`adminData.reports.includeOptions.${inc}`)}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openPreview(r)}
                        disabled={loadingId === r.id}
                      >
                        {t("reports.preview")}
                      </Button>
                      <Button size="sm" onClick={() => download(r)} className="gap-1">
                        <Download className="h-4 w-4" /> {t("reports.download")}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-4xl">
          {preview && (
            <>
              <DialogHeader>
                <DialogTitle>{preview.report.title}</DialogTitle>
                <DialogDescription>
                  {preview.report.format} · {t("reports.created")}{" "}
                  {formatDate(preview.report.createdAt, lang)} · {t("reports.expiresAt")}{" "}
                  {formatDateTime(preview.link.expiresAt, lang)}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-2">
                {preview.report.format === "PDF" ? (
                  <iframe
                    src={preview.link.downloadUrl}
                    title={preview.report.title}
                    className="h-[65vh] w-full rounded-md border bg-muted"
                  />
                ) : (
                  <div className="rounded-md border bg-muted/40 p-6 text-sm">
                    <p className="mb-3 font-medium">{t("reports.xlsxNoPreview")}</p>
                    <p className="text-muted-foreground">{preview.report.description}</p>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:justify-between">
                <Button variant="outline" asChild>
                  <a
                    href={preview.link.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gap-1"
                  >
                    <ArrowSquareOut className="h-4 w-4" /> {t("reports.openNewTab")}
                  </a>
                </Button>
                <Button onClick={() => download(preview.report)} className="gap-1">
                  <Download className="h-4 w-4" /> {t("reports.download")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
