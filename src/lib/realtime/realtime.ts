import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "@/lib/auth/storage";
import type {
  RealtimeAlertEvent,
  RealtimeStatusEvent,
  RealtimeTelemetryEvent,
} from "@/lib/api/types";

export type RealtimeChannelType = "vehicle" | "order" | "device";
export type RealtimeSubscription = { type: RealtimeChannelType; id: string };

export interface RealtimeHandlers {
  onTelemetry?: (event: RealtimeTelemetryEvent) => void;
  onStatus?: (event: RealtimeStatusEvent) => void;
  onAlert?: (event: RealtimeAlertEvent) => void;
  onDisconnect?: (reason: string) => void;
}

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
const NAMESPACE = "/caspex";

let socket: Socket | null = null;
let handlers: RealtimeHandlers | null = null;
const activeSubscriptions = new Set<string>();

function getSocket(): Socket | null {
  if (socket) return socket;
  const token = getAccessToken();
  if (!token) return null;

  socket = io(`${SOCKET_URL}${NAMESPACE}`, {
    transports: ["websocket"],
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on("telemetry", (event: RealtimeTelemetryEvent) => handlers?.onTelemetry?.(event));
  socket.on("status", (event: RealtimeStatusEvent) => handlers?.onStatus?.(event));
  socket.on("alert", (event: RealtimeAlertEvent) => handlers?.onAlert?.(event));
  socket.on("disconnect", (reason: string) => handlers?.onDisconnect?.(reason));

  return socket;
}

export function connectRealtime(nextHandlers: RealtimeHandlers | null): void {
  handlers = nextHandlers;
  const sock = getSocket();
  if (!sock || sock.connected) return;
  sock.connect();
  for (const key of activeSubscriptions) {
    const [type, id] = key.split(":");
    sock.emit("subscribe", { type, id });
  }
}

export function disconnectRealtime(): void {
  handlers = null;
  activeSubscriptions.clear();
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function subscribeRealtime(subscription: RealtimeSubscription): void {
  const key = `${subscription.type}:${subscription.id}`;
  activeSubscriptions.add(key);
  const sock = getSocket();
  if (sock) sock.emit("subscribe", subscription);
}

export function unsubscribeRealtime(subscription: RealtimeSubscription): void {
  const key = `${subscription.type}:${subscription.id}`;
  activeSubscriptions.delete(key);
  const sock = getSocket();
  if (sock) sock.emit("unsubscribe", subscription);
}

export function setRealtimeHandlers(nextHandlers: RealtimeHandlers): void {
  handlers = nextHandlers;
}
