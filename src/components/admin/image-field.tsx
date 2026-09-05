"use client";

import { useState } from "react";

export function ImageField({ name, defaultValue, folder }: { name: string; defaultValue?: string | null; folder: string }) {
  const [url, setUrl] = useState(defaultValue || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const data = new FormData();
      data.set("file", file);
      data.set("folder", folder);
      const res = await fetch("/api/upload", { method: "POST", body: data, credentials: "same-origin" });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        throw new Error(json.error || (res.status === 401 ? "Please log in again, then upload the image." : "Upload failed"));
      }
      setUrl(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={url} />
      <input
        type="file"
        form="gp-file-sink"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp,.jpg,.jpeg,.png,.webp,.gif,.avif,.bmp,video/mp4,video/webm"
        onChange={(e) => {
          const selected = e.target.files?.[0];
          e.target.value = "";
          void onFile(selected);
        }}
      />
      {busy ? <p className="text-xs text-navy">Uploading… please wait, then click Save.</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {url && !busy ? (
        <p className="text-xs text-muted">Image uploaded. Click Save to show it on the website.</p>
      ) : null}
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="mt-2 h-40 w-40 object-cover" />
      ) : null}
    </div>
  );
}
