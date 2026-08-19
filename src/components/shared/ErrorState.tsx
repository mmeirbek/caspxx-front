import { WarningCircle } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title, description, onRetry, className }: Props) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-center",
        className,
      )}
    >
      <WarningCircle className="h-8 w-8 text-destructive" aria-hidden />
      <div>
        <p className="text-sm font-medium">{title ?? t("common.error")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description ?? t("common.errorHint")}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t("common.retry")}
        </Button>
      )}
    </div>
  );
}
