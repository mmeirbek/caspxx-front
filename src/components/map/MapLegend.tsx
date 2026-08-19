import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/card";
import { riskColorVar } from "@/components/shared/RiskBadge";
import type { RiskLevel } from "@/lib/api/types";

const LEVELS: RiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export function MapLegend() {
  const { t } = useTranslation();
  return (
    <Card className="pointer-events-auto px-3 py-2 shadow-sm">
      <ul className="space-y-1">
        {LEVELS.map((lvl) => (
          <li key={lvl} className="flex items-center gap-2 text-xs">
            <span
              aria-hidden
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: riskColorVar(lvl) }}
            />
            <span>{t(`risk.${lvl}`)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
