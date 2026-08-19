import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { PageHeader } from "@/components/layout/PageHeader";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequestPaginated } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { Hotspot } from "@/lib/api/types";

export const Route = createFileRoute("/hotspots")({
  head: () => ({
    meta: [
      { title: "Hotspots — Jol" },
      { name: "description", content: "Очаги ДТП Астаны, обнаруженные системой." },
    ],
  }),
  component: HotspotsPage,
});

function HotspotsPage() {
  const { t } = useTranslation();
  const q = useQuery({
    queryKey: ["hotspots", "list"],
    queryFn: ({ signal }) => apiRequestPaginated<Hotspot>(endpoints.hotspots.list, { signal }),
    retry: 1,
  });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
      <PageHeader title={t("hotspots.title")} />
      {q.isLoading && <LoadingState rows={6} />}
      {q.isError && <ApiErrorAlert error={q.error} onRetry={() => q.refetch()} />}
      {q.data && q.data.items.length === 0 && <EmptyState />}
      {q.data && q.data.items.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {q.data.items.map((h) => (
            <Card key={h.id}>
              <CardContent className="p-4">
                <p className="text-sm font-semibold">Hotspot #{h.id.slice(0, 6)}</p>
                <dl className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt>{t("hotspots.accidents")}</dt>
                    <dd className="font-medium">{h.accidentCount}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>{t("hotspots.density")}</dt>
                    <dd className="font-medium">{h.density.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>{t("hotspots.algorithm")}</dt>
                    <dd className="font-medium">{h.algorithm}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
