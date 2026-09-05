"use client";

import Link from "next/link";
import { useState } from "react";

type Item = { id: string; title: string | null; mediaUrl: string; mediaType: string; category: string };

export function GalleryGrid({
  items,
  page,
  total,
  take,
  category,
}: {
  items: Item[];
  page: number;
  total: number;
  take: number;
  category?: string;
}) {
  const [active, setActive] = useState<Item | null>(null);
  const pages = Math.max(1, Math.ceil(total / take));

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <button key={item.id} type="button" onClick={() => setActive(item)} className="overflow-hidden border border-line bg-white text-left">
            {item.mediaType === "VIDEO" ? (
              <video src={item.mediaUrl} className="aspect-video w-full object-cover" muted />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.mediaUrl} alt={item.title || "Gallery"} loading="lazy" className="aspect-video w-full object-cover" />
            )}
            <div className="px-3 py-2 text-sm">
              <p className="text-xs tracking-widest text-gold">{item.category.replaceAll("_", " ")}</p>
              {item.title}
            </div>
          </button>
        ))}
      </div>
      {pages > 1 ? (
        <div className="mt-6 flex gap-2">
          {Array.from({ length: pages }, (_, i) => (
            <Link key={i} href={`/gallery?page=${i + 1}${category ? `&category=${category}` : ""}`} className={`border px-3 py-1 ${page === i + 1 ? "bg-navy text-white" : ""}`}>
              {i + 1}
            </Link>
          ))}
        </div>
      ) : null}
      {active ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" onClick={() => setActive(null)}>
          {active.mediaType === "VIDEO" ? (
            <video src={active.mediaUrl} controls className="max-h-[85vh] max-w-full" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={active.mediaUrl} alt={active.title || ""} className="max-h-[85vh] max-w-full" />
          )}
        </div>
      ) : null}
    </>
  );
}
