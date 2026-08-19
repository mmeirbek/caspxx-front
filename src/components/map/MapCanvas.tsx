import { lazy, Suspense, useEffect, useState, type ComponentProps } from "react";
import { useTranslation } from "react-i18next";

import { LoadingState } from "@/components/shared/LoadingState";

// Leaflet touches window at import time. Lazy load client-only.
const MapView = lazy(() => import("./MapView"));

type Props = ComponentProps<typeof MapView>;

export function MapCanvas(props: Props) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        <LoadingState rows={2} className="w-40" />
        <span className="sr-only">{t("common.loading")}</span>
      </div>
    );
  }
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center bg-muted">
          <LoadingState rows={2} className="w-40" />
        </div>
      }
    >
      <MapView {...props} />
    </Suspense>
  );
}
