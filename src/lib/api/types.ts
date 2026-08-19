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

export type DeviceStatus = "ACTIVE" | "INACTIVE";

export interface Device {
  id: string;
  name: string;
  serialNumber: string;
  secret: string;
  vehicleId: string | null;
  status: DeviceStatus;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceWithSecret {
  device: Device;
  secret: string;
}

export interface TelemetryRecord {
  id: string;
  deviceId: string;
  vehicleId: string | null;
  orderId: string | null;
  temperatureC: number | null;
  humidityPct: number | null;
  speedKmh: number | null;
  fuelLevelPct: number | null;
  latitude: number;
  longitude: number;
  recordedAt: string;
}

export interface TelemetryAggregate {
  min: number | null;
  avg: number | null;
  max: number | null;
}

export interface TelemetryBucket {
  ts: string;
  count: number;
  avgLat: number | null;
  avgLng: number | null;
  temperature: TelemetryAggregate | null;
  humidity: TelemetryAggregate | null;
  speed: TelemetryAggregate | null;
  fuel: TelemetryAggregate | null;
}

export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";
export type AlertStatus = "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";

export interface Alert {
  id: string;
  deviceId: string;
  vehicleId: string | null;
  orderId: string | null;
  ruleId: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  status: AlertStatus;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
}

export type AlertMetric = "TEMPERATURE" | "HUMIDITY" | "SPEED" | "FUEL";
export type AlertOperator = "GT" | "LT" | "GTE" | "LTE" | "EQ";

export interface AlertRule {
  id: string;
  name: string;
  metric: AlertMetric;
  operator: AlertOperator;
  threshold: number;
  severity: AlertSeverity;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PredictionModel = "ARIMA" | "SARIMA" | "PROPHET";

export interface LandPrediction {
  routeId: string | null;
  orderId: string | null;
  etaMinutes: number;
  confidence: number;
  fuelEstimateLiters: number;
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  model: PredictionModel;
  summary: string;
  predictedAt: string;
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
