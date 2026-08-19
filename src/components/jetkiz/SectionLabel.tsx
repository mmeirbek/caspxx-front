import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

export function SectionLabel({
  icon: Icon,
  label,
  tone = "default",
  badge,
}: {
  icon: Icon;
  label: string;
  tone?: "default" | "accent" | "destructive";
  badge?: ReactNode;
}) {
  const color =
    tone === "destructive"
      ? "bg-destructive/10 text-destructive"
      : tone === "accent"
        ? "bg-accent/15 text-accent"
        : "bg-primary/10 text-primary";
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <div className={"flex h-5 w-5 items-center justify-center rounded sm:h-6 sm:w-6 " + color}>
        <Icon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
      </div>
      <h2 className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground">
        {label}
      </h2>
      {badge}
    </div>
  );
}
