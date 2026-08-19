import { useRef, useState } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Check } from "@phosphor-icons/react";

export function SwipeToAccept({
  label,
  onAccept,
  disabled,
}: {
  label: string;
  onAccept: () => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const trackRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  function accept() {
    if (done || disabled) return;
    setDone(true);
    onAccept();
  }

  return (
    <div
      ref={trackRef}
      onClick={accept}
      role="button"
      tabIndex={0}
      aria-label={t("jetkiz.accept.swipe")}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          accept();
        }
      }}
      className={
        "relative h-14 w-full cursor-pointer select-none overflow-hidden rounded-full border " +
        (done ? "border-emerald-400 bg-emerald-500" : "border-primary/30 bg-primary/10")
      }
    >
      <div className="absolute inset-0 flex items-center justify-center gap-2 px-14 text-sm font-semibold text-foreground">
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <span>{done ? t("jetkiz.accept.swipeSuccess") : label}</span>
      </div>
      <motion.div
        drag="x"
        dragConstraints={trackRef}
        dragElastic={0.05}
        dragSnapToOrigin
        dragMomentum={false}
        onDragEnd={(_, info) => {
          const width = trackRef.current?.clientWidth ?? 0;
          if (info.offset.x >= width - 56) accept();
        }}
        className={
          "absolute left-1 top-1 flex h-12 w-12 items-center justify-center rounded-full shadow-md " +
          (done ? "bg-emerald-600 text-white" : "bg-primary text-primary-foreground")
        }
      >
        {done ? (
          <Check className="h-5 w-5" weight="bold" />
        ) : (
          <ArrowRight className="h-5 w-5" weight="bold" />
        )}
      </motion.div>
    </div>
  );
}
