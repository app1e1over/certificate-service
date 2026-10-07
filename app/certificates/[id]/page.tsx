import { notFound } from "next/navigation";
import { fetchCertificate } from "../../../lib/certificates/api";
import { formatDate, average } from "../../../lib/certificates/format";
import { verifyUrl, verifyLabel, qrDataUrl } from "../../../lib/certificates/qr";
import { PROGRAM, SOFT_SKILLS_COPY, LEARNING_RESULTS_STATIC } from "../../../lib/certificates/exams";
import { CertShell } from "../../../lib/certificates/shell";
import DownloadButton from "../../../components/DownloadButton";
import AutoDownload from "../../../components/AutoDownload";

export const dynamic = "force-dynamic";

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let cert;
  try {
    cert = await fetchCertificate(id);
  } catch {
    return (
      <CertShell>
        <div className="error-wrap">
          <span className="status warn" role="status">Verification unavailable</span>
          <h1 className="name">We couldn&apos;t check this certificate right now</h1>
          <p className="completion-line">The certificate lookup service didn&apos;t respond correctly. Please try again shortly.</p>
        </div>
      </CertShell>
    );
  }
  if (!cert) notFound();

  const marks = cert.exams.map((e) => e.mark);
  const avg = average(marks);
  const qr = await qrDataUrl(verifyUrl(cert.id));
  const filename = `certificate-${cert.id}.pdf`;
  console.log(cert.exams);
  return (
    <CertShell>
      <AutoDownload id={cert.id} filename={filename} />

      {/* ---- Page 1: certificate ---- */}
      <section className="page corner-b">
        <span className="status ok" role="status">Certificate found</span>

        <div className="top-row">
          <div className="brand">
            <span className="mark">TT</span>
            <span className="word">TENTHOUSAND</span>
          </div>
          <div className="top-right">
            <span className="label">{PROGRAM.certificateLabel}</span>
            <div className="sub">{PROGRAM.track}</div>
          </div>
        </div>

        <div className="top-row" style={{ marginBottom: 0, alignItems: "flex-start" }}>
          <div>
            <p className="intro">This certifies that</p>
            <h1 className="name">{cert.fullName}</h1>
            <p className="completion-line">{PROGRAM.durationLine(new Date(cert.exams[0].examDate ?? ""), new Date(cert.exams[cert.exams.length-1].examDate ?? ""),)}</p>
            <div className="arrow">↓</div>
            <h2 className="track">{PROGRAM.track2}</h2>
          </div>
          <div className="score-block">
            <span className="label" style={{ justifyContent: "flex-end" }}>Final score</span>
            <div className="num">{Math.round(avg)}/10</div>
          </div>
        </div>

        <div className="two-col">
          <div>
            <h3>Soft skills</h3>
            <p>{SOFT_SKILLS_COPY}</p>
          </div>
          <div>
            <h3>Learning &amp; results</h3>
            <p>
              Completed all {cert.exams.length} modules with an average grade of {avg.toFixed(1)}/10,{" "}
              {LEARNING_RESULTS_STATIC}
            </p>
          </div>
        </div>

        <div className="sign-row">
          <div>
            <div className="signature">{PROGRAM.signature}</div>
            <div className="signer-name">{PROGRAM.ceoName}</div>
            <div className="signer-title">{PROGRAM.ceoTitle}</div>
          </div>
          <div className="issued">
            <span className="label">Issued</span>
            <div className="num">{formatDate(cert.issuedAt)}</div>
          </div>
          <div className="verify">
            <span className="label" style={{ justifyContent: "flex-end" }}>Verify</span>
            <div className="code">{cert.id}</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR code to verify this certificate" />
            <div className="host">{verifyLabel(cert.id)}</div>
          </div>
        </div>

        <p className="fineprint">
          This certificate confirms completion of TenThousand&apos;s internship programme. It is not an academic
          degree or accredited qualification. Scan the QR code or visit {verifyLabel(cert.id)} to check authenticity.
        </p>

        <div className="actions-row">
          <DownloadButton id={cert.id} filename={filename} />
        </div>
      </section>

      {/* ---- Page 2: transcript ---- */}
      <section className="page">
        <div className="t-head">
          <div className="brand">
            <span className="mark">TT</span>
            <span className="word">TENTHOUSAND</span>
          </div>
          <div className="who">
            <span className="label" style={{ justifyContent: "flex-end" }}>Transcript</span>
            <div className="name">{cert.fullName}</div>
            <div className="track">{PROGRAM.track2}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Topic</th>
              <th>Description</th>
              <th>Exam date</th>
              <th>Grade</th>
            </tr>
          </thead>
          <tbody>
            {cert.exams.map((e, i) => (
              <tr key={i}>
                <td className="topic">{e.name}</td>
                <td className="desc">{e.description}</td>
                <td className="date">{e.examDate ? formatDate(e.examDate) : "–"}</td>
                <td className="grade">{e.mark}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="t-foot">
          <span>{cert.id}</span>
          <span>2 / 2</span>
        </div>
      </section>
    </CertShell>
  );
}
