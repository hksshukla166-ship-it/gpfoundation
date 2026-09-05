"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div>
        <p className="text-xs tracking-[0.3em] text-gold">500</p>
        <h1 className="mt-3 font-display text-4xl">Something went wrong</h1>
        <button onClick={reset} className="mt-6 bg-navy px-5 py-3 text-xs tracking-widest text-white">
          TRY AGAIN
        </button>
      </div>
    </div>
  );
}
