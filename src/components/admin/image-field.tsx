"use client";

import { useState } from "react";

export function ImageField({ name, defaultValue, folder }: { name: string; defaultValue?: string | null; folder: string }) {
  const [url, setUrl] = useState(defaultValue || "");
  const [busy, setBusy] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    const data = new FormData();
    data.set("file", file);
    data.set("folder", folder);
    const res = await fetch("/api/upload", { method: "POST", body: data });
    const json = await res.json();
    setBusy(false);
    if (res.ok) setUrl(json.url);
    else alert(json.error || "Upload failed");
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={url} />
      <input type="file" accept="image/*,video/mp4,video/webm" onChange={(e) => onFile(e.target.files?.[0])} />
      {busy ? <p className="text-xs">Uploading…</p> : null}
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="mt-2 h-40 w-40 object-cover" />
      ) : null}
    </div>
  );
}
