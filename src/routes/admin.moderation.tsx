import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, X } from "@phosphor-icons/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AdminModuleGate } from "@/features/module-access/AdminModuleGate";
import { getModuleToken } from "@/features/module-access/store";
import { apiRequest, apiRequestPaginated } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { ModerationSubmission } from "@/lib/api/types";
import { formatDateTime } from "@/lib/utils/format";
import type { SupportedLanguage } from "@/lib/i18n/config";

export const Route = createFileRoute("/admin/moderation")({
  head: () => ({ meta: [{ name: "robots", content: "noindex" }, { title: "Moderation — Jol" }] }),
  component: () => (
    <AdminModuleGate module="moderation">
      <Moderation />
    </AdminModuleGate>
  ),
});

function Moderation() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? "ru") as SupportedLanguage;
  const qc = useQueryClient();
  const token = getModuleToken("moderation");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"approve" | "reject" | null>(null);
  const [text, setText] = useState("");

  const list = useQuery({
    queryKey: ["moderation", "queue"],
    queryFn: ({ signal }) =>
      apiRequestPaginated<ModerationSubmission>(endpoints.moderation.list, { auth: token, signal }),
    retry: 1,
  });

  const items = list.data?.items ?? [];
  const selected = items.find((s) => s.id === selectedId) ?? items[0];

  const approve = useMutation({
    mutationFn: () =>
      apiRequest(endpoints.moderation.approve(selected!.id), {
        method: "POST",
        auth: token,
        idempotent: true,
        body: { comment: text, confirmedEventType: selected!.category },
      }),
    onSuccess: () => {
      toast.success(t("moderation.approved"));
      setDialog(null);
      setText("");
      void qc.invalidateQueries({ queryKey: ["moderation"] });
      void qc.invalidateQueries({ queryKey: ["app"] });
    },
    onError: (err) => toast.error((err as Error).message),
  });

  const reject = useMutation({
    mutationFn: () =>
      apiRequest(endpoints.moderation.reject(selected!.id), {
        method: "POST",
        auth: token,
        idempotent: true,
        body: { reason: text },
      }),
    onSuccess: () => {
      toast.success(t("moderation.rejected"));
      setDialog(null);
      setText("");
      void qc.invalidateQueries({ queryKey: ["moderation"] });
    },
    onError: (err) => toast.error((err as Error).message),
  });

  if (list.isLoading) return <LoadingState rows={6} />;
  if (list.isError) return <ApiErrorAlert error={list.error} onRetry={() => list.refetch()} />;
  if (items.length === 0) return <EmptyState title={t("moderation.empty")} />;

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Card>
        <CardContent className="p-0">
          <ul className="divide-y">
            {items.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(s.id)}
                  className={
                    "w-full px-4 py-3 text-left transition-colors " +
                    (selected?.id === s.id ? "bg-primary-soft" : "hover:bg-muted")
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{s.title}</p>
                    <span className="text-[10px] uppercase text-muted-foreground">
                      {s.category}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(s.createdAt, lang)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {selected && (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <h2 className="text-lg font-semibold">{selected.title}</h2>
              <p className="text-xs text-muted-foreground">
                #{selected.id.slice(0, 8)} · {selected.category}
              </p>
            </div>

            {selected.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {selected.photos.map((p) => (
                  <img
                    key={p.fileId}
                    src={p.previewUrl}
                    alt={t("moderation.photo")}
                    className="h-24 w-full rounded-md object-cover"
                  />
                ))}
              </div>
            )}

            <p className="text-sm">{selected.description}</p>

            <div className="rounded-md border p-3 text-sm">
              <p className="text-xs font-semibold text-muted-foreground">
                {t("moderation.contact")}
              </p>
              <p>
                {selected.contact.name} · {selected.contact.phone}
              </p>
              {selected.contact.email && (
                <p className="text-xs text-muted-foreground">{selected.contact.email}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setDialog("reject");
                  setText("");
                }}
                className="gap-1"
              >
                <X className="h-4 w-4" /> {t("moderation.reject")}
              </Button>
              <Button
                onClick={() => {
                  setDialog("approve");
                  setText("");
                }}
                className="gap-1"
              >
                <Check className="h-4 w-4" /> {t("moderation.approve")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialog !== null} onOpenChange={(o) => (o ? undefined : setDialog(null))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === "approve" ? t("moderation.approveTitle") : t("moderation.rejectTitle")}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={dialog === "approve" ? t("moderation.comment") : t("moderation.reason")}
            rows={4}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog(null)}>
              {t("common.cancel")}
            </Button>
            {dialog === "approve" ? (
              <Button onClick={() => approve.mutate()} disabled={approve.isPending}>
                {t("moderation.approve")}
              </Button>
            ) : (
              <Button
                variant="destructive"
                disabled={reject.isPending || text.trim().length < 3}
                onClick={() => reject.mutate()}
              >
                {t("moderation.reject")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
