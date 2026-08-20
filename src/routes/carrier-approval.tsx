import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle, XCircle } from "@phosphor-icons/react";
import { toast } from "sonner";

import { requireRole } from "@/lib/auth/guards";
import { getAccessToken } from "@/lib/auth/storage";
import {
  listSuperadminCarriers,
  setCarrierApproval,
  type CarrierItem,
  type PaginationMeta,
} from "@/lib/api/superadmin";
import { cn } from "@/lib/utils";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/carrier-approval")({
  beforeLoad: ({ context }) => requireRole(context, ["ADMIN", "SUPERADMIN"]),
  component: CarrierApprovalPage,
});

function Pagination({ meta, onPage }: { meta: PaginationMeta | undefined; onPage: (page: number) => void }) {
  if (!meta || meta.pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>←</Button>
      <span className="text-sm text-muted-foreground">{meta.page} / {meta.pages}</span>
      <Button variant="outline" size="sm" disabled={meta.page >= meta.pages} onClick={() => onPage(meta.page + 1)}>→</Button>
    </div>
  );
}

function CarrierApprovalPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const carriers = useQuery({
    queryKey: ["superadmin", "carrier-approval", page],
    queryFn: () => listSuperadminCarriers(getAccessToken() ?? "", { page, limit: 10 }),
  });
  const approval = useMutation({
    mutationFn: ({ id, isApproved }: { id: string; isApproved: boolean }) =>
      setCarrierApproval(getAccessToken() ?? "", id, isApproved),
    onSuccess: () => {
      toast.success(t("common.updated"));
      void queryClient.invalidateQueries({ queryKey: ["superadmin", "carrier-approval"] });
      void queryClient.invalidateQueries({ queryKey: ["superadmin", "carriers"] });
    },
    onError: () => toast.error(t("common.error")),
  });

  if (carriers.isLoading) return <LoadingState />;
  if (carriers.isError) return <ErrorState onRetry={() => void carriers.refetch()} />;
  const items = carriers.data?.carriers ?? [];

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("superadmin.carrierApprovalTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("superadmin.carrierApprovalHint")}</p>
      </div>
      {items.length === 0 ? <EmptyState title={t("superadmin.empty")} /> : (
        <div className="space-y-3">
          {items.map((carrier: CarrierItem) => (
            <Card key={carrier.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="min-w-0 space-y-1">
                  <p className="font-medium">{[carrier.user.firstName, carrier.user.lastName].filter(Boolean).join(" ") || carrier.user.email}</p>
                  <p className="text-sm text-muted-foreground">{carrier.user.email}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{carrier.transportType ?? "—"}</Badge>
                    <Badge variant="outline">{t("superadmin.vehicles")}: {carrier.vehiclesCount}</Badge>
                    <Badge className={cn(carrier.isApproved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                      {carrier.isApproved ? t("superadmin.userStatus.ACTIVE") : t("superadmin.pendingApproval")}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant={carrier.isApproved ? "outline" : "default"}
                  onClick={() => approval.mutate({ id: carrier.id, isApproved: !carrier.isApproved })}
                  disabled={approval.isPending}
                >
                  {carrier.isApproved ? <XCircle className="mr-1 h-4 w-4" /> : <CheckCircle className="mr-1 h-4 w-4" />}
                  {carrier.isApproved ? t("superadmin.revoke") : t("superadmin.approve")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Pagination meta={carriers.data?.meta} onPage={setPage} />
    </main>
  );
}