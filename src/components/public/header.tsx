"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Phone } from "lucide-react";

type NavItem = { id: string; label: string; href: string };
type Settings = {
  instituteName: string;
  tagline: string;
  phone: string;
  admissionOpen: boolean;
  logoUrl: string | null;
};

export function PublicHeader({ settings, nav }: { settings: Settings; nav: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const [name, place] = splitName(settings.instituteName);

  return (
    <header className="sticky top-0 z-50 border-b border-gold/30 bg-navy text-white">
      <div className="hidden md:flex items-center justify-between bg-navy-2 px-6 py-1.5 text-xs tracking-wide text-white/80">
        <p className="font-display">{settings.tagline}</p>
        <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 hover:text-gold-2">
          <Phone className="size-3.5" />
          {settings.phone}
        </a>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          {settings.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logoUrl} alt={settings.instituteName} className="h-12 w-auto" />
          ) : (
            <div className="grid h-12 w-12 place-items-center rounded-sm border-2 border-gold bg-navy-3 font-brand text-lg text-gold">
              GP
            </div>
          )}
          <span className="leading-tight">
            <span className="block font-brand text-lg tracking-[0.14em]">{name}</span>
            <span className="block text-[11px] tracking-[0.28em] text-gold">{place}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex">
          {nav.map((item) => (
            <Link key={item.id} href={item.href} className="text-xs font-semibold tracking-[0.16em] text-white/85 hover:text-gold-2">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {settings.admissionOpen ? (
            <Link
              href="/admission"
              className="hidden sm:inline-flex bg-gold px-4 py-2 text-xs font-bold tracking-[0.18em] text-navy hover:bg-gold-2"
            >
              ADMISSION OPEN
            </Link>
          ) : null}
          <button type="button" className="lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu className="size-6" />
          </button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 bg-navy/95 p-6 lg:hidden">
          <div className="flex justify-end">
            <button type="button" aria-label="Close menu" onClick={() => setOpen(false)}>
              <X className="size-7" />
            </button>
          </div>
          <nav className="mt-8 flex flex-col gap-5">
            {nav.map((item) => (
              <Link key={item.id} href={item.href} onClick={() => setOpen(false)} className="text-lg tracking-[0.2em]">
                {item.label}
              </Link>
            ))}
            <Link href="/admission" onClick={() => setOpen(false)} className="mt-4 bg-gold px-4 py-3 text-center font-bold tracking-[0.18em] text-navy">
              ADMISSION OPEN
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function splitName(full: string) {
  const parts = full.split(",");
  return [parts[0]?.trim() || "GP FOUNDATION", parts.slice(1).join(",").trim() || "KONDAGAON"] as const;
}
