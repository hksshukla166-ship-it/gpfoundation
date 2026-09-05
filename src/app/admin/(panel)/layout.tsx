import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/sidebar";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-[#eef1f6] text-ink lg:grid lg:grid-cols-[16rem_1fr]">
      <form id="gp-file-sink" hidden aria-hidden="true" />
      <AdminSidebar />
      <div className="px-4 py-16 lg:p-8">{children}</div>
    </div>
  );
}
