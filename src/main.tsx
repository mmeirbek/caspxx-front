import * as Sentry from "@sentry/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterContextProvider, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import { I18nextProvider } from "react-i18next";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/layout/AppShell";
import i18n, { initI18n } from "@/lib/i18n/config";
import { getRouter } from "./router";
import "./styles.css";

initI18n();

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  enabled: import.meta.env.PROD,
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      staleTime: 30_000,
      gcTime: 300_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const router = getRouter();

function AppFallback({ error, resetErrorBoundary }: { error: unknown; resetErrorBoundary: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Не удалось загрузить приложение
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : String(error)}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={resetErrorBoundary}
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

function SentryFallback({ error, resetError }: { error: unknown; resetError: () => void }) {
  return <AppFallback error={error instanceof Error ? error : new Error(String(error))} resetErrorBoundary={resetError} />;
}

function App() {
  return (
    <Sentry.ErrorBoundary fallback={SentryFallback}>
      <ErrorBoundary FallbackComponent={AppFallback} onError={(error) => Sentry.captureException(error)}>
        <I18nextProvider i18n={i18n}>
          <QueryClientProvider client={queryClient}>
            <RouterContextProvider router={router}>
              <AppShell>
                <RouterProvider router={router} />
              </AppShell>
            </RouterContextProvider>
            <Toaster richColors position="top-right" />
          </QueryClientProvider>
        </I18nextProvider>
      </ErrorBoundary>
    </Sentry.ErrorBoundary>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
