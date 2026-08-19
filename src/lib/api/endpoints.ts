// Central registry of API paths. Keeps every endpoint in one auditable place.

export const endpoints = {
  moduleAccess: {
    unlock: "/module-access/unlock",
    status: "/module-access/status",
    lock: "/module-access/lock",
  },
  roads: "/roads",
  app: {
    dashboard: "/app/dashboard",
    map: "/app/map",
    road: (id: string) => `/app/roads/${id}`,
    analytics: "/app/analytics",
  },
  predictions: {
    list: "/risk-predictions",
    detail: (id: string) => `/risk-predictions/${id}`,
    explanation: (id: string) => `/risk-predictions/${id}/explanation`,
  },
  hotspots: {
    list: "/hotspots",
    detect: "/hotspots/detect",
  },
  liveEvents: {
    list: "/live-confirmed-events",
  },
  submissions: {
    files: "/submission-files",
    create: "/submissions",
    status: (id: string) => `/submissions/${id}/status`,
  },
  moderation: {
    list: "/moderation/submissions",
    approve: (id: string) => `/moderation/submissions/${id}/approve`,
    reject: (id: string) => `/moderation/submissions/${id}/reject`,
  },
  training: {
    runs: "/model-training-runs",
    run: (id: string) => `/model-training-runs/${id}`,
  },
  models: {
    list: "/model-versions",
  },
  reports: {
    list: "/reports",
    download: (id: string) => `/reports/${id}/download`,
  },
  audit: "/audit-events",
  risks: {
    alerts: "/risk-alerts",
  },
  police: {
    plan: "/police/plan",
  },
} as const;
