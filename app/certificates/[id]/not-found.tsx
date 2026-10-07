import { CertShell } from "../../../lib/certificates/shell";

export default function CertificateNotFound() {
  return (
    <CertShell>
      <div className="notfound-wrap">
        <span className="status bad" role="status">Certificate not found</span>
        <h1 className="name">No certificate with this ID exists</h1>
        <p className="completion-line">
          We couldn&apos;t find a certificate matching the ID in this link. Check the ID for typos, or ask the
          certificate holder for the original link.
        </p>
      </div>
    </CertShell>
  );
}
