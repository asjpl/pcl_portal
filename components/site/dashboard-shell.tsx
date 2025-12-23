// components/site/dashboard-shell.tsx
export const dynamic = "force-dynamic";

import { getSession } from "../../lib/session";
import { DashboardShellClient, type NavItem } from "./dashboard-shell.client";

export type { NavItem };

export async function DashboardShellServer({
  title,
  subtitle,
  role,
  nav,
  children,
}: {
  title: string;
  subtitle?: string;
  role: "admin" | "customer";
  nav: NavItem[];
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <DashboardShellClient
      title={title}
      subtitle={subtitle}
      role={role}
      nav={nav}
      userEmail={session?.email ?? null}
    >
      {children}
    </DashboardShellClient>
  );
}

export const DashboardShell = DashboardShellServer;
