"use client";

import { useEffect, useRef, useState } from "react";

export function DownloadReceiptButton({ token, autoStart = false }: { token: string; autoStart?: boolean }) {
  const [status, setStatus] = useState<"ready" | "working" | "done">("ready");
  const [error, setError] = useState("");
  const started = useRef(false);

  async function onDownload() {
    setStatus("working");
    setError("");
    try {
      const res = await fetch(`/api/registration/receipt/${token}`, { cache: "no-store" });
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

  useEffect(() => {
    if (!autoStart || started.current) return;
    started.current = true;
    void onDownload();
  }, [autoStart, token]);

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => void onDownload()}
        disabled={status === "working"}
        className="bg-navy px-5 py-3 text-xs tracking-widest text-white disabled:opacity-60"
      >
        {status === "working" ? "DOWNLOADING RECEIPT…" : status === "done" ? "DOWNLOAD RECEIPT AGAIN" : "DOWNLOAD RECEIPT"}
      </button>
      <p className="mt-2 text-sm text-muted">
        {status === "done"
          ? "Receipt download started. You can download it again from this page if needed."
          : "Your receipt will download automatically after successful payment. You can also download it instantly here."}
      </p>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

export function PaymentStatusPoller({ applicationId }: { applicationId: string }) {
  const [message, setMessage] = useState("Confirming payment with the bank…");

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    async function tick() {
      attempts += 1;
      try {
        const res = await fetch(`/api/registration/status?applicationId=${encodeURIComponent(applicationId)}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (cancelled) return;
        if (json.paymentStatus === "SUCCESS") {
          window.location.reload();
          return;
        }
        if (json.paymentStatus === "FAILED") {
          setMessage("Payment is not successful yet. If money was deducted, wait a minute and refresh this page.");
        } else {
          setMessage("Payment is pending. If you have already paid, this page will update automatically.");
        }
      } catch {
        if (!cancelled) setMessage("Checking payment status…");
      }
      if (!cancelled && attempts < 20) {
        window.setTimeout(() => void tick(), 2500);
      }
    }
    void tick();
    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  return <p className="mt-4 text-sm text-muted">{message}</p>;
}
