type Settings = { instituteName: string; tagline: string; phone: string; email: string };

export function Maintenance({ settings }: { settings: Settings }) {
  return (
    <div className="grid min-h-screen place-items-center bg-navy px-6 text-center text-white">
      <div>
        <p className="font-brand text-3xl tracking-[0.2em]">{settings.instituteName}</p>
        <p className="mt-4 font-display text-gold">{settings.tagline}</p>
        <p className="mt-8 text-white/80">The website is temporarily under maintenance. Please contact us.</p>
        <p className="mt-4">
          <a href={`tel:${settings.phone.replace(/\s/g, "")}`}>{settings.phone}</a>
          <br />
          <a href={`mailto:${settings.email}`}>{settings.email}</a>
        </p>
      </div>
    </div>
  );
}
