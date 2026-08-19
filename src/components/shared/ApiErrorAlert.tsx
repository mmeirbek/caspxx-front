import { useTranslation } from "react-i18next";

import { ApiError, NoBackendError } from "@/lib/api/client";

import { ErrorState } from "./ErrorState";

interface Props {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}

export function ApiErrorAlert({ error, onRetry, className }: Props) {
  const { t } = useTranslation();
  if (error instanceof NoBackendError) {
    return <ErrorState title={t("common.noBackend")} description="" className={className} />;
  }
  if (error instanceof ApiError) {
    return (
      <ErrorState
        title={t("common.error")}
        description={error.message}
        onRetry={onRetry}
        className={className}
      />
    );
  }
  return <ErrorState onRetry={onRetry} className={className} />;
}
