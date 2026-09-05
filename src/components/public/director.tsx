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
  const hasContent = Boolean(director.name || director.message || director.photoUrl || director.shortBio);
  if (!hasContent) return null;
  if (!director.isActive && !director.photoUrl) return null;

  return (
    <section className="bg-navy-2 text-white">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 md:grid-cols-[0.9fr_1.1fr]">
        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute -left-3 -top-3 h-16 w-16 border-l-2 border-t-2 border-gold" />
          <div className="absolute -bottom-3 -right-3 h-16 w-16 border-b-2 border-r-2 border-gold" />
          {director.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={director.photoUrl} alt={director.name || "Director"} className="frame-gold aspect-[3/4] w-full object-cover" />
          ) : (
            <div className="frame-gold grid aspect-[3/4] place-items-center bg-navy text-gold">
              <p className="text-center text-sm tracking-[0.2em]">DIRECTOR PHOTO<br />TO BE ADDED</p>
            </div>
          )}
        </div>
        <div>
          <p className="text-xs tracking-[0.32em] text-gold">MEET OUR DIRECTOR</p>
          <h2 className="mt-4 font-display text-4xl md:text-5xl">{director.name || "Director"}</h2>
          <p className="mt-3 text-gold-2">{director.designation}</p>
          <div className="gold-rule mt-5" />
          {director.shortBio ? <p className="mt-6 text-white/80">{director.shortBio}</p> : null}
          {director.message ? (
            <blockquote className="mt-8 border-l-2 border-gold pl-5 font-display text-2xl text-gold-2">
              {director.message}
            </blockquote>
          ) : null}
        </div>
      </div>
    </section>
  );
}
