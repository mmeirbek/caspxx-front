export type UserRole = "CLIENT" | "CARRIER" | "ADMIN" | "SUPERADMIN";

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
  originSettlementId: string | null;
  originCity: string | null;
  originCountry: string | null;
  destination: string;
  destinationSettlementId: string | null;
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
  isReefer: boolean;
  tempMin: number | null;
  tempMax: number | null;
  optimalTemperature: number | null;
  optimalHumidity: number | null;
  isFragile: boolean;
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

export type RealtimeOrderEvent = {
  order: Order;
};

export type RealtimeCameraEvent = {
  deviceId: string;
  vehicleId: string | null;
  orderId: string | null;
  url: string;
  capturedAt: string;
};

export interface CameraSnapshot {
  id: string;
  deviceId: string;
  vehicleId: string | null;
  orderId: string | null;
  url: string;
  capturedAt: string;
  createdAt: string;
}

export type PredictionRiskLevel = "low" | "medium" | "high";

export interface PredictionData {
  route: {
    distanceKm: number;
    durationHours: number;
  };
  weather: {
    risk: PredictionRiskLevel;
    wind: number;
    rain: boolean;
  };
  checkpoints: Array<{
    name: string;
    load: number;
    wait: number;
  }>;
  railway: Array<{
    station: string;
    load: number;
  }>;
}

export interface LandPrediction {
  orderId: string;
  title: string;
  origin: string;
  destination: string;
  recommendation: string;
  riskLevel: string;
  bestDepartureTime: string;
  expectedDelayMinutes: number;
  shortExplanation: string;
  data: PredictionData;
  source: string;
  generatedAt: string;
}

export interface LandPredictionListResponse {
  predictions: LandPrediction[];
}

export interface GeocodeResult {
  label: string;
  latitude: number;
  longitude: number;
  settlementId: string | null;
  source: "local" | "osm";
}

export interface GeocodeResponse {
  results: GeocodeResult[];
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

export interface Settlement {
  id: string;
  name: string;
  nameRu: string;
  nameKk: string;
  type: string;
  district: string;
  latitude: number;
  longitude: number;
  source: string;
}

export interface SettlementEnvelope {
  settlement: Settlement;
}

export interface SettlementsListResponse {
  settlements: Settlement[];
}

export interface RouteConditionWarning {
  type: string;
  severity: "info" | "warning" | "critical";
  message: string;
}

export interface RouteConditionsSummary {
  maxTemperature: number | null;
  minTemperature: number | null;
  maxWindMs: number | null;
  rain: boolean;
  snow: boolean;
  dust: boolean;
  warnings: RouteConditionWarning[];
  estimatedDelayMinutes: number;
}

export interface RouteWeatherPoint {
  lat: number;
  lng: number;
  temperature: number;
  windSpeed: number;
  rain: boolean;
  snow: boolean;
  description: string;
}

export interface RouteCheckpoint {
  name: string;
  loadPercent: number;
}

export interface RouteConditions {
  orderId: string;
  origin: string;
  destination: string;
  distanceKm: number;
  durationMinutes: number;
  etaMinutes: number;
  conditions: RouteConditionsSummary;
  weather: RouteWeatherPoint[] | null;
  nearbyCheckpoints: RouteCheckpoint[];
  warnings: RouteConditionWarning[];
  weatherAvailable: boolean;
  generatedAt: string;
}

export interface AnalyticsFlow {
  origin: string;
  destination: string;
  count: number;
  totalWeight: number;
  totalVolume: number;
}

export interface AnalyticsFlows {
  flows: AnalyticsFlow[];
  totalOrders: number;
  totalWeight: number;
  totalVolume: number;
  periodDays: number | null;
  generatedAt: string;
}

export interface AnalyticsRegionalSummary {
  totalOrders: number;
  deliveredOrders: number;
  activeTrips: number;
  activeVehicles: number;
  totalTelemetryReadings: number;
  totalKm: number;
  generatedAt: string;
}

export interface AnalyticsEconomic {
  totalKm: number;
  emptyKmBaseline: number;
  emptyKmOptimized: number;
  savedEmptyKm: number;
  totalFuelLiters: number;
  savedFuelLiters: number;
  fuelPriceTengePerLiter: number;
  savedMoneyTenge: number;
  savedHours: number;
  assumptions: {
    baselineEmptyRatio: number;
    optimizedEmptyRatio: number;
    fuelLitersPerKm: number;
    fuelPriceTengePerLiter: number;
    avgSpeedKmh: number;
    note: string;
  };
  generatedAt: string;
}

export interface CalculatedRoute {
  id: string;
  distanceKm: number;
  durationMinutes: number;
  geometry: RouteGeometry;
}

export interface OrderCreationResponse {
  order: Order;
  route: CalculatedRoute | null;
  routeCalculated: boolean;
}

export interface OrderAssignmentResponse {
  order: Order;
  capacityTons: number;
  freeCapacityTons: number;
}

export interface CarrierRoutePlanOrder {
  id: string;
  title: string;
  origin: string;
  destination: string;
  weight: number;
  volume: number;
}

export interface CarrierRoutePlanStop {
  orderId: string;
  action: "pickup" | "delivery";
  lat: number;
  lng: number;
}

export interface CarrierRoutePlanVehicle {
  id: string;
  plateNumber: string;
  capacityTons: number;
}

export interface CarrierRoutePlan {
  orders: CarrierRoutePlanOrder[];
  vehicle: CarrierRoutePlanVehicle | null;
  capacityTons: number;
  freeTons: number;
  savedFuelLiters: number;
  savedMoneyTenge: number;
  savedEmptyKm: number;
  savedHours: number;
  route: {
    distanceKm: number;
    durationMinutes: number;
    geometry: RouteGeometry;
  } | null;
  stops: CarrierRoutePlanStop[];
  sequence: string[];
  strategy: "vroom" | "greedy" | "none";
}
