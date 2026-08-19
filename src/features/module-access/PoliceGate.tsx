import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { LoadingState } from "@/components/shared/LoadingState";
import { ModuleAccessDialog } from "@/features/module-access/ModuleAccessDialog";
import { useModuleAccessStatus } from "@/features/module-access/hooks";

interface Props {
  children: ReactNode;
}

export function PoliceGate({ children }: Props) {
  const { t } = useTranslation();
  const status = useModuleAccessStatus("police");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!status.isLoading && !status.data?.valid) setOpen(true);
  }, [status.isLoading, status.data?.valid]);

  if (status.isLoading) return <LoadingState rows={4} />;

  if (!status.data?.valid) {
    return (
      <>
        <div className="rounded-lg border border-dashed bg-card p-6 text-sm text-muted-foreground">
          {t("police.lockedHint")}
        </div>
        <ModuleAccessDialog
          module="police"
          open={open}
          onOpenChange={setOpen}
          onUnlocked={() => status.refetch()}
          title={t("police.passwordTitle")}
          description={t("police.passwordDescription")}
        />
      </>
    );
  }

  return <>{children}</>;
}