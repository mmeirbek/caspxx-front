import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { requireRole } from "@/lib/auth/guards";
import { getAccessToken } from "@/lib/auth/storage";
import { applyCarrier } from "@/lib/api/carrier";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/carrier/apply")({
  beforeLoad: ({ context }) => requireRole(context, ["CARRIER"]),
  component: CarrierApplyPage,
});

const applySchema = z.object({
  experienceYears: z.coerce.number().int().min(0).max(80),
  transportType: z.string().min(1),
  description: z.string().optional(),
});

type ApplyFormValues = z.infer<typeof applySchema>;

function CarrierApplyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const form = useForm<ApplyFormValues>({
    resolver: zodResolver(applySchema),
    defaultValues: { experienceYears: 0, transportType: "ROAD", description: "" },
  });

  async function onSubmit(values: ApplyFormValues) {
    try {
      await applyCarrier(getAccessToken() ?? "", {
        experienceYears: values.experienceYears,
        transportType: values.transportType,
        description: values.description || undefined,
      });
      toast.success(t("carrier.applySuccess"));
      await navigate({ to: "/orders" });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t("common.error");
      toast.error(message);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-8">
      <div>
        <Link to="/orders" className="text-sm text-muted-foreground hover:underline">
          ← {t("orders.title")}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{t("carrier.apply")}</h1>
        <p className="text-sm text-muted-foreground">{t("carrier.applyHint")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("carrier.profile")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="experienceYears"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("carrier.experienceYears")}</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={80} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="transportType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("carrier.transportType")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("carrier.description")}</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {t("carrier.submit")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
