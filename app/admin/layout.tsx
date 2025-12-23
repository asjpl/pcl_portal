// app/admin/layout.tsx
import { redirect } from "next/navigation";
import { requireAdmin } from "../../lib/session";
import { DashboardShellServer } from "../../components/site/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (admin.role !== "admin") redirect("/account");

  return (
    <DashboardShellServer
      role="admin"
      title="Admin"
      subtitle="Manage customers, vehicles, leases, and communications."
      nav={[
        { label: "Overview", href: "/admin" },
        { label: "Customers", href: "/admin/customers" },
        { label: "Vehicles", href: "/admin/vehicles" },
        { label: "Leases", href: "/admin/leases" },
        { label: "Messages", href: "/admin/messages" },
        { label: "Users", href: "/admin/users" },
        { label: "Profile", href: "/admin/profile" },
      ]}
    >
      {children}
    </DashboardShellServer>
  );
}
