import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div>
        <p className="text-xs tracking-[0.3em] text-gold">404</p>
        <h1 className="mt-3 font-display text-4xl">Page not found</h1>
        <Link href="/" className="mt-6 inline-block bg-navy px-5 py-3 text-xs tracking-widest text-white">
          GO HOME
        </Link>
      </div>
    </div>
  );
}
