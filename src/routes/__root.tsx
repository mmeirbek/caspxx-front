import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { useEffect } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import appCss from "../styles.css?url";
import type { RouterContext } from "@/lib/auth/types";

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CaspX" },
      {
        name: "description",
        content:
          "Платформа грузоперевозок Мангистауской области: создание заказов, поиск перевозчиков, онлайн-маршруты и мониторинг грузов.",
      },
      { name: "theme-color", content: "#1d4ed8" },
      { property: "og:title", content: "CaspX" },
      {
        property: "og:description",
        content:
          "Платформа грузоперевозок Мангистауской области: заказы, перевозчики, маршруты и мониторинг грузов.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "CaspX" },
      {
        name: "twitter:description",
        content:
          "Платформа грузоперевозок Мангистауской области: заказы, перевозчики, маршруты и мониторинг грузов.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "alternate icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Не удалось загрузить страницу
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Попробуйте обновить или вернуться на главную.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Повторить
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium"
          >
            На главную
          </a>
        </div>
      </div>
    </div>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">Страница не найдена.</p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          На главную
        </a>
      </div>
    </div>
  );
}

function RootComponent() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopBar />
      <div className="flex min-w-0 flex-1">
        <SidebarNav />
        <main className="relative min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
