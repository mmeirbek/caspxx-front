import type { Icon } from "@phosphor-icons/react";

export function KpiCell({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: Icon;
  label: string;
  value: string | number | undefined;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 bg-background p-2 sm:flex-col sm:items-start sm:justify-start sm:gap-1.5 sm:p-3">
      <div className="flex items-center gap-1 font-sans text-[10px] font-semibold uppercase leading-tight tracking-wide text-foreground sm:flex-row sm:items-center sm:gap-1.5 sm:text-[11px] sm:leading-snug sm:tracking-wider">
        <Icon
          className={
            "h-2.5 w-2.5 shrink-0 sm:h-2.5 sm:w-2.5 " +
            (accent ? "text-destructive" : "text-accent")
          }
        />
        <span className="max-sm:inline-block max-sm:truncate sm:line-clamp-3">{label}</span>
      </div>
      <p
        className={
          "font-display text-base font-bold tabular-nums leading-none sm:text-xl " +
          (accent ? "text-destructive" : "text-primary")
        }
      >
        {value ?? "—"}
      </p>
    </div>
  );
}
