import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/api/types";

import { riskColorVar } from "./RiskBadge";

interface Props {
  score: number; // 0..1
  level: RiskLevel;
  className?: string;
}

export function RiskScoreBar({ score, level, className }: Props) {
  const pct = Math.max(0, Math.min(1, score)) * 100;
  return (
    <div className={cn("h-2 w-full rounded-full bg-muted", className)}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, backgroundColor: riskColorVar(level) }}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}
