"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Banner = {
  id: string;
  heading: string | null;
  subtitle: string | null;
  supporting: string | null;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
};

type Settings = {
  heroHeading: string;
  heroSubheading: string;
  heroSupporting: string;
  joinCtaLabel: string;
  joinCtaHref: string;
  enquireCtaLabel: string;
  enquireCtaHref: string;
};

type Director = {
  name: string | null;
  designation: string;
  photoUrl: string | null;
} | null;

export function Hero({
  settings,
  banners,
  director,
}: {
  settings: Settings;
  banners: Banner[];
  director: Director;
}) {
  const slides = banners.length
    ? banners
    : [
        {
          id: "default",
          heading: settings.heroHeading,
          subtitle: settings.heroSubheading,
          supporting: settings.heroSupporting,
          imageUrl: null,
          ctaLabel: settings.joinCtaLabel,
          ctaHref: settings.joinCtaHref,
        },
      ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 7000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[index] ?? slides[0];
  const portrait = director?.photoUrl || null;

  return (
    <section className="relative min-h-[78vh] overflow-hidden bg-navy text-white">
      {slide.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={slide.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
      ) : (
        <div className={`hero-grid absolute inset-0 ${portrait ? "hero-grid-plain" : ""}`} />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/30" />
      <div className="relative mx-auto grid min-h-[78vh] max-w-7xl items-center gap-10 px-4 py-20 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="mb-6 inline-flex w-fit items-center gap-2 border border-gold/50 bg-navy/40 px-3 py-1 text-[11px] tracking-[0.28em] text-gold">
            B.SC. · B.COM. · B.A. · CGPSC · UPSC
          </div>
          <p className="text-xs tracking-[0.35em] text-gold">{slide.subtitle || settings.heroSubheading}</p>
          <h1 className="mt-4 max-w-4xl font-display text-4xl leading-tight md:text-6xl">{slide.heading || settings.heroHeading}</h1>
          <p className="mt-6 max-w-2xl text-lg text-white/80">{slide.supporting || settings.heroSupporting}</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href={slide.ctaHref || settings.joinCtaHref} className="bg-gold px-7 py-3 text-xs font-bold tracking-[0.22em] text-navy hover:bg-gold-2">
              {slide.ctaLabel || settings.joinCtaLabel}
            </Link>
            <Link href={settings.enquireCtaHref} className="border border-white/40 px-7 py-3 text-xs font-bold tracking-[0.22em] hover:border-gold hover:text-gold">
              {settings.enquireCtaLabel}
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-sm lg:max-w-md">
          <div className="absolute -left-4 -top-4 h-20 w-20 border-l-2 border-t-2 border-gold/80" />
          <div className="absolute -bottom-4 -right-4 h-20 w-20 border-b-2 border-r-2 border-gold/80" />
          {portrait ? (
            <div className="relative overflow-hidden rounded-full border-[6px] border-gold shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={portrait} alt={director?.name || "Director, GP Foundation"} className="aspect-square w-full object-cover object-top" />
            </div>
          ) : (
            <div className="grid aspect-square place-items-center rounded-full border border-gold/40 bg-navy-2/80 text-center text-gold">
              <p className="px-8 text-xs tracking-[0.22em]">DIRECTOR PHOTOGRAPH<br />FROM ADMIN PORTAL</p>
            </div>
          )}
          {director?.name ? (
            <div className="mt-5 text-center">
              <p className="font-display text-2xl">{director.name}</p>
              <p className="mt-1 text-sm text-gold-2">{director.designation}</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
