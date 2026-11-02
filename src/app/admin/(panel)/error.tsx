"use client";

export default function AdminPanelError({ reset }: { reset: () => void }) {
  return (
    <div className="max-w-xl">
      <p className="text-xs tracking-[0.3em] text-gold">ADMIN</p>
      <h1 className="mt-3 font-display text-3xl">This page could not be loaded</h1>
      <p className="mt-3 text-sm text-muted">
        The database may be unreachable, or a registration column may still be missing. Try again after the connection is
        restored.
      </p>
      <button type="button" onClick={reset} className="mt-6 bg-navy px-5 py-3 text-xs tracking-widest text-white">
        TRY AGAIN
      </button>
    </div>
  );
}
