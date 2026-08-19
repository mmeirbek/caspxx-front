export type UserRole = "CLIENT" | "CARRIER" | "SUPERADMIN";

export type UserStatus = "ACTIVE" | "SUSPENDED";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  companyName: string | null;
  companyLogo: string | null;
  city: string | null;
  country: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export type OrderStatus =
  | "NEW"
  | "SEARCHING"
  | "ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "AT_CHECKPOINT"
  | "DELIVERED"
  | "CANCELLED";

export interface Order {
  id: string;
  clientId: string;
  carrierId: string | null;
  title: string;
  cargoType: string;
  weight: number;
  volume: number;
  origin: string;
  originCity: string | null;
  originCountry: string | null;
  destination: string;
  destinationCity: string | null;
  destinationCountry: string | null;
  originLat: number | null;
  originLng: number | null;
  destinationLat: number | null;
  destinationLng: number | null;
  cargoPhotoUrl: string | null;
  productPhotoUrls: string[];
  comment: string | null;
  estimatedPrice: number | null;
  estimatedDeliveryTime: number | null;
  estimatedCarrierSearchTime: number | null;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RouteGeometry {
  type: string;
  coordinates: number[][];
}

export interface RouteResponse {
  routeId: string | null;
  orderId: string | null;
  distanceKm: number;
  durationMinutes: number;
  geometry: RouteGeometry;
}

export interface Vehicle {
  id: string;
  carrierId: string;
  type: string;
  brand: string;
  model: string;
  year: number;
  plateNumber: string;
  capacityTons: number;
  cargoVolume: number;
  vehicleImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DeviceStatus = "ACTIVE" | "SUSPENDED" | "RETIRED";

export interface Device {
  id: string;
  name: string;
  status: DeviceStatus;
  vehicleId: string | null;
  lastLat: number | null;
  lastLng: number | null;
  lastSeenAt: string | null;
  createdAt: string;
}

export interface DeviceWithSecret {
  device: Device;
  secret: string;
}

export type TelemetryMetric = "TEMPERATURE" | "HUMIDITY" | "BATTERY" | "SPEED";
export type RuleOperator = "GT" | "GTE" | "LT" | "LTE";
export type AlertSeverity = "WARNING" | "CRITICAL";
export type AlertStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";

export interface TelemetryRecord {
  id: string;
  deviceId: string;
  vehicleId: string | null;
  orderId: string | null;
  temperature: number | null;
  humidity: number | null;
  battery: number | null;
  speedKmh: number | null;
  lat: number;
  lng: number;
  eventTime: string;
  createdAt: string;
}

export type TelemetryBucket = "1m" | "5m" | "15m" | "1h" | "6h" | "1d";

export interface TelemetryAggregate {
  sum: number;
  count: number;
  min: number;
  max: number;
}

export interface TelemetryPoint {
  time: string;
  count: number;
  lat: number | null;
  lng: number | null;
  temperature?: TelemetryAggregate | null;
  humidity?: TelemetryAggregate | null;
  battery?: TelemetryAggregate | null;
  speed?: TelemetryAggregate | null;
}

export interface TelemetryHistory {
  deviceId?: string;
  vehicleId?: string;
  orderId?: string;
  bucket: TelemetryBucket;
  points: TelemetryPoint[];
}

export interface Alert {
  id: string;
  deviceId: string;
  vehicleId: string | null;
  orderId: string | null;
  ruleId: string | null;
  metric: TelemetryMetric;
  value: number;
  severity: AlertSeverity;
  message: string;
  status: AlertStatus;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
  createdAt: string;
}

export interface AlertRule {
  id: string;
  deviceId: string | null;
  metric: TelemetryMetric;
  operator: RuleOperator;
  threshold: number;
  severity: AlertSeverity;
  isActive: boolean;
  createdAt: string;
}

export interface RealtimeTelemetryEvent {
  deviceId: string;
  vehicleId: string | null;
  orderId: string | null;
  temperature?: number | null;
  humidity?: number | null;
  battery?: number | null;
  speedKmh?: number | null;
  lat: number;
  lng: number;
  eventTime: string;
  createdAt: string;
}

export interface RealtimeStatusEvent {
  deviceId: string;
  vehicleId: string | null;
  status?: "online" | "offline" | "booting";
  battery?: number | null;
  eventTime?: string;
}

export interface RealtimeAlertEvent {
  id: string;
  deviceId: string;
  vehicleId: string | null;
  orderId: string | null;
  metric: string;
  value: number;
  severity: string;
  message: string;
  createdAt: string;
}

export type PredictionRiskLevel = "low" | "medium" | "high";

export interface LandPrediction {
  orderId: string;
  recommendation: string;
  riskLevel: string;
  bestDepartureTime: string;
  expectedDelayMinutes: number;
  shortExplanation: string;
}

export interface CargoTypeOption {
  value: string;
  label: string;
}

export interface UploadResult {
  url: string;
}

export interface ErrorEnvelope {
  statusCode: number;
  message: string | string[];
  error?: string;
}
