import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  CalendarDots,
  CaretLeft,
  CaretRight,
  CheckCircle,
  Clock,
  Gauge,
  List,
  Package,
  TrendUp,
  Truck,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth/auth-provider";
import { getAccessToken } from "@/lib/auth/storage";
import { assignOrder, listAvailableOrders, listMineOrders } from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";
import { getCarrierProfile } from "@/lib/api/carrier";
import { listVehicles } from "@/lib/api/vehicles";
import { calculateRoute } from "@/lib/api/routes";
import { liveTelemetryForOrder } from "@/lib/api/telemetry";
import { latestCameraForOrder } from "@/lib/api/cameras";
import { connectRealtime, subscribeRealtime, unsubscribeRealtime } from "@/lib/realtime/realtime";
import type {
  Order,
  RealtimeCameraEvent,
  RealtimeTelemetryEvent,
  RouteGeometry,
} from "@/lib/api/types";

import { JetkizMap } from "./JetkizMap";
import { RightPanel, type KpiItem } from "./RightPanel";
import { AcceptOrderNotification } from "./AcceptOrderNotification";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";

const ACTIVE_STATUSES = new Set(["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "AT_CHECKPOINT"]);
const DONE_STATUSES = new Set(["DELIVERED", "CANCELLED"]);
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function JetkizHome() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const token = getAccessToken() ?? "";
  const queryClient = useQueryClient();
  const isCarrier = user?.role === "CARRIER";

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [trucks, setTrucks] = useState<Record<string, { lat: number; lng: number }>>({});
  const [liveByOrder, setLiveByOrder] = useState<Record<string, RealtimeTelemetryEvent>>({});
  const [cameraByOrder, setCameraByOrder] = useState<Record<string, string | null>>({});
  const [acceptQueue, setAcceptQueue] = useState<Order[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const seenRef = useRef<Set<string>>(new Set());
  const firstLoadRef = useRef(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSidebarOpen(window.matchMedia("(min-width: 768px)").matches);
  }, []);

  const mine = useQuery({
    queryKey: ["orders", "mine"],
    queryFn: () => listMineOrders(token),
    enabled: !!user,
  });
  const availableQ = useQuery({
    queryKey: ["orders", "available"],
    queryFn: () => listAvailableOrders(token),
    enabled: isCarrier,
    refetchInterval: 30_000,
  });
  const vehiclesQ = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => listVehicles(token),
    enabled: isCarrier,
  });
  const carrierProfileQ = useQuery({
    queryKey: ["carrier", "profile"],
    queryFn: () => getCarrierProfile(token),
    enabled: isCarrier,
    retry: 0,
  });
  const canTakeOrders = !isCarrier || carrierProfileQ.data?.carrierProfile.isApproved === true;

  const myOrders = useMemo(() => mine.data?.orders ?? [], [mine.data?.orders]);
  const vehicles = vehiclesQ.data?.vehicles ?? [];
  const carrierCapacity = useMemo(() => {
    const vehicle = vehicles[0];
    const loadedOrders = myOrders.filter((o) => ACTIVE_STATUSES.has(o.status));
    const loadedWeight = loadedOrders.reduce((sum, o) => sum + o.weight, 0);
    const loadedVolume = loadedOrders.reduce((sum, o) => sum + o.volume, 0);
    const totalWeight = (vehicle?.capacityTons ?? 0) * 1000;
    const totalVolume = vehicle?.cargoVolume ?? 0;

    return {
      freeWeight: Math.max(0, totalWeight - loadedWeight),
      freeVolume: Math.max(0, totalVolume - loadedVolume),
      totalWeight,
      totalVolume,
    };
  }, [myOrders, vehicles]);
  const available = useMemo(
    () =>
      (availableQ.data?.orders ?? []).filter(
        (order) =>
          order.weight <= carrierCapacity.freeWeight &&
          order.volume <= carrierCapacity.freeVolume,
      ),
    [availableQ.data?.orders, carrierCapacity.freeWeight, carrierCapacity.freeVolume],
  );

  const activeOrders = useMemo(
    () =>
      myOrders
        .filter((o) => ACTIVE_STATUSES.has(o.status))
        .filter(
          (o) =>
            o.originLat != null &&
            o.originLng != null &&
            o.destinationLat != null &&
            o.destinationLng != null,
        ),
    [myOrders],
  );
  const activeIds = activeOrders.map((o) => o.id).join(",");

  const routesQ = useQuery({
    queryKey: ["routes", "active", activeIds],
    queryFn: async () => {
      const results = await Promise.all(
        activeOrders.map((o) =>
          calculateRoute(token, {
            orderId: o.id,
            startLat: o.originLat as number,
            startLng: o.originLng as number,
            endLat: o.destinationLat as number,
            endLng: o.destinationLng as number,
          }),
        ),
      );
      const map: Record<string, RouteGeometry> = {};
      results.forEach((r, i) => {
        map[activeOrders[i].id] = r.geometry;
      });
      return map;
    },
    enabled: activeOrders.length > 0,
    staleTime: 10 * 60_000,
  });
  const routes = routesQ.data ?? {};

  const liveQ = useQuery({
    queryKey: ["live", "active", activeIds],
    queryFn: async () => {
      const results = await Promise.all(
        activeOrders.map((o) => liveTelemetryForOrder(token, o.id)),
      );
      const map: Record<string, RealtimeTelemetryEvent> = {};
      const truckMap: Record<string, { lat: number; lng: number }> = {};
      results.forEach((r, i) => {
        if (r.telemetry) {
          map[activeOrders[i].id] = { ...r.telemetry };
          truckMap[activeOrders[i].id] = { lat: r.telemetry.lat, lng: r.telemetry.lng };
        }
      });
      return { map, truckMap };
    },
    enabled: activeOrders.length > 0,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!liveQ.data) return;
    setLiveByOrder((prev) => ({ ...liveQ.data!.map, ...prev }));
    setTrucks((prev) => ({ ...liveQ.data!.truckMap, ...prev }));
  }, [liveQ.data]);

  const camerasQ = useQuery({
    queryKey: ["cameras", "active", activeIds],
    queryFn: async () => {
      const results = await Promise.all(activeOrders.map((o) => latestCameraForOrder(token, o.id)));
      const map: Record<string, string | null> = {};
      results.forEach((r, i) => {
        map[activeOrders[i].id] = r.snapshot?.url ?? null;
      });
      return map;
    },
    enabled: activeOrders.length > 0,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!camerasQ.data) return;
    setCameraByOrder((prev) => ({ ...camerasQ.data!, ...prev }));
  }, [camerasQ.data]);

  function enqueueNewOrder(order: Order) {
    if (seenRef.current.has(order.id)) return;
    seenRef.current.add(order.id);
    setAcceptQueue((q) => (q.some((x) => x.id === order.id) ? q : [...q, order]));
  }
  const enqueueRef = useRef(enqueueNewOrder);
  enqueueRef.current = enqueueNewOrder;

  function openAccept(order: Order) {
    setAcceptQueue((q) => (q.some((x) => x.id === order.id) ? q : [...q, order]));
  }

  function dismissOrder(id: string) {
    seenRef.current.add(id);
    setAcceptQueue((q) => q.filter((x) => x.id !== id));
  }

  useEffect(() => {
    if (!isCarrier) return;
    if (firstLoadRef.current) {
      available.forEach((o) => seenRef.current.add(o.id));
      firstLoadRef.current = false;
      return;
    }
    available.forEach((o) => {
      if (!seenRef.current.has(o.id)) enqueueRef.current(o);
    });
  }, [available, isCarrier]);

  useEffect(() => {
    if (!user) return;
    const orderSubs = activeOrders.map((o) => ({ type: "order" as const, id: o.id }));
    if (isCarrier) {
      subscribeRealtime({ type: "orders", id: "available" });
    }
    orderSubs.forEach((s) => subscribeRealtime(s));
    connectRealtime({
      onTelemetry: (ev: RealtimeTelemetryEvent) => {
        if (ev.orderId) {
          setTrucks((prev) => ({ ...prev, [ev.orderId!]: { lat: ev.lat, lng: ev.lng } }));
          setLiveByOrder((prev) => ({ ...prev, [ev.orderId!]: ev }));
        }
      },
      onOrderAvailable: (ev) => {
        if (
          ev.order.weight <= carrierCapacity.freeWeight &&
          ev.order.volume <= carrierCapacity.freeVolume
        ) {
          enqueueRef.current(ev.order);
        }
      },
      onOrderStatus: (ev) => {
        queryClient.setQueryData<{ orders: Order[] }>(["orders", "mine"], (current) =>
          current
            ? {
                orders: current.orders.map((order) =>
                  order.id === ev.order.id ? ev.order : order,
                ),
              }
            : current,
        );
        queryClient.setQueryData<{ orders: Order[] }>(["orders", "available"], (current) =>
          current
            ? { orders: current.orders.filter((order) => order.id !== ev.order.id) }
            : current,
        );
      },
      onCamera: (ev: RealtimeCameraEvent) => {
        if (ev.orderId) setCameraByOrder((prev) => ({ ...prev, [ev.orderId!]: ev.url }));
      },
    });
    return () => {
      orderSubs.forEach((s) => unsubscribeRealtime(s));
      if (isCarrier) {
        unsubscribeRealtime({ type: "orders", id: "available" });
      }
    };
  }, [
    activeOrders,
    activeIds,
    carrierCapacity.freeVolume,
    carrierCapacity.freeWeight,
    isCarrier,
    queryClient,
    user,
  ]);

  const acceptMutation = useMutation({
    mutationFn: (order: Order) => assignOrder(token, order.id),
    onSuccess: ({ order: assignedOrder }, order) => {
      setAcceptingId(null);
      toast.success(t("jetkiz.accept.swipeSuccess"));
      seenRef.current.add(order.id);
      setAcceptQueue((q) => q.filter((x) => x.id !== order.id));
      queryClient.setQueryData<{ orders: Order[] }>(["orders", "mine"], (current) => ({
        orders: current?.orders.some((item) => item.id === assignedOrder.id)
          ? current.orders.map((item) => (item.id === assignedOrder.id ? assignedOrder : item))
          : [assignedOrder, ...(current?.orders ?? [])],
      }));
      queryClient.setQueryData<{ orders: Order[] }>(["orders", "available"], (current) =>
        current
          ? { orders: current.orders.filter((item) => item.id !== assignedOrder.id) }
          : current,
      );
      subscribeRealtime({ type: "order", id: order.id });
      void queryClient.invalidateQueries({ queryKey: ["orders", "mine"] });
      void queryClient.invalidateQueries({ queryKey: ["orders", "available"] });
      void queryClient.invalidateQueries({ queryKey: ["routes", "active"] });
      void queryClient.invalidateQueries({ queryKey: ["live", "active"] });
      void queryClient.invalidateQueries({ queryKey: ["cameras", "active"] });
    },
    onError: (error) => {
      setAcceptingId(null);
      toast.error(error instanceof ApiError ? error.message : t("common.error"));
    },
  });

  const loaded = myOrders.filter(
    (o) => ACTIVE_STATUSES.has(o.status) || o.status === "SEARCHING" || o.status === "NEW",
  );
  const totalCapacity = carrierCapacity.totalWeight;
  const loadedWeight = totalCapacity - carrierCapacity.freeWeight;
  const totalVolume = carrierCapacity.totalVolume;
  const loadedVolume = totalVolume - carrierCapacity.freeVolume;
  const freeWeight = carrierCapacity.freeWeight;
  const freeVolume = carrierCapacity.freeVolume;
  const freeSpacePct =
    totalCapacity > 0 ? Math.round((freeWeight / totalCapacity) * 100) : undefined;

  const kpis: KpiItem[] = isCarrier
    ? [
        {
          icon: Truck,
          label: t("jetkiz.kpi.myActive"),
          value: myOrders.filter((o) => !DONE_STATUSES.has(o.status)).length,
        },
        { icon: Package, label: t("jetkiz.kpi.myTotal"), value: myOrders.length },
        { icon: TrendUp, label: t("jetkiz.kpi.available"), value: available.length },
        {
          icon: Truck,
          label: t("jetkiz.kpi.inTransit"),
          value: myOrders.filter((o) => o.status === "IN_TRANSIT").length,
        },
        {
          icon: CheckCircle,
          label: t("jetkiz.kpi.delivered"),
          value: myOrders.filter((o) => o.status === "DELIVERED").length,
        },
        {
          icon: Gauge,
          label: t("jetkiz.kpi.freeSpace"),
          value:
            freeSpacePct != null
              ? t("jetkiz.kpi.freeSpaceValue", { pct: freeSpacePct })
              : undefined,
        },
      ]
    : [
        {
          icon: Package,
          label: t("jetkiz.kpi.activeOrders"),
          value: myOrders.filter((o) => !DONE_STATUSES.has(o.status)).length,
        },
        { icon: Package, label: t("jetkiz.kpi.totalOrders"), value: myOrders.length },
        {
          icon: Clock,
          label: t("jetkiz.kpi.awaitingCarrier"),
          value: myOrders.filter((o) => o.status === "SEARCHING" || o.status === "NEW").length,
        },
        {
          icon: Truck,
          label: t("jetkiz.kpi.inTransit"),
          value: myOrders.filter((o) => o.status === "IN_TRANSIT").length,
        },
        {
          icon: CheckCircle,
          label: t("jetkiz.kpi.delivered"),
          value: myOrders.filter((o) => o.status === "DELIVERED").length,
        },
        {
          icon: CalendarDots,
          label: t("jetkiz.kpi.thisWeek"),
          value: myOrders.filter((o) => Date.now() - new Date(o.createdAt).getTime() < WEEK_MS)
            .length,
        },
      ];

  const sensorItems = activeOrders.map((o) => ({
    orderId: o.id,
    title: o.title,
    temperature: liveByOrder[o.id]?.temperature ?? null,
    humidity: liveByOrder[o.id]?.humidity ?? null,
  }));

  const cameraOrder = activeOrders.find((o) => cameraByOrder[o.id]) ?? activeOrders[0];
  const cameraItems = cameraOrder
    ? [
        {
          orderId: cameraOrder.id,
          title: t("jetkiz.camera.baggageTitle"),
          url: cameraByOrder[cameraOrder.id] ?? null,
        },
      ]
    : [];

  const availableRows = available.map((o) => ({
    order: o,
    compatible: o.weight <= freeWeight && o.volume <= freeVolume,
  }));

  const latestTime = Object.values(liveByOrder).reduce<string | null>(
    (max, ev) => (!max || new Date(ev.eventTime) > new Date(max) ? ev.eventTime : max),
    null,
  );
  const updatedAt = latestTime ?? new Date().toISOString();

  if (mine.isLoading) return <LoadingState />;
  if (mine.isError) return <ErrorState onRetry={() => void mine.refetch()} />;

  const mapOrders = isCarrier ? available : myOrders;

  return (
    <div className="relative block h-[calc(100vh-3.5rem)] w-full overflow-hidden">
      <div className="absolute inset-0 z-0">
        <JetkizMap
          orders={mapOrders}
          routes={routes}
          trucks={trucks}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onOrderClick={isCarrier ? openAccept : undefined}
        />
      </div>

      {!sidebarOpen && (
        <button
          className="absolute right-3 top-3 z-[455] flex h-10 w-10 items-center justify-center rounded-md bg-card shadow-md md:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label={t("jetkiz.openPanel")}
        >
          <List className="h-5 w-5" />
        </button>
      )}

      <button
        type="button"
        onClick={() => {
          if (isCarrier) {
            setSidebarOpen((v) => !v);
          } else {
            void navigate({ to: "/orders/new" });
          }
        }}
        aria-expanded={isCarrier ? sidebarOpen : undefined}
        className={
          "pointer-events-auto absolute bottom-4 z-[460] inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-md transition-[left] duration-300 ease-out hover:bg-muted " +
          (isCarrier
            ? sidebarOpen
              ? "left-[calc((100%-min(85vw,24rem))/2)] md:left-[31%] lg:left-[33%] xl:left-[35%]"
              : "left-1/2 -translate-x-1/2"
            : "left-1/2 -translate-x-1/2")
        }
      >
        {isCarrier ? (
          <>
            <List className="h-4 w-4" />
            {sidebarOpen ? t("jetkiz.closePanel") : t("jetkiz.openPanel")}
          </>
        ) : (
          <>
            <Package className="h-4 w-4" />
            {t("orders.create")}
          </>
        )}
      </button>

      {sidebarOpen && (
        <div
          className="absolute inset-0 z-[455] bg-background/60 backdrop-blur-[1px] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <button
        type="button"
        onClick={() => setSidebarOpen((v) => !v)}
        aria-expanded={sidebarOpen}
        className={
          "pointer-events-auto absolute top-1/2 z-[460] hidden -translate-y-1/2 items-center justify-center rounded-l-md border border-r-0 bg-card p-1.5 shadow-md transition-[right] duration-300 ease-out hover:bg-muted md:flex " +
          (sidebarOpen ? "md:right-[38%] lg:right-[34%] xl:right-[30%]" : "right-0")
        }
      >
        {sidebarOpen ? <CaretRight className="h-4 w-4" /> : <CaretLeft className="h-4 w-4" />}
      </button>

      <aside
        aria-hidden={!sidebarOpen}
        className={
          "pointer-events-auto absolute inset-y-0 right-0 z-[458] flex w-[85%] max-w-sm transition-transform duration-300 ease-out md:w-[38%] md:max-w-none lg:w-[34%] xl:w-[30%] " +
          (sidebarOpen ? "translate-x-0" : "translate-x-full")
        }
      >
        <RightPanel
          role={user?.role ?? "CLIENT"}
          kpis={kpis}
          updatedAt={updatedAt}
          sensorItems={sensorItems}
          cameraItems={cameraItems}
          availableRows={availableRows}
          freeWeight={freeWeight}
          freeVolume={freeVolume}
          takePendingId={acceptingId}
          onTake={(o) => openAccept(o)}
          predictionOrders={myOrders}
          recentOrders={myOrders}
          canTake={canTakeOrders}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      <AcceptOrderNotification
        queue={acceptQueue}
        onAccept={(o) => {
          setAcceptingId(o.id);
          acceptMutation.mutate(o);
        }}
        onDismiss={dismissOrder}
      />
    </div>
  );
}
