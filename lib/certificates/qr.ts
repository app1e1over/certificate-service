import QRCode from "qrcode";

// Builds the URL the QR code / "VERIFY" box point to for a given certificate.
export function verifyUrl(id: string): string {
  const base = (process.env.PUBLIC_VERIFY_URL || "").replace(/\/$/, "");
  return `${base}/${encodeURIComponent(id)}`;
}

export function verifyLabel(id: string): string {
  const base = process.env.PUBLIC_VERIFY_URL;
  if (!base) return `/certificates/${id}`;
  try {
    return new URL(base).host + `/${id}`;
  } catch {
    return base;
  }
}

// PNG data URL, for both the web page (<img>) and the PDF (embedPng).
export async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { margin: 0, width: 240, color: { dark: "#0a0a0a", light: "#ffffff" } });
}
