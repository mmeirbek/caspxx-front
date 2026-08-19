import { Warning, CheckCircle, Fire, ShieldWarning } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/api/types";

const RISK_STYLES: Record<
  RiskLevel,
  { bg: string; fg: string; icon: React.ElementType; ring: string; hex: string }
> = {
  LOW: {
    bg: "bg-risk-low",
    fg: "text-risk-low-foreground",
    icon: CheckCircle,
    ring: "ring-risk-low/30",
    hex: "var(--risk-low)",
  },
  MEDIUM: {
    bg: "bg-risk-medium",
    fg: "text-risk-medium-foreground",
    icon: Warning,
    ring: "ring-risk-medium/30",
    hex: "var(--risk-medium)",
  },
  HIGH: {
    bg: "bg-risk-high",
    fg: "text-risk-high-foreground",
    icon: Fire,
    ring: "ring-risk-high/30",
    hex: "var(--risk-high)",
  },
  CRITICAL: {
    bg: "bg-risk-critical",
    fg: "text-risk-critical-foreground",
    icon: ShieldWarning,
    ring: "ring-risk-critical/30",
    hex: "var(--risk-critical)",
  },
};

export function riskColorVar(level: RiskLevel): string {
  return RISK_STYLES[level].hex;
}

interface Props {
  level: RiskLevel;
  className?: string;
  size?: "sm" | "md";
  showIcon?: boolean;
}

export function RiskBadge({ level, className, size = "md", showIcon = true }: Props) {
  const { t } = useTranslation();
  const style = RISK_STYLES[level];
  const Icon = style.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        style.bg,
        style.fg,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        className,
      )}
      aria-label={`${t("risk.level")}: ${t(`risk.${level}`)}`}
    >
      {showIcon && <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden />}
      {t(`risk.${level}`)}
    </span>
  );
}
