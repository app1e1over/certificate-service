"use client";
import { useEffect } from "react";

// If localStorage["always-download"] === "true", silently fetch and save the PDF on page load.
export default function AutoDownload({ id, filename }: { id: string; filename: string }) {
  useEffect(() => {
    let shouldDownload = false;
    try {
      shouldDownload = window.localStorage.getItem("always-download") === "true";
    } catch {
      return; // localStorage unavailable (e.g. privacy mode) — do nothing
    }
    if (!shouldDownload) return;

    let revoke: string | null = null;
    (async () => {
      try {
        const res = await fetch(`/certificates/${encodeURIComponent(id)}/pdf`);
        if (!res.ok) return;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        revoke = url;
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch {
        // silent — auto-download is a convenience, not critical
      }
    })();

    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [id, filename]);

  return null;
}
