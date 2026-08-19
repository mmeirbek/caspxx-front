import { Check, Globe } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/lib/i18n/config";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = (i18n.resolvedLanguage ?? "ru") as SupportedLanguage;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5" aria-label="Language">
          <Globe className="h-4 w-4" aria-hidden />
          <span className="hidden text-xs font-medium uppercase sm:inline">{current}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[1102]">
        {SUPPORTED_LANGUAGES.map((lng) => (
          <DropdownMenuItem
            key={lng}
            onSelect={() => {
              void i18n.changeLanguage(lng);
            }}
            className="flex items-center justify-between gap-4"
          >
            <span>{LANGUAGE_LABELS[lng]}</span>
            {current === lng && <Check className="h-4 w-4" aria-hidden />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
