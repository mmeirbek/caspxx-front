import { useTranslation } from "react-i18next";
import { VideoCamera } from "@phosphor-icons/react";
import { SectionLabel } from "./SectionLabel";
import { EmptyState } from "@/components/shared/EmptyState";

export interface CameraItem {
  orderId: string;
  title: string;
  url: string | null;
}

export function LiveCameraSection({ items }: { items: CameraItem[] }) {
  const { t } = useTranslation();
  return (
    <section className="space-y-2 rounded-md border bg-background/60 p-2 sm:p-3">
      <SectionLabel
        icon={VideoCamera}
        label={t("jetkiz.camera.title")}
        tone="destructive"
        badge={
          <span className="rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-destructive">
            LIVE
          </span>
        }
      />
      {items.length === 0 ? (
        <EmptyState title={t("jetkiz.camera.empty")} />
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <div
              key={it.orderId}
              className="overflow-hidden rounded-md border border-border/60 bg-background"
            >
              <div className="flex aspect-video items-center justify-center bg-muted">
                {it.url ? (
                  <img
                    src={it.url}
                    alt={it.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <VideoCamera className="h-6 w-6" />
                    <span className="text-[10px]">{t("jetkiz.camera.offline")}</span>
                  </div>
                )}
              </div>
              <p className="truncate px-2 py-1.5 text-xs font-medium">{it.title}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
