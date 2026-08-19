import { Tray } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

interface Props {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: Props) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-center",
        className,
      )}
    >
      <div className="text-muted-foreground">
        {icon ?? <Tray className="h-8 w-8" aria-hidden />}
      </div>
      <div>
        <p className="text-sm font-medium">{title ?? t("common.empty")}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
