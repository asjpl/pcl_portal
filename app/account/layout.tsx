// app/account/layout.tsx
import { redirect } from "next/navigation";
import { requireUser } from "../../lib/session";
import { DashboardShellServer } from "../../components/site/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (user.role !== "customer") redirect("/admin");

  if ((user as any).mustResetPassword) {
    redirect("/account/reset-password");
  }

  return (
    <DashboardShellServer
      role="customer"
      title="Account"
      subtitle="View your lease, payments, and messages."
      nav={[
        { label: "Overview", href: "/account" },
        { label: "Profile", href: "/account/profile" },
      ]}
    >
      {children}
    </DashboardShellServer>
  );
}
