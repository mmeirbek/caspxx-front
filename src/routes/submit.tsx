import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Info, Upload, X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type {
  CreateSubmissionInput,
  CreateSubmissionResponse,
  SubmissionCategory,
  SubmissionFileResponse,
  SubmissionStatusResponse,
} from "@/lib/api/types";
import { MapPointPicker } from "@/components/map/MapPointPicker";
import { ASTANA_CENTER, isWithinAstana } from "@/lib/geocoding/nominatim";

export const Route = createFileRoute("/submit")({
  head: () => ({
    meta: [
      { title: "Сообщить о проблеме — Jol" },
      {
        name: "description",
        content: "Отправьте сообщение о ДТП, яме или опасном участке в Астане.",
      },
    ],
  }),
  component: SubmitPage,
});

const CATEGORIES: SubmissionCategory[] = ["ACCIDENT_REPORT", "ROAD_DAMAGE", "DANGEROUS_SECTION"];

const schema = z.object({
  category: z.enum(["ACCIDENT_REPORT", "ROAD_DAMAGE", "DANGEROUS_SECTION"]),
  title: z.string().min(3).max(120),
  description: z.string().min(5).max(2000),
  lat: z.number(),
  lon: z.number(),
  name: z.string().min(2).max(80),
  phone: z.string().min(6).max(24),
  email: z.string().email().optional().or(z.literal("")),
  consent: z.boolean().refine((v) => v === true, { message: "Необходимо согласие" }),
});
type FormValues = z.infer<typeof schema>;

interface LocalTrack {
  submissionId: string;
  trackingToken: string;
  title: string;
  createdAt: string;
  status?: "PENDING_MODERATION" | "APPROVED" | "REJECTED";
}
const TRACK_KEY = "jol.submissions.v1";
function readLocal(): LocalTrack[] {
  try {
    return JSON.parse(localStorage.getItem(TRACK_KEY) ?? "[]") as LocalTrack[];
  } catch {
    return [];
  }
}
function writeLocal(list: LocalTrack[]): void {
  localStorage.setItem(TRACK_KEY, JSON.stringify(list));
}

function SubmitPage() {
  const { t } = useTranslation();
  const [photos, setPhotos] = useState<Array<{ fileId: string; previewUrl: string }>>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [successOpen, setSuccessOpen] = useState(false);
  const [tracks, setTracks] = useState<LocalTrack[]>([]);

  useEffect(() => setTracks(readLocal()), []);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: "ROAD_DAMAGE",
      title: "",
      description: "",
      lat: ASTANA_CENTER[0],
      lon: ASTANA_CENTER[1],
      name: "",
      phone: "",
      email: "",
      consent: false,
    },
  });

  const { errors } = form.formState;

  const submit = useMutation({
    mutationFn: async (v: FormValues) => {
      if (!isWithinAstana(v.lon, v.lat)) throw new Error(t("submit.outsideAstana"));
      const body: CreateSubmissionInput = {
        title: v.title,
        description: v.description,
        category: v.category,
        location: { type: "Point", coordinates: [v.lon, v.lat] },
        photos: photos.map((p) => ({ fileId: p.fileId })),
        contact: { name: v.name, phone: v.phone, email: v.email || undefined },
      };
      return apiRequest<CreateSubmissionResponse>(endpoints.submissions.create, {
        method: "POST",
        body,
        idempotent: true,
      });
    },
    onSuccess: (res, v) => {
      const next: LocalTrack = {
        submissionId: res.submissionId,
        trackingToken: res.trackingToken,
        title: v.title,
        createdAt: res.createdAt,
        status: "PENDING_MODERATION",
      };
      const updated = [next, ...readLocal()].slice(0, 20);
      writeLocal(updated);
      setTracks(updated);
      setSuccessOpen(true);
      form.reset();
      setPhotos([]);
    },
    onError: (err) => toast.error((err as Error).message),
  });

  async function onFiles(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files).slice(0, 5 - photos.length);
    for (const file of arr) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: > 10 MB`);
        continue;
      }
      setUploadingCount((n) => n + 1);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await apiRequest<SubmissionFileResponse>(endpoints.submissions.files, {
          method: "POST",
          formData: fd,
        });
        setPhotos((p) => [...p, res]);
      } catch {
        toast.error(t("common.error"));
      } finally {
        setUploadingCount((n) => n - 1);
      }
    }
  }

  const category = form.watch("category");
  const lat = form.watch("lat");
  const lon = form.watch("lon");

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 md:p-6">
      <PageHeader title={t("submit.title")} subtitle={t("submit.subtitle")} />

      <form onSubmit={form.handleSubmit((v) => submit.mutate(v))} className="space-y-6">
        <Card>
          <CardContent className="space-y-5 p-5">
            <div>
              <Label className="mb-2 block">{t("submit.category")}</Label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => form.setValue("category", c)}
                    className={
                      "rounded-lg border p-3 text-sm font-medium transition-colors " +
                      (category === c
                        ? "border-primary bg-primary-soft text-primary"
                        : "hover:bg-muted")
                    }
                  >
                    {t(`submit.categories.${c}`)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="title">{t("submit.fields.titleLabel")}</Label>
              <Input id="title" {...form.register("title")} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="description">{t("submit.fields.description")}</Label>
              <Textarea
                id="description"
                rows={4}
                {...form.register("description")}
                className="mt-1"
              />
            </div>

            <div>
              <Label>{t("submit.fields.location")}</Label>
              <MapPointPicker
                value={{ lat, lon }}
                onChange={(v) => {
                  form.setValue("lat", v.lat, { shouldValidate: true });
                  form.setValue("lon", v.lon, { shouldValidate: true });
                }}
                className="mt-2"
              />
            </div>

            <div>
              <Label>{t("submit.fields.photos")}</Label>
              <label
                htmlFor="photos"
                className="mt-1 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed p-6 text-sm text-muted-foreground hover:bg-muted"
              >
                <Upload className="h-5 w-5" />
                <span>Drag & drop / выбрать файл (JPEG/PNG/WEBP, ≤10 MB)</span>
                <input
                  id="photos"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => onFiles(e.target.files)}
                />
              </label>
              {(photos.length > 0 || uploadingCount > 0) && (
                <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {photos.map((p) => (
                    <div key={p.fileId} className="relative">
                      <img
                        src={p.previewUrl}
                        alt={t("submit.fields.photoPreview")}
                        className="h-20 w-full rounded-md object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setPhotos((s) => s.filter((x) => x.fileId !== p.fileId))}
                        className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                        aria-label="remove"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {uploadingCount > 0 && (
                    <div className="flex h-20 items-center justify-center rounded-md border">
                      <span className="text-xs text-muted-foreground">…{uploadingCount}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">{t("submit.fields.name")}</Label>
                <Input id="name" {...form.register("name")} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="phone">{t("submit.fields.phone")}</Label>
                <Input id="phone" type="tel" {...form.register("phone")} className="mt-1" />
              </div>
            </div>
            <div>
              <Label htmlFor="email">{t("submit.fields.email")}</Label>
              <Input id="email" type="email" {...form.register("email")} className="mt-1" />
            </div>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={form.watch("consent")}
                onCheckedChange={(v) =>
                  form.setValue("consent", v === true, { shouldValidate: true })
                }
              />
              <span>{t("submit.fields.consent")}</span>
            </label>
            {errors.consent && (
              <p className="text-sm text-destructive">{errors.consent.message}</p>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary-soft p-3 text-xs text-primary">
          <Info className="h-4 w-4 shrink-0" />
          <p>{t("submit.aiTrainingNotice")}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {Object.keys(errors).length > 0 && (
            <p className="text-sm text-destructive">
              {t("submit.validationError") || "Проверьте правильность заполнения формы"}
            </p>
          )}
          <Button type="submit" disabled={submit.isPending} size="lg">
            {t("submit.submit")}
          </Button>
        </div>
      </form>

      {/* Local tracking */}
      <section>
        <h2 className="mb-3 text-sm font-semibold">{t("submit.mySubmissions")}</h2>
        {tracks.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {tracks.map((tr) => (
              <TrackRow
                key={tr.submissionId}
                track={tr}
                onUpdate={(u) => {
                  const list = readLocal().map((x) =>
                    x.submissionId === u.submissionId ? { ...x, ...u } : x,
                  );
                  writeLocal(list);
                  setTracks(list);
                }}
              />
            ))}
          </div>
        )}
      </section>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("submit.success.title")}</DialogTitle>
            <DialogDescription>{t("submit.success.description")}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TrackRow({
  track,
  onUpdate,
}: {
  track: LocalTrack;
  onUpdate: (u: Partial<LocalTrack> & { submissionId: string }) => void;
}) {
  const { t } = useTranslation();
  useEffect(() => {
    let cancelled = false;
    apiRequest<SubmissionStatusResponse>(endpoints.submissions.status(track.submissionId), {
      trackingToken: track.trackingToken,
    })
      .then((res) => {
        if (cancelled) return;
        onUpdate({ submissionId: track.submissionId, status: res.status });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track.submissionId]);

  const status = track.status ?? "PENDING_MODERATION";
  const color =
    status === "APPROVED"
      ? "text-risk-low"
      : status === "REJECTED"
        ? "text-destructive"
        : "text-muted-foreground";

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-3">
        <div>
          <p className="text-sm font-medium">{track.title}</p>
          <p className="text-xs text-muted-foreground">#{track.submissionId.slice(0, 8)}</p>
        </div>
        <span className={"text-xs font-semibold " + color}>{t(`submit.status.${status}`)}</span>
      </CardContent>
    </Card>
  );
}
