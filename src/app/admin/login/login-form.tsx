"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const expired = params.get("expired") === "1";
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.get("gp_admin_user"),
        password: form.get("gp_admin_pass"),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Login failed");
      return;
    }
    router.push(params.get("from") || "/admin");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="none"
      spellCheck={false}
      className="w-full max-w-sm space-y-4 border border-gold/40 bg-navy-2 p-8"
    >
      <h1 className="font-brand text-2xl tracking-[0.18em] text-gold">ADMIN PORTAL</h1>
      <label className="block text-sm text-white/80">
        Username
        <input
          name="gp_admin_user"
          type="text"
          required
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          data-lpignore="true"
          data-1p-ignore="true"
          data-form-type="other"
          className="mt-1 w-full border border-white/20 bg-navy px-3 py-2 text-white"
        />
      </label>
      <label className="block text-sm text-white/80">
        Password
        <input
          name="gp_admin_pass"
          type="password"
          required
          autoComplete="new-password"
          data-lpignore="true"
          data-1p-ignore="true"
          data-form-type="other"
          className="mt-1 w-full border border-white/20 bg-navy px-3 py-2 text-white"
        />
      </label>
      {expired && !error ? <p className="text-sm text-gold-2">Your session expired. Please sign in again.</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <button disabled={pending} className="w-full bg-gold py-3 text-xs font-bold tracking-[0.2em] text-navy">
        {pending ? "SIGNING IN..." : "SIGN IN"}
      </button>
    </form>
  );
}
