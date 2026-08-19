import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function AppShell({ children }: Props) {
  return <>{children}</>;
}
