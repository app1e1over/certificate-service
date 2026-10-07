import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { Certificate } from "./api";
import { formatDate, average } from "./format";
import { verifyUrl, verifyLabel, qrDataUrl } from "./qr";
import { PROGRAM, SOFT_SKILLS_COPY, LEARNING_RESULTS_STATIC } from "./exams";

const PAGE_SIZE: [number, number] = [595.28, 841.89]; // A4
const MARGIN = 50;

const BG = rgb(0.039, 0.039, 0.039); // #0a0a0a
const WHITE = rgb(1, 1, 1);
const MUTED = rgb(0.604, 0.612, 0.647); // #9a9ca5
const FAINT = rgb(0.42, 0.427, 0.46);
const LINE = rgb(0.165, 0.165, 0.18);

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(trial, size) > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = trial;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function rightAlignedX(page: PDFPage, text: string, font: PDFFont, size: number, rightEdge: number) {
  return rightEdge - font.widthOfTextAtSize(text, size);
}

export async function renderCertificatePdf(cert: Certificate): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Certificate — ${cert.fullName}`);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const qrPngDataUrl = await qrDataUrl(verifyUrl(cert.id));
  const qrPngBytes = Buffer.from(qrPngDataUrl.split(",")[1], "base64");
  const qrImage = await doc.embedPng(qrPngBytes);

  const marks = cert.exams.map((e) => e.mark);
  const avg = average(marks);

  // ---------- Page 1: certificate ----------
  const p1 = doc.addPage(PAGE_SIZE);
  const { width, height } = p1.getSize();
  const right = width - MARGIN;
  p1.drawRectangle({ x: 0, y: 0, width, height, color: BG });

  let y = height - 60;
  p1.drawText("TT  TENTHOUSAND", { x: MARGIN, y, size: 13, font: bold, color: WHITE });
  p1.drawText(PROGRAM.certificateLabel.toUpperCase(), { x: rightAlignedX(p1, PROGRAM.certificateLabel.toUpperCase(), bold, 9, right), y: y + 3, size: 9, font: bold, color: MUTED });
  p1.drawText(PROGRAM.track, { x: rightAlignedX(p1, PROGRAM.track, font, 10, right), y: y - 13, size: 10, font, color: MUTED });

  y -= 70;
  p1.drawText("This certifies that", { x: MARGIN, y, size: 11, font, color: MUTED });
  y -= 32;
  p1.drawText(cert.fullName, { x: MARGIN, y, size: 26, font: bold, color: WHITE });

  const scoreLabel = "FINAL SCORE";
  p1.drawText(scoreLabel, { x: rightAlignedX(p1, scoreLabel, bold, 9, right), y: y + 24, size: 9, font: bold, color: MUTED });
  const scoreText = `${Math.round(avg)}/10`;
  p1.drawText(scoreText, { x: rightAlignedX(p1, scoreText, bold, 26, right), y: y - 2, size: 26, font: bold, color: WHITE });

  y -= 26;
  for (const line of wrap(PROGRAM.durationLine(new Date(cert.exams[0].examDate ?? ""), new Date(cert.exams[cert.exams.length-1].examDate ?? "")), font, 10, 320)) {
    p1.drawText(line, { x: MARGIN, y, size: 10, font, color: MUTED });
    y -= 13;
  }
  y -= 24;
  p1.drawText(PROGRAM.track2, { x: MARGIN, y, size: 17, font: bold, color: WHITE });

  y -= 48;
  p1.drawLine({ start: { x: MARGIN, y }, end: { x: right, y }, thickness: 1, color: LINE });
  y -= 24;

  const colWidth = (width - MARGIN * 2 - 32) / 2;
  const col2X = MARGIN + colWidth + 32;
  let yL = y, yR = y;

  p1.drawText("SOFT SKILLS", { x: MARGIN, y: yL, size: 9, font: bold, color: MUTED });
  yL -= 16;
  for (const line of wrap(SOFT_SKILLS_COPY, font, 9.5, colWidth)) {
    p1.drawText(line, { x: MARGIN, y: yL, size: 9.5, font, color: rgb(0.83, 0.83, 0.85) });
    yL -= 13;
  }

  p1.drawText("LEARNING & RESULTS", { x: col2X, y: yR, size: 9, font: bold, color: MUTED });
  yR -= 16;
  const learningText = `Completed all ${cert.exams.length} modules with an average grade of ${avg.toFixed(1)}/10, ${LEARNING_RESULTS_STATIC}`;
  for (const line of wrap(learningText, font, 9.5, colWidth)) {
    p1.drawText(line, { x: col2X, y: yR, size: 9.5, font, color: rgb(0.83, 0.83, 0.85) });
    yR -= 13;
  }

  const bottomY = 150;
  p1.drawLine({ start: { x: MARGIN, y: bottomY + 40 }, end: { x: right, y: bottomY + 40 }, thickness: 1, color: LINE });

  p1.drawText(PROGRAM.signature, { x: MARGIN, y: bottomY, size: 16, font: bold, color: WHITE });
  p1.drawText(PROGRAM.ceoName, { x: MARGIN, y: bottomY - 16, size: 10, font: bold, color: WHITE });
  p1.drawText(PROGRAM.ceoTitle, { x: MARGIN, y: bottomY - 29, size: 9, font, color: MUTED });

  const issuedX = MARGIN + 220;
  p1.drawText("ISSUED", { x: issuedX, y: bottomY, size: 9, font: bold, color: MUTED });
  p1.drawText(formatDate(cert.issuedAt), { x: issuedX, y: bottomY - 16, size: 11, font: bold, color: WHITE });

  const qrSize = 72;
  p1.drawImage(qrImage, { x: right - qrSize, y: bottomY - qrSize + 10, width: qrSize, height: qrSize });
  const verifyLbl = "VERIFY";
  p1.drawText(verifyLbl, { x: rightAlignedX(p1, verifyLbl, bold, 9, right - qrSize - 12), y: bottomY, size: 9, font: bold, color: MUTED });
  p1.drawText(cert.id, { x: rightAlignedX(p1, cert.id, bold, 10, right - qrSize - 12), y: bottomY - 16, size: 10, font: bold, color: WHITE });

  const fine = `This certificate confirms completion of TenThousand's internship programme. It is not an academic degree or accredited qualification. Scan the QR code or visit ${verifyLabel(cert.id)} to check authenticity.`;
  let fy = 60;
  for (const line of wrap(fine, font, 7.5, width - MARGIN * 2 - qrSize - 20)) {
    p1.drawText(line, { x: MARGIN, y: fy, size: 7.5, font, color: FAINT });
    fy -= 10;
  }

  // ---------- Page 2: transcript ----------
  let p2: PDFPage = doc.addPage(PAGE_SIZE);
  p2.drawRectangle({ x: 0, y: 0, width, height, color: BG });
  let y2 = height - 60;

  p2.drawText("TT  TENTHOUSAND", { x: MARGIN, y: y2, size: 13, font: bold, color: WHITE });
  const tLabel = "TRANSCRIPT";
  p2.drawText(tLabel, { x: rightAlignedX(p2, tLabel, bold, 9, right), y: y2 + 3, size: 9, font: bold, color: MUTED });
  p2.drawText(cert.fullName, { x: rightAlignedX(p2, cert.fullName, bold, 11, right), y: y2 - 13, size: 11, font: bold, color: WHITE });
  p2.drawText(PROGRAM.track2, { x: rightAlignedX(p2, PROGRAM.track2, font, 9, right), y: y2 - 27, size: 9, font, color: MUTED });

  y2 -= 64;
  const headers = ["TOPIC", "EXAM DATE", "GRADE"];
  const colX = [MARGIN, MARGIN + 300, right - 50];
  headers.forEach((h, i) => p2.drawText(h, { x: colX[i], y: y2, size: 9, font: bold, color: MUTED }));
  y2 -= 10;
  p2.drawLine({ start: { x: MARGIN, y: y2 }, end: { x: right, y: y2 }, thickness: 1, color: LINE });
  y2 -= 22;

  const topicWidth = colX[1] - MARGIN - 20;

  for (const exam of cert.exams) {
    if (y2 < 110) {
      p2 = doc.addPage(PAGE_SIZE);
      p2.drawRectangle({ x: 0, y: 0, width, height, color: BG });
      y2 = height - 60;
    }
    const rowTop = y2;
    p2.drawText(exam.name, { x: colX[0], y: y2, size: 10.5, font: bold, color: WHITE });
    p2.drawText(exam.examDate ? formatDate(exam.examDate) : "–", { x: colX[1], y: y2, size: 10, font, color: rgb(0.83, 0.83, 0.85) });
    p2.drawText(String(exam.mark), { x: rightAlignedX(p2, String(exam.mark), bold, 11, right), y: y2, size: 11, font: bold, color: WHITE });
    y2 -= 15;

    const descLines = wrap(exam.description, font, 8.5, topicWidth + 140);
    for (const line of descLines) {
      p2.drawText(line, { x: colX[0], y: y2, size: 8.5, font, color: MUTED });
      y2 -= 11;
    }
    y2 -= 10;
    p2.drawLine({ start: { x: MARGIN, y: y2 }, end: { x: right, y: y2 }, thickness: 0.5, color: LINE });
    y2 -= 20;
    void rowTop;
  }

  p2.drawText(cert.id, { x: MARGIN, y: 40, size: 8, font, color: FAINT });
  p2.drawText("2 / 2", { x: rightAlignedX(p2, "2 / 2", font, 8, right), y: 40, size: 8, font, color: FAINT });

  return doc.save();
}
