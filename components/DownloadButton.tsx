"use client";
import { useState } from "react";

export default function DownloadButton({ id, filename }: { id: string; filename: string }) {
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      const res = await fetch(`/certificates/${encodeURIComponent(id)}/pdf`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("Couldn't download the PDF. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="btn secondary" onClick={download} disabled={busy}>
      {busy ? "Preparing PDF…" : "Download PDF"}
    </button>
  );
}
