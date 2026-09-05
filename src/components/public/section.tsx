export function Section({
  eyebrow,
  title,
  children,
  dark = false,
}: {
  eyebrow?: string;
  title?: string;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <section className={dark ? "bg-navy text-white" : "bg-paper text-ink"}>
      <div className="mx-auto max-w-7xl px-4 py-16 md:py-20">
        {eyebrow ? <p className="text-xs tracking-[0.28em] text-gold">{eyebrow}</p> : null}
        {title ? <h2 className="mt-3 font-display text-3xl md:text-4xl">{title}</h2> : null}
        {title ? <div className="gold-rule mt-4" /> : null}
        <div className={title ? "mt-10" : ""}>{children}</div>
      </div>
    </section>
  );
}
