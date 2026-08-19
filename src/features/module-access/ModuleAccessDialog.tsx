import { Lock } from "@phosphor-icons/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ApiError, NoBackendError } from "@/lib/api/client";

import { useUnlockModule } from "./hooks";
import type { AdminModuleKey } from "./store";

interface Props {
  module: AdminModuleKey;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlocked?: () => void;
  /** Override the dialog title (defaults to `t("admin.passwordTitle")`). */
  title?: string;
  /** Override the dialog description (defaults to `t("admin.passwordDescription")`). */
  description?: string;
}

export function ModuleAccessDialog({ module, open, onOpenChange, onUnlocked, title, description }: Props) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const unlock = useUnlockModule(module);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await unlock.mutateAsync(password);
      setPassword("");
      onUnlocked?.();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof NoBackendError) {
        setError(t("common.noBackend"));
      } else if (err instanceof ApiError) {
        setError(t("admin.unlockError"));
      } else {
        setError(t("admin.unlockError"));
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle>{title ?? t("admin.passwordTitle")}</DialogTitle>
          <DialogDescription>{description ?? t("admin.passwordDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            type="password"
            autoFocus
            autoComplete="current-password"
            placeholder={t("admin.passwordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-label={t("admin.passwordPlaceholder")}
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={unlock.isPending || password.length === 0}>
              {t("admin.unlock")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
