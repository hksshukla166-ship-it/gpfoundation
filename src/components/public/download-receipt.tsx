"use client";

import { useState } from "react";

export function DownloadReceiptButton({ token }: { token: string }) {
  const [status, setStatus] = useState<"ready" | "working" | "done" | "gone">("ready");
  const [error, setError] = useState("");

  async function onDownload() {
    setStatus("working");
    setError("");
    try {
      const res = await fetch(`/api/registration/receipt/${token}`, { cache: "no-store" });
      if (res.status === 410 || res.status === 404) {
        setStatus("gone");
        return;
      }
      if (!res.ok) {
        setStatus("ready");
        setError("The receipt could not be downloaded. Please try once more.");
        return;
      }
      const blob = await res.blob();
      const header = res.headers.get("Content-Disposition") || "";
      const match = header.match(/filename="([^"]+)"/);
      const filename = match?.[1] || "GP-Foundation-Receipt.html";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatus("done");
    } catch {
      setStatus("ready");
      setError("The receipt could not be downloaded. Please try once more.");
    }
  }

  if (status === "done" || status === "gone") {
    return (
      <p className="mt-4 text-sm text-muted">
        Receipt downloaded. It has been deleted from the GP Foundation website server. Keep the saved file and your
        registration number.
      </p>
    );
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => void onDownload()}
        disabled={status === "working"}
        className="bg-navy px-5 py-3 text-xs tracking-widest text-white disabled:opacity-60"
      >
        {status === "working" ? "PREPARING RECEIPT…" : "DOWNLOAD RECEIPT"}
      </button>
      <p className="mt-2 text-sm text-muted">
        Download now. After you download, this receipt is removed from the website server and cannot be downloaded again.
      </p>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
