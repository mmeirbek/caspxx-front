import { useEffect, useState, type ReactNode } from "react";

import { LoadingState } from "@/components/shared/LoadingState";
import { ModuleAccessDialog } from "@/features/module-access/ModuleAccessDialog";
import { useModuleAccessStatus } from "@/features/module-access/hooks";
import type { AdminModuleKey } from "@/features/module-access/store";

interface Props {
  module: AdminModuleKey;
  children: ReactNode;
}

/**
 * Gates any admin subroute behind the password dialog. The dialog re-opens
 * whenever the module token becomes invalid (401/403/expired).
 */
export function AdminModuleGate({ module, children }: Props) {
  const status = useModuleAccessStatus(module);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!status.isLoading && !status.data?.valid) setOpen(true);
  }, [status.isLoading, status.data?.valid]);

  if (status.isLoading) return <LoadingState rows={4} />;

  if (!status.data?.valid) {
    return (
      <>
        <div className="rounded-lg border border-dashed bg-card p-6 text-sm text-muted-foreground">
          Модуль защищён паролем.
        </div>
        <ModuleAccessDialog
          module={module}
          open={open}
          onOpenChange={setOpen}
          onUnlocked={() => status.refetch()}
        />
      </>
    );
  }

  return <>{children}</>;
}
