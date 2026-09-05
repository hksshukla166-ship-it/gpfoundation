"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="hi">
      <body className="grid min-h-screen place-items-center bg-[#f6f3ec] px-4 text-center text-[#1c2430]">
        <div>
          <p className="text-xs tracking-[0.3em] text-[#c9a227]">500</p>
          <h1 className="mt-3 text-4xl">Something went wrong</h1>
          <button onClick={reset} className="mt-6 bg-[#071529] px-5 py-3 text-xs tracking-widest text-white">
            TRY AGAIN
          </button>
        </div>
      </body>
    </html>
  );
}
