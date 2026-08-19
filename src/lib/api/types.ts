// Canonical DTOs for the Jol API. Mirrors API_ENDPOINT_SPEC.md.

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RiskAreaType = "ROAD_SEGMENT" | "GRID_CELL" | "ADMIN_AREA";
export type PredictionStatus = "PENDING" | "READY" | "FAILED" | "SUPERSEDED";
export type HotspotAlgorithm = "DBSCAN" | "HDBSCAN";
export type SubmissionCategory = "ACCIDENT_REPORT" | "ROAD_DAMAGE" | "DANGEROUS_SECTION";
export type SubmissionStatus = "PENDING_MODERATION" | "APPROVED" | "REJECTED";
export type TrainingStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";
export type ReportFormat = "PDF" | "XLSX";
export type ReportStatus = "QUEUED" | "RUNNING" | "READY" | "FAILED";
export type ExplanationMethod = "SHAP" | "BASELINE_RULE";
export type ExplanationDirection = "INCREASES_RISK" | "DECREASES_RISK" | "NEUTRAL";
export type AuditEventType =
  | "IMPORT"
  | "HOTSPOT_DETECTION"
  | "PREDICTION"
  | "REPORT"
  | "MODEL_STATUS"
  | "SUBMISSION_MODERATION";
export type AuditEventStatus = "STARTED" | "SUCCEEDED" | "FAILED";
export type ModuleScope = "DATA_MANAGEMENT" | "MODEL_REGISTRY" | "MODERATION" | "POLICE";

// GeoJSON — narrow subset we actually use.
export type LngLat = [number, number];
export interface GeoPoint {
  type: "Point";
  coordinates: LngLat;
}
export interface GeoLineString {
  type: "LineString";
  coordinates: LngLat[];
}
export interface GeoPolygon {
  type: "Polygon";
  coordinates: LngLat[][];
}
export interface GeoMultiPolygon {
  type: "MultiPolygon";
  coordinates: LngLat[][][];
}
export type GeoGeometry = GeoPoint | GeoLineString | GeoPolygon | GeoMultiPolygon;

export interface ApiEnvelope<T> {
  success: true;
  data: T;
  meta: Pagination | null;
  timestamp: string;
}
export interface ApiErrorEnvelope {
  success: false;
  error: { code: string; message: string };
  timestamp: string;
  requestId?: string;
}
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
export interface Paginated<T> {
  items: T[];
  meta: Pagination;
}

export interface ForecastPeriod {
  startAt: string;
  endAt: string;
}

export type LocalizedString = Record<string, string>;

export interface FutureSignal {
  flag: string;
  code: string;
  source: string;
  title: LocalizedString;
  description: LocalizedString;
}

export interface FutureContext {
  status: "available" | "degraded";
  confidence?: string | null;
  signals: FutureSignal[];
  warnings: string[];
  providers: Record<string, any>;
  disclaimer: LocalizedString;
}

export interface Region {
  id: string;
  name: string;
  code: string;
  geometry: GeoPolygon | GeoMultiPolygon;
}

export interface Road {
  id: string;
  regionId: string;
  name: string;
  geometry: GeoLineString;
}

export interface RiskArea {
  id: string;
  regionId: string;
  roadId: string | null;
  type: RiskAreaType;
  geometry: GeoGeometry;
  isActive: boolean;
}

export interface PredictionSummary {
  id: string;
  riskAreaId: string;
  riskLevel: RiskLevel;
  score: number;
  confidence: number;
  forecastPeriod: ForecastPeriod;
  futureContext: FutureContext | null;
  algorithm: string;
  generatedAt: string;
  modelVersionId: string | null;
  osmSegmentId?: string;
  reasons?: string[];
  possiblePlan?: string[];
  uncertainty?: number;
  warnings?: string[];
  priorityRank?: number;
}

export interface RiskAreaWithPrediction extends RiskArea {
  prediction: PredictionSummary | null;
}

export interface Hotspot {
  id: string;
  geometry: GeoPolygon;
  accidentCount: number;
  density: number;
  algorithm: HotspotAlgorithm;
  parameters: Record<string, number | string | boolean>;
  period: { startAt: string; endAt: string };
}
export type HotspotSummary = Hotspot;

export interface LiveConfirmedEvent {
  id: string;
  type: SubmissionCategory;
  location: GeoPoint;
  confirmedAt: string;
  photoUrls: string[];
  title: string;
  description: string | null;
}

export interface MapLegendEntry {
  riskLevel: RiskLevel;
  color: string;
  label: string;
}

export interface MapContext {
  regionId: string;
  generatedAt: string;
  modelVersionId: string | null;
}

export interface HeatPoint {
  lat: number;
  lng: number;
  intensity?: number;
}

export interface AppMapResponse {
  context: MapContext;
  regions: Region[];
  riskAreas: RiskAreaWithPrediction[];
  hotspots: Hotspot[];
  liveConfirmedEvents: LiveConfirmedEvent[];
  heatmapData?: HeatPoint[];
  legend: MapLegendEntry[];
}

export interface DashboardStatistics {
  totalRiskAreas: number;
  readyPredictions: number;
  highRiskAreas: number;
  criticalRiskAreas: number;
  hotspotCount: number;
  injuredCount: number;
  deceasedCount: number;
}

export interface AppDashboardResponse {
  context: { regionId: string; dataFreshAt: string | null; forecastPeriod: ForecastPeriod | null };
  statistics: DashboardStatistics;
  riskDistribution: Array<{ riskLevel: RiskLevel; count: number }>;
  topPredictions: PredictionSummary[];
  recentHotspots: HotspotSummary[];
  liveConfirmedEvents: LiveConfirmedEvent[];
}

export interface AppRoadResponse {
  road: Road;
  riskAreas: RiskAreaWithPrediction[];
  hotspots: Hotspot[];
  statistics: {
    accidentCount: number;
    averageRiskScore: number | null;
  };
}

export interface AppAnalyticsResponse {
  trend: Array<{ date: string; value: number }>;
  deceasedTrend: Array<{ date: string; value: number }>;
  injuredTrend: Array<{ date: string; value: number }>;
  riskDistribution: Array<{ riskLevel: RiskLevel; count: number }>;
  accidentTypeDistribution: Array<{ type: string; count: number }>;
  timeOfDayDistribution: Array<{ hour: number; count: number }>;
  lightingDistribution: Array<{ lighting: string; count: number }>;
  topRiskAreas: PredictionSummary[];
}

export interface RiskPrediction extends PredictionSummary {
  status: PredictionStatus;
}

export interface PredictionExplanation {
  method: ExplanationMethod;
  factors: Array<{
    feature: string;
    value: string | number | boolean | null;
    impact: number;
    direction: ExplanationDirection;
    text: string;
    displayName: LocalizedString | null;
  }>;
  limitations: string[];
  humanReviewRequired: boolean;
}

export interface RiskAlert {
  id: string;
  riskLevel: Extract<RiskLevel, "HIGH" | "CRITICAL">;
  title: string;
  description: string;
  riskAreaId: string | null;
  predictionId: string | null;
  hotspotId: string | null;
  createdAt: string;
}

export interface SubmissionFileResponse {
  fileId: string;
  previewUrl: string;
}

export interface CreateSubmissionInput {
  title: string;
  description: string;
  category: SubmissionCategory;
  roadId?: string;
  location: GeoPoint;
  photos: Array<{ fileId: string }>;
  contact: { name: string; phone: string; email?: string };
}

export interface CreateSubmissionResponse {
  submissionId: string;
  trackingToken: string;
  status: "PENDING_MODERATION";
  createdAt: string;
}

export interface SubmissionStatusResponse {
  status: SubmissionStatus;
  updatedAt: string;
}

export interface ModerationSubmission {
  id: string;
  title: string;
  description: string;
  category: SubmissionCategory;
  status: SubmissionStatus;
  location: GeoPoint;
  photos: Array<{ fileId: string; previewUrl: string }>;
  contact: { name: string; phone: string; email: string | null };
  createdAt: string;
  moderatorComment?: string;
  rejectionReason?: string;
}

export interface ModelMetrics {
  precision: number;
  recall: number;
  f1: number;
  rocAuc: number;
  prAuc: number;
  calibrationError: number;
}

export interface ModelVersion {
  id: string;
  algorithm: "CATBOOST";
  status: "APPROVED" | "TRAINING" | "RETIRED";
  featureSchemaVersion: string;
  trainedAt: string;
  metrics: ModelMetrics;
  isActive: boolean;
}

export interface TrainingRun {
  id: string;
  status: TrainingStatus;
  modelVersionId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  errorSummary: string | null;
}

export interface QueuedOperation {
  operationId: string;
  status: "QUEUED";
}

export interface QueuedPrediction {
  predictionId: string;
  status: "PENDING";
}

export interface QueuedReport {
  reportId: string;
  status: "QUEUED";
}

export interface CreateTrainingRunInput {
  baseDatasetSnapshotId: string;
  includeConfirmedEventsUntil: string;
}

export interface CreatePredictionInput {
  riskAreaId: string;
  modelVersionId: string;
  forecastPeriod: ForecastPeriod;
}

export interface DetectHotspotsInput {
  startAt: string;
  endAt: string;
}

export interface CreateReportInput {
  startAt: string;
  endAt: string;
  format: ReportFormat;
  includeHotspots: boolean;
  includePredictions: boolean;
}

export interface DatasetSnapshot {
  id: string;
  checksum: string;
  schemaVersion: string;
  recordCount: number;
  createdAt: string;
}

export interface Report {
  id: string;
  title: string;
  description: string | null;
  format: ReportFormat;
  status: ReportStatus;
  createdAt: string;
  period: { startAt: string; endAt: string };
  includes: Array<"HOTSPOTS" | "PREDICTIONS" | "COORDINATES" | "ANALYSIS">;
}

export interface ReportDownload {
  reportId: string;
  downloadUrl: string;
  expiresAt: string;
}

export interface AuditEvent {
  id: string;
  scope: ModuleScope;
  eventType: AuditEventType;
  status: AuditEventStatus;
  resourceType: string;
  resourceId: string;
  parameters: Record<string, unknown>;
  createdAt: string;
}

export interface ModuleAccessToken {
  accessToken: string;
  scope: ModuleScope;
  expiresAt: string;
}
