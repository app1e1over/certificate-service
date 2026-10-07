import { fetchCertificate } from "../../../../lib/certificates/api";
import { renderCertificatePdf } from "../../../../lib/certificates/pdf";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let cert;
  try {
    cert = await fetchCertificate(id);
  } catch {
    return new Response("Verification service unavailable", { status: 502 });
  }
  if (!cert) return new Response("Certificate not found", { status: 404 });

  const bytes = await renderCertificatePdf(cert);
  return new Response(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificate-${cert.id}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
