import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { MapPointPicker } from "@/components/map/MapPointPicker";
import { Button } from "@/components/ui/button";
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
} from "@/lib/api/types";
import { ASTANA_CENTER, isWithinAstana } from "@/lib/geocoding/nominatim";

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
  consent: z.literal(true),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportModal({ open, onOpenChange }: Props) {
  const { t } = useTranslation();

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
      consent: false as unknown as true,
    },
  });

  const submit = useMutation({
    mutationFn: async (v: FormValues) => {
      if (!isWithinAstana(v.lon, v.lat)) throw new Error(t("submit.outsideAstana"));
      const body: CreateSubmissionInput = {
        title: v.title,
        description: v.description,
        category: v.category,
        location: { type: "Point", coordinates: [v.lon, v.lat] },
        photos: [],
        contact: { name: v.name, phone: v.phone, email: v.email || undefined },
      };
      return apiRequest<CreateSubmissionResponse>(endpoints.submissions.create, {
        method: "POST",
        body,
        idempotent: true,
      });
    },
    onSuccess: () => {
      toast.success(t("submit.success.title"));
      form.reset();
      onOpenChange(false);
    },
    onError: (err) => toast.error((err as Error).message),
  });

  const category = form.watch("category");
  const lat = form.watch("lat");
  const lon = form.watch("lon");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("submit.title")}</DialogTitle>
          <DialogDescription>{t("submit.subtitle")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((v) => submit.mutate(v))} className="space-y-4">
          <div>
            <Label className="mb-2 block">{t("submit.category")}</Label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => form.setValue("category", c)}
                  className={
                    "rounded-lg border p-2.5 text-xs font-medium transition-colors " +
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
            <Label htmlFor="rm-title">{t("submit.fields.titleLabel")}</Label>
            <Input id="rm-title" {...form.register("title")} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="rm-desc">{t("submit.fields.description")}</Label>
            <Textarea id="rm-desc" rows={3} {...form.register("description")} className="mt-1" />
          </div>

          <div>
            <Label>{t("submit.fields.location")}</Label>
            <div className="mt-1">
              <MapPointPicker
                value={{ lat, lon }}
                onChange={(v) => {
                  form.setValue("lat", v.lat, { shouldValidate: true });
                  form.setValue("lon", v.lon, { shouldValidate: true });
                }}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="rm-name">{t("submit.fields.name")}</Label>
              <Input id="rm-name" {...form.register("name")} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="rm-phone">{t("submit.fields.phone")}</Label>
              <Input id="rm-phone" type="tel" {...form.register("phone")} className="mt-1" />
            </div>
          </div>
          <div>
            <Label htmlFor="rm-email">{t("submit.fields.email")}</Label>
            <Input id="rm-email" type="email" {...form.register("email")} className="mt-1" />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox
              checked={form.watch("consent") === true}
              onCheckedChange={(v) =>
                form.setValue("consent", v === true ? true : (false as unknown as true))
              }
            />
            <span>{t("submit.fields.consent")}</span>
          </label>

          <div className="flex justify-end gap-2 border-t pt-3">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={submit.isPending}>
              {t("submit.submit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function useReportModal() {
  const [open, setOpen] = useState(false);
  return { open, setOpen };
}
