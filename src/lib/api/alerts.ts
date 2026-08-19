import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/client";
import type {
  Alert,
  AlertRule,
  AlertSeverity,
  RuleOperator,
  TelemetryMetric,
} from "@/lib/api/types";

export interface CreateAlertRulePayload {
  deviceId?: string;
  metric: TelemetryMetric;
  operator: RuleOperator;
  threshold: number;
  severity?: AlertSeverity;
  isActive?: boolean;
}

export interface ListAlertsQuery {
  metric?: TelemetryMetric;
  severity?: AlertSeverity;
  status?: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  from?: string;
  to?: string;
  skip?: number;
  take?: number;
}

export function listAlerts(
  accessToken: string,
  query: ListAlertsQuery = {},
): Promise<{ alerts: Alert[]; total: number }> {
  return apiRequest(API_ENDPOINTS.alerts.list, {
    auth: accessToken,
    query: { ...query },
  });
}

export function acknowledgeAlert(accessToken: string, alertId: string): Promise<{ alert: Alert }> {
  return apiRequest<{ alert: Alert }>(API_ENDPOINTS.alerts.acknowledge(alertId), {
    method: "PATCH",
    auth: accessToken,
  });
}

export function resolveAlert(accessToken: string, alertId: string): Promise<{ alert: Alert }> {
  return apiRequest<{ alert: Alert }>(API_ENDPOINTS.alerts.resolve(alertId), {
    method: "PATCH",
    auth: accessToken,
  });
}

export function listAlertRules(accessToken: string): Promise<{ rules: AlertRule[] }> {
  return apiRequest(API_ENDPOINTS.alerts.rules, { auth: accessToken });
}

export function createAlertRule(
  accessToken: string,
  payload: CreateAlertRulePayload,
): Promise<{ rule: AlertRule }> {
  return apiRequest<{ rule: AlertRule }>(API_ENDPOINTS.alerts.rules, {
    method: "POST",
    auth: accessToken,
    body: payload,
  });
}

export function updateAlertRule(
  accessToken: string,
  ruleId: string,
  payload: Partial<CreateAlertRulePayload>,
): Promise<{ rule: AlertRule }> {
  return apiRequest<{ rule: AlertRule }>(API_ENDPOINTS.alerts.updateRule(ruleId), {
    method: "PATCH",
    auth: accessToken,
    body: payload,
  });
}

export function deleteAlertRule(accessToken: string, ruleId: string): Promise<{ rule: AlertRule }> {
  return apiRequest<{ rule: AlertRule }>(API_ENDPOINTS.alerts.deleteRule(ruleId), {
    method: "DELETE",
    auth: accessToken,
  });
}
