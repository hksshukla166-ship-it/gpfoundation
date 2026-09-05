import Link from "next/link";

type Settings = {
  instituteName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  footerText: string;
  facebookUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  whatsappUrl: string | null;
};

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/courses", label: "Courses" },
  { href: "/faculty", label: "Faculty" },
  { href: "/admission", label: "Admission" },
  { href: "/scholarship", label: "Scholarship" },
  { href: "/notice", label: "Notice" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export function PublicFooter({ settings }: { settings: Settings }) {
  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-3">
        <div>
          <p className="font-brand text-2xl tracking-[0.16em]">{settings.instituteName}</p>
          <p className="mt-3 font-display text-gold">{settings.tagline}</p>
          <p className="mt-4 text-sm text-white/70">{settings.footerText}</p>
        </div>
        <div>
          <p className="text-xs tracking-[0.24em] text-gold">QUICK LINKS</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-white/80 hover:text-gold-2">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="text-sm text-white/80">
          <p className="text-xs tracking-[0.24em] text-gold">CONTACT</p>
          <p className="mt-4">{settings.address}</p>
          <p className="mt-3">
            <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="hover:text-gold-2">
              {settings.phone}
            </a>
          </p>
          <p>
            <a href={`mailto:${settings.email}`} className="hover:text-gold-2">
              {settings.email}
            </a>
          </p>
          <div className="mt-4 flex gap-3 text-xs tracking-widest">
            {settings.facebookUrl ? <a href={settings.facebookUrl}>Facebook</a> : null}
            {settings.instagramUrl ? <a href={settings.instagramUrl}>Instagram</a> : null}
            {settings.youtubeUrl ? <a href={settings.youtubeUrl}>YouTube</a> : null}
            {settings.whatsappUrl ? <a href={settings.whatsappUrl}>WhatsApp</a> : null}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/60">
        © {new Date().getFullYear()} GP Foundation, Kondagaon. All Rights Reserved. ·{" "}
        <Link href="/privacy" className="hover:text-gold-2">
          Privacy Policy
        </Link>{" "}
        ·{" "}
        <Link href="/terms" className="hover:text-gold-2">
          Terms & Conditions
        </Link>
      </div>
    </footer>
  );
}
