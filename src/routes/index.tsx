import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { requireAuth } from "@/lib/auth/guards";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => requireAuth(context),
  component: HomePage,
});

function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-primary">
          {t("brand.name")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("app.comingSoon")}</p>
      </div>
    </div>
  );
}
