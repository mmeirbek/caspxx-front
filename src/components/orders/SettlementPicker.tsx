import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { MapPin } from "@phosphor-icons/react";

import { listSettlements } from "@/lib/api/settlements";
import type { Settlement } from "@/lib/api/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormLabel } from "@/components/ui/form";

export function localizeSettlementName(s: Settlement, lang: string): string {
  if (lang === "kk") return s.nameKk;
  if (lang === "ru") return s.nameRu;
  return s.name;
}

interface Props {
  label: string;
  value: string;
  onSelect: (settlement: Settlement | null) => void;
  disabled?: boolean;
}

export function SettlementPicker({ label, value, onSelect, disabled }: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const { data } = useQuery({
    queryKey: ["settlements"],
    queryFn: () => listSettlements(),
  });

  const settlements = data?.settlements ?? [];

  return (
    <div className="space-y-2">
      <FormLabel>
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          {label}
        </span>
      </FormLabel>
      <Select
        value={value || undefined}
        onValueChange={(id) => {
          const s = settlements.find((item) => item.id === id) ?? null;
          onSelect(s);
        }}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={t("orders.fields.settlementPlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          {settlements.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {localizeSettlementName(s, lang)} · {s.district}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
