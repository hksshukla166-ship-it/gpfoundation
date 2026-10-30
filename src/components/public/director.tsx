type Director = {
  name: string | null;
  designation: string;
  photoUrl: string | null;
  shortBio: string | null;
  message: string | null;
  isActive: boolean;
} | null;

export function DirectorBlock({ director }: { director: Director }) {
  if (!director) return null;
  const hasContent = Boolean(director.name || director.message || director.shortBio);
  if (!hasContent) return null;
  if (!director.isActive && !director.name && !director.message) return null;

  return (
    <section className="bg-navy-2 text-white">
      <div className="mx-auto max-w-7xl px-4 py-20">
        <p className="text-xs tracking-[0.32em] text-gold">MEET OUR DIRECTOR</p>
        <h2 className="mt-4 font-display text-4xl md:text-5xl">{director.name || "Director"}</h2>
        <p className="mt-3 text-gold-2">{director.designation}</p>
        <div className="gold-rule mt-5" />
        {director.shortBio ? <p className="mt-6 max-w-3xl text-white/80">{director.shortBio}</p> : null}
        {director.message ? (
          <blockquote className="mt-8 max-w-3xl border-l-2 border-gold pl-5 font-display text-2xl text-gold-2">
            {director.message}
          </blockquote>
        ) : null}
      </div>
    </section>
  );
}
