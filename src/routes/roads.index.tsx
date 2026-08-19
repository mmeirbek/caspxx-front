import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { ArrowSquareOut, SquaresFour, List, MagnifyingGlass } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { PageHeader } from "@/components/layout/PageHeader";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiRequestPaginated } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { Road } from "@/lib/api/types";

const searchSchema = z.object({
  page: fallback(z.number().int(), 1).default(1),
  view: fallback(z.enum(["table", "grid"]), "table").default("table"),
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/roads/")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Дороги Астаны — Jol" },
      { name: "description", content: "Список дорог Астаны с быстрым доступом к карточке риска." },
    ],
  }),
  component: RoadsPage,
});

const PAGE_SIZE = 20;

function RoadsPage() {
  const { t } = useTranslation();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [qInput, setQInput] = useState(search.q);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const trimmed = qInput.trim();
    if (trimmed === search.q) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void navigate({ search: { ...search, q: trimmed, page: 1 }, replace: true });
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [qInput]);

  const query = useQuery({
    queryKey: ["roads", "list", search.page, search.q],
    queryFn: ({ signal }) =>
      apiRequestPaginated<Road>(endpoints.roads, {
        signal,
        query: { page: search.page, limit: PAGE_SIZE, search: search.q || undefined },
      }),
    retry: 1,
  });

  const filtered = query.data;

  function submitSearch() {
    void navigate({ search: { ...search, q: qInput.trim(), page: 1 }, replace: true });
  }

  function setView(v: "table" | "grid") {
    void navigate({ search: { ...search, view: v }, replace: true });
  }

  function setPage(n: number) {
    void navigate({ search: { ...search, page: Math.max(1, n) } });
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
      <PageHeader title={t("roads.title")} subtitle={t("roads.subtitle")} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitSearch();
            }}
            placeholder={t("roads.searchPlaceholder")}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 rounded-md border p-0.5">
          <Button
            variant={search.view === "table" ? "secondary" : "ghost"}
            size="sm"
            className="gap-1"
            onClick={() => setView("table")}
          >
            <List className="h-4 w-4" /> {t("roads.viewTable")}
          </Button>
          <Button
            variant={search.view === "grid" ? "secondary" : "ghost"}
            size="sm"
            className="gap-1"
            onClick={() => setView("grid")}
          >
            <SquaresFour className="h-4 w-4" /> {t("roads.viewGrid")}
          </Button>
        </div>
      </div>

      {query.isLoading && <LoadingState rows={8} />}
      {query.isError && <ApiErrorAlert error={query.error} onRetry={() => query.refetch()} />}
      {filtered && filtered.items.length === 0 && <EmptyState title={t("roads.empty")} />}

      {filtered && filtered.items.length > 0 && search.view === "table" && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("roads.columns.name")}</TableHead>
                <TableHead>{t("roads.columns.region")}</TableHead>
                <TableHead>{t("roads.columns.length")}</TableHead>
                <TableHead className="w-40 text-right">{t("roads.columns.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.items.map((road) => (
                <TableRow key={road.id}>
                  <TableCell className="font-medium">{road.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {road.regionId.slice(0, 8)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {estimateLengthKm(road).toFixed(1)} {t("roads.km")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline" className="gap-1">
                      <Link to="/roads/$roadId" params={{ roadId: road.id }}>
                        <ArrowSquareOut className="h-3.5 w-3.5" /> {t("common.open")}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {filtered && filtered.items.length > 0 && search.view === "grid" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.items.map((road) => (
            <Card key={road.id}>
              <CardContent className="p-4">
                <p className="text-sm font-semibold">{road.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {estimateLengthKm(road).toFixed(1)} {t("roads.km")}
                </p>
                <div className="mt-3">
                  <Button asChild size="sm" variant="outline" className="w-full gap-1">
                    <Link to="/roads/$roadId" params={{ roadId: road.id }}>
                      {t("common.open")}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {query.data && query.data.meta.pages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={(e) => {
                  e.preventDefault();
                  if (search.page > 1) setPage(search.page - 1);
                }}
                className={search.page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink isActive>
                {search.page} / {query.data.meta.pages}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={(e) => {
                  e.preventDefault();
                  if (search.page < query.data.meta.pages) setPage(search.page + 1);
                }}
                className={
                  search.page >= query.data.meta.pages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

function estimateLengthKm(road: Road): number {
  const c = road.geometry.coordinates;
  if (c.length < 2) return 0;
  let m = 0;
  for (let i = 1; i < c.length; i++) {
    m += haversine(c[i - 1], c[i]);
  }
  return m / 1000;
}

function haversine(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
