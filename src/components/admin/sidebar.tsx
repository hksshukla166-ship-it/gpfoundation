"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { LogoutButton } from "@/components/admin/logout-button";

const items = [
  ["Dashboard", "/admin"],
  ["Website", "/admin/website"],
  ["Hero Banners", "/admin/banners"],
  ["Director", "/admin/director"],
  ["Courses", "/admin/courses"],
  ["Course Registrations", "/admin/registrations"],
  ["Applicants", "/admin/applicants"],
  ["Faculty", "/admin/faculty"],
  ["Notices", "/admin/notices"],
  ["Gallery", "/admin/gallery"],
  ["Scholarship", "/admin/scholarship"],
  ["Enquiries", "/admin/enquiries"],
  ["Payments", "/admin/payments"],
  ["Contact Settings", "/admin/contact-settings"],
  ["Website Settings", "/admin/settings"],
  ["Content Blocks", "/admin/content"],
  ["Admin Profile", "/admin/profile"],
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="absolute left-4 top-4 z-20 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
        <Menu />
      </button>
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 overflow-y-auto bg-navy p-5 text-white transition ${open ? "translate-x-0" : "-translate-x-full"} lg:static lg:translate-x-0`}>
        <div className="mb-6 flex items-center justify-between">
          <p className="font-brand tracking-[0.16em] text-gold">GP ADMIN</p>
          <button type="button" className="lg:hidden" onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>
        <nav className="grid gap-1 text-sm">
          {items.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`px-3 py-2 ${pathname === href ? "bg-gold text-navy" : "text-white/80 hover:bg-navy-3"}`}
            >
              {label}
            </Link>
          ))}
          <LogoutButton />
        </nav>
      </aside>
    </>
  );
}
