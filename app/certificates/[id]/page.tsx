import { notFound } from "next/navigation";
import { fetchCertificate, cleanName } from "../../../lib/certificates/api";
import { formatDate, average } from "../../../lib/certificates/format";
import { verifyUrl, qrDataUrl } from "../../../lib/certificates/qr";
import { PROGRAM } from "../../../lib/certificates/exams";
import { C, finePrint, verifyDisplay } from "../../../lib/certificates/design";
import { CertShell, At, Label, Brand, Corners, Decoration, Signature, Seal, u } from "../../../lib/certificates/shell";
import DownloadButton from "../../../components/DownloadButton";
import AutoDownload from "../../../components/AutoDownload";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CertificatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ full_name?: string | string[] }>;
}) {
  const { id } = await params;
  const fullName = cleanName((await searchParams).full_name);
  if (!fullName) notFound(); // the API needs the name as well as the ID

  let cert;
  try {
    cert = await fetchCertificate(id, fullName);
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
  const qr = await qrDataUrl(verifyUrl(cert.id, cert.fullName));
  const filename = `certificate-${cert.id}.pdf`;
  const vd = verifyDisplay()+`/${cert.id}?full_name=${encodeURI(cert.fullName)}`;

  return (
    <CertShell>
      <AutoDownload id={cert.id} fullName={cert.fullName} filename={filename} />

      <div className="wrap">
        <span className="status ok" role="status">Certificate found</span>
        <div className="actions-row">
          <DownloadButton id={cert.id} fullName={cert.fullName} filename={filename} />
        </div>

        {/* ---- Page 1: certificate ---- */}
        <div className="scroller">
          <section className="sheet" aria-label="Certificate">
            <Corners />
            <Brand />
            <At r={992} y={60}><Label>{PROGRAM.certificateLabel}</Label></At>
            <At r={992} y={77} s={12} className="muted">{cert.title}</At>

            <At x={62} y={164} s={13} className="muted">This certifies that</At>
            <At x={62} y={201} s={40} className="bold">{cert.fullName}</At>
            <At x={62} y={242} top s={13} lh={17} w={500} className="muted">
              {PROGRAM.durationLine(cert.exams.map((e) => e.examDate))}
            </At>

            <svg className="arrow" viewBox="0 0 14 38" style={{ left: u(61), top: u(286), width: u(14), height: u(38) }} aria-hidden="true">
              <path d="M7 0 V36 M2 31 L7 37 L12 31" fill="none" stroke={C.muted} strokeWidth="1" />
            </svg>
            <At x={62} y={349} s={34} className="bold">{cert.title}</At>

            <Decoration />
            <At r={992} y={166}><Label>Final score</Label></At>
            <At r={992} y={205} s={40} className="bold">{Math.round(avg)}/10</At>

            <div className="hr" style={{ left: u(62), width: u(930), top: u(398) }} />

            <At x={62} y={429}><Label>Soft skills</Label></At>
            <At x={62} y={445} top s={12.5} lh={19} w={425} className="body">{cert.softSkills}</At>
            <At x={552} y={429}><Label>Learning &amp; results</Label></At>
            <At x={552} y={445} top s={12.5} lh={19} w={440} className="body">{cert.hardSkills}</At>

            <Seal />

            <Signature />
            <At x={62} y={714} s={12} className="bold">{PROGRAM.ceoName}</At>
            <At x={62} y={731} s={10} className="muted">{PROGRAM.ceoTitle}</At>

            <At x={558} y={649}><Label>Issued</Label></At>
            <At x={558} y={672} s={14} className="bold">{formatDate(cert.issuedAt)}</At>

            <At x={800} y={649}><Label>Series</Label></At>
            <At x={800} y={672} s={13} className="bold">{cert.id}</At>
            <At x={800} y={689} s={9} style={{ color: C.faint }}><Link href={vd}>Verify</Link></At>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR code to verify this certificate" style={{ position: "absolute", left: u(905), top: u(639), width: u(84), height: u(84) }} />

            <At x={62} y={751} top s={10} lh={17} w={560} style={{ color: C.faint }}>{finePrint(vd)}</At>
          </section>
        </div>

        {/* ---- Page 2: transcript ---- */}
        <div className="scroller">
          <section className="sheet t" aria-label="Transcript">
            <Corners growing />
            <Brand />
            <At r={992} y={60}><Label>Transcript</Label></At>
            <At r={992} y={77} s={13} className="bold">{cert.fullName}</At>
            <At r={992} y={95} s={12} className="muted">{cert.title}</At>

            <table>
              <colgroup>
                <col style={{ width: "28.6%" }} />
                <col style={{ width: "48.6%" }} />
                <col style={{ width: "17%" }} />
                <col style={{ width: "5.8%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th><Label>Topic</Label></th>
                  <th><Label>Description</Label></th>
                  <th><Label>Exam date</Label></th>
                  <th className="g"><Label>Grade</Label></th>
                </tr>
              </thead>
              <tbody>
                {cert.exams.map((e, i) => (
                  <tr key={i}>
                    <td className="topic">{e.name}</td>
                    <td className="desc">{e.description}</td>
                    <td className="date">{e.examDate ? formatDate(e.examDate) : "–"}</td>
                    <td className="g">{e.mark}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="t-foot">
              <Label>{cert.id}</Label>
              <Label>2 / 2</Label>
            </div>
          </section>
        </div>
      </div>
    </CertShell>
  );
}
