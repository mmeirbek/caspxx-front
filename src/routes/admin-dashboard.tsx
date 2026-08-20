import { createFileRoute } from "@tanstack/react-router";

import { AnalyticsTab } from "@/components/analytics/AnalyticsTab";
import { requireRole } from "@/lib/auth/guards";

export const Route = createFileRoute("/admin-dashboard")({
  beforeLoad: ({ context }) => requireRole(context, ["ADMIN", "SUPERADMIN"]),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <AnalyticsTab />
    </main>
  );
}