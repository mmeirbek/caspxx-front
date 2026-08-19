import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { requireAuth } from "@/lib/auth/guards";
import { getAccessToken } from "@/lib/auth/storage";
import { createOrder } from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";
import { CARGO_TYPES } from "@/lib/utils/cargo";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PointPicker } from "@/components/map/PointPicker";

export const Route = createFileRoute("/orders/new")({
  beforeLoad: ({ context }) => requireAuth(context),
  component: NewOrderPage,
});

const newOrderSchema = z.object({
  title: z.string().min(1),
  cargoType: z.string().min(1),
  weight: z.coerce.number().min(0),
  volume: z.coerce.number().min(0),
  origin: z.string().min(1),
  originCity: z.string().optional(),
  destination: z.string().min(1),
  destinationCity: z.string().optional(),
  comment: z.string().optional(),
  originLat: z.number().min(-90).max(90),
  originLng: z.number().min(-180).max(180),
  destinationLat: z.number().min(-90).max(90),
  destinationLng: z.number().min(-180).max(180),
});

type NewOrderFormValues = z.infer<typeof newOrderSchema>;

function NewOrderPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const form = useForm<NewOrderFormValues>({
    resolver: zodResolver(newOrderSchema),
    defaultValues: {
      title: "",
      cargoType: "GENERAL",
      weight: 0,
      volume: 0,
      origin: "",
      originCity: "",
      destination: "",
      destinationCity: "",
      comment: "",
      originLat: 43.6532,
      originLng: 51.1975,
      destinationLat: 43.1789,
      destinationLng: 51.6814,
    },
  });

  async function onSubmit(values: NewOrderFormValues) {
    try {
      const { order } = await createOrder(getAccessToken() ?? "", {
        title: values.title,
        cargoType: values.cargoType,
        weight: values.weight,
        volume: values.volume,
        origin: values.origin,
        originCity: values.originCity || undefined,
        destination: values.destination,
        destinationCity: values.destinationCity || undefined,
        originLat: values.originLat,
        originLng: values.originLng,
        destinationLat: values.destinationLat,
        destinationLng: values.destinationLng,
        comment: values.comment || undefined,
      });
      toast.success(t("orders.createSuccess"));
      await navigate({ to: "/orders/$orderId", params: { orderId: order.id } });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t("common.error");
      toast.error(message);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to="/orders" className="text-sm text-muted-foreground hover:underline">
          ← {t("orders.title")}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{t("orders.create")}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("orders.details")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("orders.fields.title")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cargoType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("orders.fields.cargoType")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CARGO_TYPES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.icon} {t(`orders.cargoTypes.${c.value}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("orders.fields.weight")}</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="volume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("orders.fields.volume")}</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("orders.fields.origin")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="originCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("orders.fields.originCity")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="originLat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lat</FormLabel>
                        <FormControl>
                          <Input type="number" step="any" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="originLng"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lng</FormLabel>
                        <FormControl>
                          <Input type="number" step="any" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="destination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("orders.fields.destination")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="destinationCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("orders.fields.destinationCity")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="destinationLat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lat</FormLabel>
                        <FormControl>
                          <Input type="number" step="any" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="destinationLng"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lng</FormLabel>
                        <FormControl>
                          <Input type="number" step="any" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="originLat"
                  render={() => (
                    <FormItem>
                      <FormLabel>{t("orders.fields.origin")} (карта)</FormLabel>
                      <FormControl>
                        <PointPicker
                          value={{
                            lat: form.watch("originLat"),
                            lng: form.watch("originLng"),
                          }}
                          onChange={(v) => {
                            form.setValue("originLat", v.lat, { shouldValidate: true });
                            form.setValue("originLng", v.lng, { shouldValidate: true });
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="destinationLat"
                  render={() => (
                    <FormItem>
                      <FormLabel>{t("orders.fields.destination")} (карта)</FormLabel>
                      <FormControl>
                        <PointPicker
                          value={{
                            lat: form.watch("destinationLat"),
                            lng: form.watch("destinationLng"),
                          }}
                          onChange={(v) => {
                            form.setValue("destinationLat", v.lat, { shouldValidate: true });
                            form.setValue("destinationLng", v.lng, { shouldValidate: true });
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("orders.fields.comment")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" asChild>
                  <Link to="/orders">{t("common.cancel")}</Link>
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {t("orders.create")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
