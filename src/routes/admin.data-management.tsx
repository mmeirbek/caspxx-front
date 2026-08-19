import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowSquareOut,
  CircleNotch,
  Download,
  FilePlus,
  FileText,
  MapTrifold,
  PlayCircle,
  Sparkle,
  Warning,
} from "@phosphor-icons/react";

import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminModuleGate } from "@/features/module-access/AdminModuleGate";
import { getModuleToken } from "@/features/module-access/store";
import { apiRequest, apiRequestPaginated } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type {
  CreatePredictionInput,
  CreateReportInput,
  CreateTrainingRunInput,
  DetectHotspotsInput,
  LiveConfirmedEvent,
  Report,
  ReportDownload,
  ReportFormat,
  QueuedOperation,
  QueuedPrediction,
  QueuedReport,
  TrainingRun,
} from "@/lib/api/types";

import { formatDateTime } from "@/lib/utils/format";
import type { SupportedLanguage } from "@/lib/i18n/config";

export const Route = createFileRoute("/admin/data-management")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex" }, { title: "Data management — Jol" }],
  }),
  component: () => (
    <AdminModuleGate module="data-management">
      <DataManagement />
    </AdminModuleGate>
  ),
});

function DataManagement() {
  const { t } = useTranslation();
  const token = getModuleToken("data-management");
  const [snapshotId, setSnapshotId] = useState("");
  const [trainingRunId, setTrainingRunId] = useState<string | null>(null);

  const live = useQuery({
    queryKey: ["admin", "live-events-for-training"],
    queryFn: ({ signal }) =>
      apiRequestPaginated<LiveConfirmedEvent>(endpoints.liveEvents.list, {
        query: { limit: 1 },
        signal,
      }),
    retry: 1,
  });

  const trainingRun = useQuery({
    queryKey: ["admin", "training-run", trainingRunId],
    queryFn: ({ signal }) =>
      apiRequest<TrainingRun>(endpoints.training.run(trainingRunId!), { auth: token, signal }),
    enabled: Boolean(trainingRunId),
    refetchInterval: (query) =>
      query.state.data && ["SUCCEEDED", "FAILED"].includes(query.state.data.status) ? false : 5000,
    retry: 1,
  });

  const startTraining = useMutation({
    mutationFn: () =>
      apiRequest<{ trainingRunId: string; status: "QUEUED" }>(endpoints.training.runs, {
        method: "POST",
        auth: token,
        idempotent: true,
        body: {
          baseDatasetSnapshotId: snapshotId.trim(),
          includeConfirmedEventsUntil: new Date().toISOString(),
        } satisfies CreateTrainingRunInput,
      }),
    onSuccess: (run) => {
      setTrainingRunId(run.trainingRunId);
      toast.success(t("training.status.QUEUED"));
    },
    onError: (err) => toast.error((err as Error).message),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-5">
          <p className="text-xs text-muted-foreground">{t("training.seedNote")}</p>

          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-xs text-muted-foreground">
                {t("training.confirmedEventsForTraining")}
              </p>
              <p className="text-2xl font-semibold">{live.data?.meta.total ?? "—"}</p>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Input
                value={snapshotId}
                onChange={(event) => setSnapshotId(event.target.value)}
                placeholder="UUID dataset snapshot"
                aria-label="UUID dataset snapshot"
                className="w-64"
              />
              <Button
                onClick={() => startTraining.mutate()}
                disabled={startTraining.isPending || snapshotId.trim().length === 0}
                className="gap-2"
              >
                <PlayCircle className="h-4 w-4" />
                {t("training.startTraining")}
              </Button>
            </div>
          </div>
          {snapshotId.trim() && (
            <p className="text-xs text-muted-foreground">
              <Trans
                i18nKey="adminData.training.snapshotInfo"
                values={{ id: snapshotId }}
                components={{ code: <code /> }}
              />
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <HotspotDetectCard token={token} />
        <PredictionCard token={token} />
      </div>

      <ReportCard token={token} />

      {trainingRunId && (
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-3 text-sm font-semibold">Training run</h2>
            {trainingRun.isLoading && <LoadingState rows={2} />}
            {trainingRun.isError && (
              <ApiErrorAlert error={trainingRun.error} onRetry={() => trainingRun.refetch()} />
            )}
            {trainingRun.data && (
              <p className="text-sm">
                #{trainingRun.data.id.slice(0, 8)} ·{" "}
                {t(`training.status.${trainingRun.data.status}`)}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function HotspotDetectCard({ token }: { token: string | null }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [days, setDays] = useState(90);

  const detect = useMutation({
    mutationFn: () => {
      const endAt = new Date();
      const startAt = new Date(endAt.getTime() - days * 24 * 60 * 60 * 1000);
      return apiRequest<QueuedOperation>(endpoints.hotspots.detect, {
        method: "POST",
        auth: token,
        idempotent: true,
        body: {
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
        } satisfies DetectHotspotsInput,
      });
    },
    onSuccess: (operation) => {
      toast.success(
        t("adminData.hotspotDetect.queued", { id: operation.operationId.slice(0, 8) }),
      );
      void qc.invalidateQueries({ queryKey: ["hotspots"] });
      void qc.invalidateQueries({ queryKey: ["app"] });
    },
    onError: (err) => toast.error((err as Error).message),
  });

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <MapTrifold className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{t("adminData.hotspotDetect.title")}</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          <Trans
            i18nKey="adminData.hotspotDetect.description"
            components={{ code: <code /> }}
          />
        </p>
        <div className="flex gap-2">
          <Input
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))}
            className="w-24"
            aria-label={t("adminData.hotspotDetect.daysLabel")}
          />
          <span className="self-center text-xs text-muted-foreground">
            {t("adminData.hotspotDetect.daysLabel")}
          </span>
        </div>
        <Button
          onClick={() => detect.mutate()}
          disabled={detect.isPending}
          className="w-full gap-2"
        >
          <MapTrifold className="h-4 w-4" />
          {detect.isPending
            ? t("adminData.hotspotDetect.buttonRunning")
            : t("adminData.hotspotDetect.buttonIdle")}
        </Button>
      </CardContent>
    </Card>
  );
}

function PredictionCard({ token }: { token: string | null }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [horizonDays, setHorizonDays] = useState(7);
  const [riskAreaId, setRiskAreaId] = useState("");
  const [modelVersionId, setModelVersionId] = useState("");

  const generate = useMutation({
    mutationFn: () => {
      const startAt = new Date();
      const endAt = new Date(startAt.getTime() + horizonDays * 24 * 60 * 60 * 1000);
      return apiRequest<QueuedPrediction>(endpoints.predictions.list, {
        method: "POST",
        auth: token,
        idempotent: true,
        body: {
          riskAreaId: riskAreaId.trim(),
          modelVersionId: modelVersionId.trim(),
          forecastPeriod: { startAt: startAt.toISOString(), endAt: endAt.toISOString() },
        } satisfies CreatePredictionInput,
      });
    },
    onSuccess: (prediction) => {
      toast.success(
        t("adminData.prediction.queued", { id: prediction.predictionId.slice(0, 8) }),
      );
      void qc.invalidateQueries({ queryKey: ["prediction"] });
      void qc.invalidateQueries({ queryKey: ["app"] });
    },
    onError: (err) => toast.error((err as Error).message),
  });

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <Sparkle className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{t("adminData.prediction.title")}</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          <Trans
            i18nKey="adminData.prediction.description"
            components={{ code: <code /> }}
          />
        </p>
        <div className="flex gap-2">
          <Input
            value={riskAreaId}
            onChange={(event) => setRiskAreaId(event.target.value)}
            placeholder={t("adminData.prediction.placeholderRiskArea")}
            aria-label={t("adminData.prediction.placeholderRiskArea")}
          />
          <Input
            value={modelVersionId}
            onChange={(event) => setModelVersionId(event.target.value)}
            placeholder={t("adminData.prediction.placeholderModel")}
            aria-label={t("adminData.prediction.placeholderModel")}
          />
        </div>
        <div className="flex gap-2">
          <Input
            type="number"
            min={1}
            max={30}
            value={horizonDays}
            onChange={(e) => setHorizonDays(Math.max(1, Number(e.target.value) || 1))}
            className="w-24"
            aria-label={t("adminData.prediction.daysLabel")}
          />
          <span className="self-center text-xs text-muted-foreground">
            {t("adminData.prediction.daysLabel")}
          </span>
        </div>
        <Button
          onClick={() => generate.mutate()}
          disabled={generate.isPending || !riskAreaId.trim() || !modelVersionId.trim()}
          className="w-full gap-2"
        >
          <Sparkle className="h-4 w-4" />
          {generate.isPending
            ? t("adminData.prediction.buttonRunning")
            : t("adminData.prediction.buttonIdle")}
        </Button>
      </CardContent>
    </Card>
  );
}

interface PreviewState {
  report: Report;
  link: ReportDownload;
}

type BatchStatus = "pending" | "linking" | "downloading" | "done" | "error";
interface BatchItem {
  report: Report;
  status: BatchStatus;
  progress: number;
  error?: string;
}

const INCLUDE_OPTIONS = ["HOTSPOTS", "PREDICTIONS", "COORDINATES", "ANALYSIS"] as const;
type IncludeKey = (typeof INCLUDE_OPTIONS)[number];

function ReportCard({ token }: { token: string | null }) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? "ru") as SupportedLanguage;
  const qc = useQueryClient();
  const [format, setFormat] = useState<ReportFormat>("PDF");
  const [title, setTitle] = useState(t("adminData.reports.defaultTitle"));
  const [days, setDays] = useState(30);
  const [includes, setIncludes] = useState<IncludeKey[]>(["HOTSPOTS", "PREDICTIONS", "ANALYSIS"]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [batch, setBatch] = useState<BatchItem[] | null>(null);
  const [batchRunning, setBatchRunning] = useState(false);

  const list = useQuery({
    queryKey: ["reports", "admin"],
    queryFn: ({ signal }) =>
      apiRequestPaginated<Report>(endpoints.reports.list, {
        auth: token,
        query: { limit: 20 },
        signal,
      }),
    retry: 1,
  });

  const items = list.data?.items ?? [];

  const create = useMutation({
    mutationFn: () => {
      const endAt = new Date();
      const startAt = new Date(endAt.getTime() - days * 24 * 60 * 60 * 1000);
      return apiRequest<QueuedReport>(endpoints.reports.list, {
        method: "POST",
        auth: token,
        idempotent: true,
        body: {
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          format,
          includeHotspots: includes.includes("HOTSPOTS"),
          includePredictions: includes.includes("PREDICTIONS"),
        } satisfies CreateReportInput,
      });
    },
    onSuccess: (r) => {
      toast.success(t("adminData.reports.queued", { id: r.reportId.slice(0, 8) }));
      void qc.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (err) => toast.error((err as Error).message),
  });

  function toggleInclude(key: IncludeKey) {
    setIncludes((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  async function fetchLink(report: Report): Promise<ReportDownload | null> {
    setLoadingId(report.id);
    try {
      return await apiRequest<ReportDownload>(endpoints.reports.download(report.id), {
        auth: token,
      });
    } catch {
      toast.error(t("adminData.reports.fetchLinkError"));
      return null;
    } finally {
      setLoadingId(null);
    }
  }

  async function openPreview(report: Report) {
    const link = await fetchLink(report);
    if (link) setPreview({ report, link });
  }

  async function download(report: Report) {
    const link = await fetchLink(report);
    if (link) window.open(link.downloadUrl, "_blank", "noopener");
  }

  function toggleChecked(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const readyItems = items.filter((r) => r.status === "READY");
  const allReadyChecked = readyItems.length > 0 && readyItems.every((r) => checkedIds.has(r.id));

  function toggleAll() {
    if (allReadyChecked) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(readyItems.map((r) => r.id)));
    }
  }

  async function downloadOne(report: Report, update: (patch: Partial<BatchItem>) => void) {
    try {
      update({ status: "linking", progress: 0 });
      const link = await apiRequest<ReportDownload>(endpoints.reports.download(report.id), {
        auth: token,
      });
      update({ status: "downloading", progress: 0 });

      const res = await fetch(link.downloadUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const total = Number(res.headers.get("Content-Length") || 0);
      const reader = res.body?.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            received += value.length;
            if (total > 0) {
              update({ progress: Math.min(100, Math.round((received / total) * 100)) });
            }
          }
        }
      } else {
        const blob = await res.blob();
        chunks.push(new Uint8Array(await blob.arrayBuffer()));
        received = chunks[0].length;
      }
      const blob = new Blob(chunks as BlobPart[], {
        type:
          res.headers.get("Content-Type") ||
          (report.format === "PDF" ? "application/pdf" : "application/octet-stream"),
      });
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      const ext = report.format.toLowerCase();
      const safeName = report.title.replace(/[^\w.\- ]+/g, "_").trim() || report.id;
      a.download = `${safeName}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
      update({ status: "done", progress: 100 });
    } catch (err) {
      update({
        status: "error",
        error: (err as Error).message || t("adminData.download.error"),
      });
    }
  }

  async function startBatchDownload() {
    const targets = readyItems.filter((r) => checkedIds.has(r.id));
    if (targets.length === 0) return;
    const initial: BatchItem[] = targets.map((r) => ({
      report: r,
      status: "pending",
      progress: 0,
    }));
    setBatch(initial);
    setBatchRunning(true);
    for (let i = 0; i < targets.length; i++) {
      await downloadOne(targets[i], (patch) => {
        setBatch((prev) => {
          if (!prev) return prev;
          const next = prev.slice();
          next[i] = { ...next[i], ...patch };
          return next;
        });
      });
    }
    setBatchRunning(false);
  }

  const selected = items.find((r) => r.id === selectedId) ?? null;

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <FilePlus className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{t("adminData.reports.title")}</h3>
        </div>

        <section className="space-y-3 rounded-md border p-3">
          <p className="text-xs text-muted-foreground">
            <Trans
              i18nKey="adminData.reports.newReportHint"
              components={{ code: <code /> }}
            />
          </p>
          <div className="grid gap-2 md:grid-cols-[1fr_120px_120px]">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("adminData.reports.placeholderTitle")}
              aria-label={t("adminData.reports.placeholderTitle")}
            />
            <Select value={format} onValueChange={(v) => setFormat(v as ReportFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PDF">PDF</SelectItem>
                <SelectItem value="XLSX">XLSX</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              min={1}
              max={365}
              value={days}
              onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))}
              aria-label={t("adminData.reports.periodLabel")}
            />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              {t("adminData.reports.includeLabel")}
            </p>
            <div className="flex flex-wrap gap-3">
              {INCLUDE_OPTIONS.map((key) => (
                <Label
                  key={key}
                  htmlFor={`inc-${key}`}
                  className="flex cursor-pointer items-center gap-2 text-xs font-normal"
                >
                  <Checkbox
                    id={`inc-${key}`}
                    checked={includes.includes(key)}
                    onCheckedChange={() => toggleInclude(key)}
                  />
                  {t(`adminData.reports.includeOptions.${key}` as const)}
                </Label>
              ))}
            </div>
          </div>
          <Button
            onClick={() => create.mutate()}
            disabled={create.isPending || title.trim().length === 0 || includes.length === 0}
            className="w-full gap-2"
          >
            <FilePlus className="h-4 w-4" />
            {create.isPending
              ? t("adminData.reports.buttonRunning")
              : t("adminData.reports.buttonIdle")}
          </Button>
        </section>

        <section className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-semibold text-muted-foreground">
              {t("adminData.reports.existingTitle")}
            </h4>
            <div className="flex items-center gap-3">
              <p className="text-[11px] text-muted-foreground">
                {t("adminData.reports.clickHint")}
              </p>
              {readyItems.length > 0 && (
                <Label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-normal">
                  <Checkbox checked={allReadyChecked} onCheckedChange={() => toggleAll()} />
                  {t("adminData.reports.selectAllReady")}
                </Label>
              )}
              <Button
                type="button"
                size="sm"
                disabled={checkedIds.size === 0 || batchRunning}
                onClick={() => void startBatchDownload()}
                className="gap-1"
              >
                <Download className="h-3.5 w-3.5" />
                {t("adminData.reports.batchDownload", { count: checkedIds.size })}
              </Button>
            </div>
          </div>

          {list.isLoading && <LoadingState rows={3} />}
          {list.isError && <ApiErrorAlert error={list.error} onRetry={() => list.refetch()} />}
          {list.data && items.length === 0 && (
            <EmptyState title={t("adminData.reports.empty")} />
          )}

          {items.length > 0 && (
            <ul className="divide-y rounded-md border">
              {items.map((r) => {
                const isSelected = selectedId === r.id;
                const ready = r.status === "READY";
                const isChecked = checkedIds.has(r.id);
                return (
                  <li
                    key={r.id}
                    role="button"
                    tabIndex={0}
                    aria-selected={isSelected}
                    onClick={() => setSelectedId(r.id)}
                    onDoubleClick={() => ready && openPreview(r)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && ready) void openPreview(r);
                    }}
                    className={
                      "flex cursor-pointer items-center justify-between gap-3 p-3 text-sm transition-colors " +
                      (isSelected ? "bg-primary-soft" : "hover:bg-muted")
                    }
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        onClick={(e) => e.stopPropagation()}
                        onDoubleClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={isChecked}
                          disabled={!ready}
                          onCheckedChange={() => toggleChecked(r.id)}
                          aria-label={t("adminData.reports.selectLabel", { title: r.title })}
                        />
                      </span>
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{r.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {r.format} · {formatDateTime(r.createdAt, lang)} ·{" "}
                          <span
                            className={
                              ready
                                ? "text-risk-low"
                                : r.status === "FAILED"
                                  ? "text-destructive"
                                  : ""
                            }
                          >
                            {r.status}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div
                      className="flex shrink-0 items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                      onDoubleClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={!ready || loadingId === r.id}
                        onClick={() => openPreview(r)}
                      >
                        {t("adminData.download.preview")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!ready || loadingId === r.id}
                        onClick={() => download(r)}
                        className="gap-1"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {t("adminData.download.download")}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {selected && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/40 p-3 text-xs">
              <span>
                {t("adminData.reports.selectedLabel", {
                  title: selected.title,
                  format: selected.format,
                })}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={selected.status !== "READY" || loadingId === selected.id}
                  onClick={() => openPreview(selected)}
                >
                  {t("adminData.download.preview")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={selected.status !== "READY" || loadingId === selected.id}
                  onClick={() => download(selected)}
                  className="gap-1"
                >
                  <Download className="h-3.5 w-3.5" />
                  {t("adminData.download.download")}
                </Button>
              </div>
            </div>
          )}
        </section>
      </CardContent>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-4xl">
          {preview && (
            <>
              <DialogHeader>
                <DialogTitle>{preview.report.title}</DialogTitle>
                <DialogDescription>
                  {preview.report.format} ·{" "}
                  {t("adminData.download.linkExpires", {
                    date: formatDateTime(preview.link.expiresAt, lang),
                  })}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-2">
                {preview.report.format === "PDF" ? (
                  <PdfPreview url={preview.link.downloadUrl} title={preview.report.title} />
                ) : (
                  <div className="rounded-md border bg-muted/40 p-6 text-sm">
                    <p className="mb-3 font-medium">
                      {t("adminData.download.xlsxNoPreview")}
                    </p>
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
                    <ArrowSquareOut className="h-4 w-4" /> {t("adminData.download.openNewTab")}
                  </a>
                </Button>
                <Button onClick={() => download(preview.report)} className="gap-1">
                  <Download className="h-4 w-4" /> {t("adminData.download.download")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!batch}
        onOpenChange={(o) => {
          if (!o && !batchRunning) setBatch(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("adminData.batch.title")}</DialogTitle>
            <DialogDescription>
              {batch
                ? t("adminData.batch.progress", {
                    done: batch.filter((b) => b.status === "done").length,
                    total: batch.length,
                  })
                : ""}
            </DialogDescription>
          </DialogHeader>
          <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
            {batch?.map((b) => (
              <li key={b.report.id} className="rounded-md border p-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{b.report.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {b.report.format} ·{" "}
                      {b.status === "pending" && t("adminData.batch.statusPending")}
                      {b.status === "linking" && t("adminData.batch.statusLinking")}
                      {b.status === "downloading" &&
                        t("adminData.batch.statusDownloading", { progress: b.progress })}
                      {b.status === "done" && t("adminData.batch.statusDone")}
                      {b.status === "error" && (
                        <span className="text-destructive">
                          {t("adminData.batch.statusError")}
                          {b.error ? `: ${b.error}` : ""}
                        </span>
                      )}
                    </p>
                  </div>
                  {b.status === "done" && (
                    <span className="text-xs font-medium text-risk-low">✓</span>
                  )}
                  {b.status === "error" && <Warning className="h-4 w-4 text-destructive" />}
                  {(b.status === "linking" || b.status === "downloading") && (
                    <CircleNotch className="h-4 w-4 animate-spin text-primary" />
                  )}
                </div>
                <Progress
                  value={b.status === "done" ? 100 : b.status === "error" ? 0 : b.progress}
                  className="mt-2 h-1.5"
                />
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button variant="outline" disabled={batchRunning} onClick={() => setBatch(null)}>
              {batchRunning ? t("adminData.batch.buttonRunning") : t("adminData.batch.buttonClose")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

interface PdfPreviewProps {
  url: string;
  title: string;
}

function PdfPreview({ url, title }: PdfPreviewProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | null = null;

    setStatus("loading");
    setError(null);
    setBlobUrl(null);

    (async () => {
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
        setStatus("ready");
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError((err as Error).message || t("adminData.pdf.fetchError"));
        setStatus("error");
      }
    })();

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, attempt, t]);

  if (status === "loading") {
    return (
      <div className="flex h-[65vh] w-full flex-col items-center justify-center gap-3 rounded-md border bg-muted text-sm text-muted-foreground">
        <CircleNotch className="h-6 w-6 animate-spin text-primary" />
        <p>{t("adminData.pdf.loading")}</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex h-[65vh] w-full flex-col items-center justify-center gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
        <Warning className="h-6 w-6 text-destructive" />
        <p className="font-medium text-destructive">{t("adminData.pdf.loadError")}</p>
        {error && <p className="text-xs text-muted-foreground">{error}</p>}
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setAttempt((n) => n + 1)}
          >
            {t("adminData.pdf.retry")}
          </Button>
          <Button type="button" size="sm" variant="ghost" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              {t("adminData.pdf.openDirectly")}
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <iframe
      src={blobUrl ?? undefined}
      title={title}
      className="h-[65vh] w-full rounded-md border bg-muted"
    />
  );
}
