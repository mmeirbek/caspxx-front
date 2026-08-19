import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import type { AuthContextValue } from "@/lib/auth/types";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: {
      queryClient,
      auth: null as unknown as AuthContextValue,
    },
    defaultPreloadStaleTime: 0,
  });

  return router;
};
