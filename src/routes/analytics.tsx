import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ChartBar, Download, FileText } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageHeader } from "@/components/layout/PageHeader";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { AppAnalyticsResponse } from "@/lib/api/types";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Аналитика — Jol" },
      {
        name: "description",
        content: "Анализ данных ДТП Астаны и экспорт в различных форматах.",
      },
    ],
  }),
  component: AnalyticsPage,
});

const ACCIDENT_TYPE_LABELS: Record<string, string> = {
  "01": "Столкновение",
  "02": "Опрокидывание",
  "03": "Наезд на стоящее ТС",
  "04": "Наезд на препятствие",
  "05": "Наезд на пешехода",
  "06": "Наезд на велосипедиста",
  "08": "Наезд на животных",
  "09": "Падение пассажира",
  "10": "Иной вид ДТП",
  "11": "Столкновение с ж/д",
  "12": "Выезд на встречную",
  "13": "Нарушение ПДД пешеходом",
  "14": "Техническая неисправность",
  "15": "Прочие",
};

type ChartMetric =
  | "deceased"
  | "injured"
  | "accidentTypes"
  | "timeOfDay"
  | "lighting"
  | "riskTrend";

type ExportFormat = "csv" | "json" | "xlsx" | "pdf";

function AnalyticsPage() {
  const { t } = useTranslation();
  const [chart, setChart] = useState<ChartMetric>("deceased");
  const [fmt, setFmt] = useState<ExportFormat>("csv");

  const analytics = useQuery({
    queryKey: ["app", "analytics"],
    queryFn: ({ signal }) => apiRequest<AppAnalyticsResponse>(endpoints.app.analytics, { signal }),
    retry: 1,
  });

  const chartData = useMemo(() => {
    if (!analytics.data) return [];
    const a = analytics.data;
    console.debug(a);
    switch (chart) {
      case "deceased": {
        const yearly = new Map<string, number>();
        for (const p of a.deceasedTrend) {
          const year = new Date(p.date).getFullYear().toString();
          yearly.set(year, (yearly.get(year) ?? 0) + p.value);
        }
        return Array.from(yearly.entries())
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => Number(a.label) - Number(b.label));
      }
      case "injured": {
        const yearly = new Map<string, number>();
        for (const p of a.injuredTrend) {
          const year = new Date(p.date).getFullYear().toString();
          yearly.set(year, (yearly.get(year) ?? 0) + p.value);
        }
        return Array.from(yearly.entries())
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => Number(a.label) - Number(b.label));
      }
      case "riskTrend": {
        const yearly = new Map<string, number>();
        for (const p of a.trend) {
          const year = new Date(p.date).getFullYear().toString();
          yearly.set(year, (yearly.get(year) ?? 0) + p.value);
        }
        return Array.from(yearly.entries())
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => Number(a.label) - Number(b.label));
      }
      case "accidentTypes":
        return a.accidentTypeDistribution.map((d) => ({
          label: ACCIDENT_TYPE_LABELS[d.type] ?? d.type,
          value: d.count,
        }));
      case "timeOfDay":
        return a.timeOfDayDistribution.map((d) => ({ label: `${d.hour}:00`, value: d.count }));
      case "lighting":
        return a.lightingDistribution.map((d) => ({ label: d.lighting, value: d.count }));
    }
  }, [analytics.data, chart]);

  const chartMax = useMemo(() => {
    if (chartData.length === 0) return 1;
    const mx = Math.max(...chartData.map((d) => d.value));
    return mx === 0 ? 1 : Math.ceil(mx / 0.75);
  }, [chartData]);

  function exportData() {
    if (!analytics.data) {
      toast.error(t("common.empty"));
      return;
    }
    const rows = chartData;
    if (fmt === "json") {
      downloadBlob(
        new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" }),
        `jol-${chart}.json`,
      );
    } else if (fmt === "csv") {
      const csv = ["label,value", ...rows.map((r) => `${r.label},${r.value}`)].join("\n");
      downloadBlob(new Blob([csv], { type: "text/csv" }), `jol-${chart}.csv`);
    } else {
      toast.info(t("analytics.exportBackend", { format: fmt.toUpperCase() }));
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 pb-24 md:p-6 md:pb-8">
      <PageHeader title={t("analytics.title")} subtitle={t("analytics.subtitle")} />

      <Card>
        <CardContent className="p-4 md:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-accent/15 text-accent">
                <ChartBar className="h-3.5 w-3.5" />
              </div>
              <h2 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em]">
                {t("dashboard.charts.title")}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={chart} onValueChange={(v) => setChart(v as ChartMetric)}>
                <SelectTrigger className="h-9 w-52 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deceased">{t("dashboard.charts.deceased")}</SelectItem>
                  <SelectItem value="injured">{t("dashboard.charts.injured")}</SelectItem>
                  <SelectItem value="accidentTypes">
                    {t("dashboard.charts.accidentTypes")}
                  </SelectItem>
                  <SelectItem value="timeOfDay">{t("dashboard.charts.timeOfDay")}</SelectItem>
                  <SelectItem value="lighting">{t("dashboard.charts.lighting")}</SelectItem>
                  <SelectItem value="riskTrend">{t("dashboard.charts.riskTrend")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={fmt} onValueChange={(v) => setFmt(v as ExportFormat)}>
                <SelectTrigger className="h-9 w-28 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="xlsx">XLSX</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={exportData} className="gap-1.5">
                <Download className="h-4 w-4" />
                {t("analytics.export")}
              </Button>
            </div>
          </div>
          <div className="h-[550px] w-full">
            {analytics.isLoading && <LoadingState rows={6} />}
            {analytics.isError && (
              <ApiErrorAlert error={analytics.error} onRetry={() => analytics.refetch()} />
            )}
            {analytics.data && chartData.length === 0 && <EmptyState className="border-0" />}
            {analytics.data && chartData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart key={chart} data={chartData}>
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis
                    domain={[0, chartMax]}
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" fill="var(--color-accent)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <FileText className="h-3 w-3" />
            {t("analytics.exportHint")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
