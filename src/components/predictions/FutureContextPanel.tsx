import { useTranslation } from "react-i18next";

import type { SupportedLanguage } from "@/lib/i18n/config";
import type { FutureContext } from "@/lib/api/types";

interface Props {
  futureContext: FutureContext | null;
}

const SIGNAL_EMOJIS: Record<string, string> = {
  severe_weather: "\u2601\uFE0F",
  heavy_traffic: "\uD83D\uDE97",
  road_repair: "\uD83D\uDD27",
  major_event: "\uD83C\uDFAA",
};

const WARNING_KEYS: Record<string, string> = {
  future_context_unavailable: "futureContext.warningUnavailable",
};

function hasUsefulData(ctx: FutureContext): boolean {
  if (ctx.signals.length > 0) return true;
  const p = ctx.providers;
  if (p && typeof p === "object") {
    for (const key of Object.keys(p)) {
      const prov = p[key];
      if (prov?.available === true) return true;
    }
  }
  return false;
}

function formatProviderValue(val: unknown): string {
  if (typeof val === "number") return (val * 100).toFixed(0) + "%";
  if (val == null) return "—";
  return String(val);
}

export function FutureContextPanel({ futureContext }: Props) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? "ru") as SupportedLanguage;

  if (!futureContext || !hasUsefulData(futureContext)) {
    return (
      <section className="rounded-md border bg-muted/50 p-3">
        <p className="text-xs text-muted-foreground">{t("futureContext.unavailable")}</p>
      </section>
    );
  }

  const { signals, providers, warnings, disclaimer } = futureContext;
  const providerKeys = providers && typeof providers === "object" ? Object.keys(providers) : [];

  return (
    <section className="space-y-3 rounded-md border bg-card p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        {t("futureContext.title")}
        {futureContext.status === "degraded" && (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            {t("futureContext.degraded")}
          </span>
        )}
      </h3>

      {signals.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {signals.map((s) => (
            <div
              key={s.flag}
              className="flex items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-xs"
              title={s.description[lang] ?? s.description.ru ?? s.description.en}
            >
              {SIGNAL_EMOJIS[s.flag] && <span className="text-sm">{SIGNAL_EMOJIS[s.flag]}</span>}
              <span>{s.title[lang] ?? s.title.ru ?? s.title.en}</span>
            </div>
          ))}
        </div>
      )}

      {providerKeys.length > 0 && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          {providerKeys.map((key) => {
            const prov = providers[key];
            if (!prov?.available) return null;
            return (
              <div key={key} className="rounded border bg-background p-2">
                <p className="font-medium capitalize">{key}</p>
                {Object.entries(prov).map(([k, v]) => {
                  if (k === "available") return null;
                  const label = k.replace(/_/g, " ");
                  return (
                    <p key={k} className="text-muted-foreground">
                      <span className="capitalize">{label}</span>: {formatProviderValue(v)}
                    </p>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="space-y-1">
          {warnings.map((w) => (
            <p key={w} className="text-xs text-amber-600 dark:text-amber-400">
              &bull; {t(WARNING_KEYS[w] ?? w, { defaultValue: w })}
            </p>
          ))}
        </div>
      )}

      {disclaimer && (
        <p className="text-[10px] text-muted-foreground">
          {disclaimer[lang] ?? disclaimer.ru ?? disclaimer.en}
        </p>
      )}
    </section>
  );
}
