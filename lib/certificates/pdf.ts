import {
  PDFDocument,
  StandardFonts,
  LineCapStyle,
  degrees,
  rgb,
  type PDFFont,
  type PDFPage,
  type Color,
} from "pdf-lib";
import { PDFName, PDFDict, PDFArray, PDFString } from "pdf-lib";
import type { Certificate } from "./api";
import { formatDate, average } from "./format";
import { verifyUrl, qrDataUrl } from "./qr";
import { PROGRAM } from "./exams";
import {
  C,
  DECO_LINES,
  H,
  LOGO,
  SEAL,
  SEAL_BOTTOM,
  SEAL_GEO,
  SEAL_ROT,
  SEAL_TOP,
  SIGNATURE,
  W,
  arcText,
  decoColor,
  finePrint,
  sealDots,
  sealPoint,
  verifyDisplay,
} from "./design";

// The Canva page is 1056 x 816 px (11 x 8.5 in @ 96dpi) -> 792 x 612 pt. Every position below is in Canva px
// (same numbers as the web page, see design.ts) and converted with K.
const K = 0.75;
const PW = W * K;
const PH = H * K;
const X = (x: number) => x * K;
const Y = (y: number) => PH - y * K;

const col = (hex: string): Color =>
  rgb(
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  );

const WHITE = col(C.white);
const TEXT = col(C.text);
const MUTED = col(C.muted);
const FAINT = col(C.faint);
const LINE = col(C.line);
const HAIR = col(C.hair);

type Fonts = { reg: PDFFont; bold: PDFFont; mono: PDFFont };

// Standard PDF fonts only cover WinAnsi; swap anything else for "?" instead of throwing.
function safe(font: PDFFont, s: string): string {
  const ok = new Set(font.getCharacterSet());
  return [...s].map((ch) => (ok.has(ch.codePointAt(0)!) ? ch : "?")).join("");
}

function wrap(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const words = safe(font, text).split(/\s+/).filter(Boolean);
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

// Text whose vertical *centre* is at Canva y. `size` is in Canva px. `x` is the left edge, or the right edge when right=true.
function txt(
  page: PDFPage,
  s: string,
  x: number,
  yc: number,
  size: number,
  font: PDFFont,
  color: Color,
  opts: { right?: boolean; spacing?: number } = {},
) {
  const t = safe(font, s);
  const sz = size * K;
  const sp = (opts.spacing ?? 0) * K;
  const width = font.widthOfTextAtSize(t, sz) + sp * Math.max(0, t.length - 1);
  let px = opts.right ? X(x) - width : X(x);
  const base = Y(yc) - sz * 0.36;
  if (!sp) {
    page.drawText(t, { x: px, y: base, size: sz, font, color });
    return;
  }
  for (const ch of t) {
    page.drawText(ch, { x: px, y: base, size: sz, font, color });
    px += font.widthOfTextAtSize(ch, sz) + sp;
  }
}

function drawLink(
  page: PDFPage,
  url: string,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const context = page.doc.context;

  const linkAnnotation = context.obj({
    Type: "Annot",
    Subtype: "Link",
    Rect: [x, y, x + width, y + height],
    Border: [0, 0, 0], // Invisible border
    C: [0, 0, 0],
    A: {
      Type: "Action",
      S: "URI",
      URI: PDFString.of(url),
    },
  });

  const linkRef = context.register(linkAnnotation);

  let annots = page.node.get(PDFName.of("Annots")) as PDFArray;
  if (!annots) {
    annots = context.obj([]) as PDFArray;
    page.node.set(PDFName.of("Annots"), annots);
  }

  annots.push(linkRef);
}

// Wrapped paragraph; `top` is the top of the first line box (line-height lh).
function para(
  page: PDFPage,
  s: string,
  x: number,
  top: number,
  maxW: number,
  size: number,
  lh: number,
  font: PDFFont,
  color: Color,
): number {
  const lines = wrap(s, font, size * K, maxW * K);
  lines.forEach((l, i) =>
    txt(page, l, x, top + lh * i + lh / 2, size, font, color),
  );
  return lines.length;
}

// "■ LABEL" in spaced mono caps (matches .lab in shell.tsx).
const LAB = { size: 10.5, spacing: 0.34 * 10.5, sq: 6, gap: 8 };
function label(
  page: PDFPage,
  f: Fonts,
  s: string,
  x: number,
  yc: number,
  o: { right?: boolean; color?: Color } = {},
) {
  const t = s.toUpperCase();
  const n = [...t].length;
  const textW = n * 0.6 * LAB.size + (n - 1) * LAB.spacing;
  const total = LAB.sq + LAB.gap + textW;
  const left = o.right ? x - total : x;
  const c = o.color ?? MUTED;
  page.drawRectangle({
    x: X(left),
    y: Y(yc) - (LAB.sq * K) / 2,
    width: LAB.sq * K,
    height: LAB.sq * K,
    color: c,
  });
  txt(page, t, left + LAB.sq + LAB.gap, yc, LAB.size, f.mono, c, {
    spacing: LAB.spacing,
  });
}

function roundedRectPath(w: number, h: number, r: number) {
  return `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;
}

// TT mark at Canva (x,y), `size` px wide, optionally rotated about its own top-left by `rotCw` degrees (clockwise).
function logoMark(
  page: PDFPage,
  x: number,
  y: number,
  size: number,
  rotCw = 0,
) {
  const sc = (size / LOGO.size) * K;
  const o = { x: X(x), y: Y(y), scale: sc, rotate: degrees(-rotCw) };
  page.drawSvgPath(roundedRectPath(LOGO.size, LOGO.size, LOGO.radius), {
    ...o,
    color: WHITE,
  });
  for (const d of LOGO.paths) page.drawSvgPath(d, { ...o, color: col(C.bg) });
}

function brand(page: PDFPage, f: Fonts, x = 62, y = 56) {
  logoMark(page, x, y, 48);
  txt(page, "TENTHOUSAND", x + 60, y + 25, 17, f.bold, WHITE, {
    spacing: 0.12 * 17,
  });
}

function corners(page: PDFPage) {
  for (const [cx, cy] of [
    [33, 33],
    [1021, 33],
    [33, 782],
    [1021, 782],
  ]) {
    page.drawLine({
      start: { x: X(cx - 5), y: Y(cy) },
      end: { x: X(cx + 5), y: Y(cy) },
      thickness: 0.7,
      color: FAINT,
    });
    page.drawLine({
      start: { x: X(cx), y: Y(cy - 5) },
      end: { x: X(cx), y: Y(cy + 5) },
      thickness: 0.7,
      color: FAINT,
    });
  }
}

function background(page: PDFPage) {
  page.drawRectangle({ x: 0, y: 0, width: PW, height: PH, color: col(C.bg) });
}

function drawSeal(page: PDFPage, f: Fonts) {
  const g = SEAL_GEO;
  const k = SEAL.size / 200; // seal units -> Canva px
  const sx = (ux: number) => SEAL.x + ux * k;
  const sy = (uy: number) => SEAL.y + uy * k;
  const ring = (r: number, fill: string | null, stroke: string, sw: number) =>
    page.drawCircle({
      x: X(sx(g.cx)),
      y: Y(sy(g.cy)),
      size: r * k * K,
      ...(fill ? { color: col(fill) } : {}),
      borderColor: col(stroke),
      borderWidth: sw * k * K,
    });
  ring(g.rOuter, "#0f0f11", "#c9cad0", 2.2);
  ring(g.rBand, "#18181b", "#55565c", 0.8);
  for (const [dx, dy] of sealDots())
    page.drawCircle({
      x: X(sx(dx)),
      y: Y(sy(dy)),
      size: 0.9 * k * K,
      color: col("#8d8f96"),
    });
  ring(g.rInner, "#0c0c0e", "#c9cad0", 1.6);
  ring(g.rInner - 4, null, "#3a3b40", 0.6);

  // text ring: positions are rotated by SEAL_ROT, glyph angles get the same turn
  const fs = g.fs * k * K;
  for (const gl of [
    ...arcText(SEAL_TOP, true),
    ...arcText(SEAL_BOTTOM, false),
  ]) {
    const [rx, ry] = sealPoint(gl.x, gl.y);
    const rot = gl.rot + SEAL_ROT;
    const w = f.bold.widthOfTextAtSize(gl.ch, fs);
    const phi = (-rot * Math.PI) / 180; // PDF rotates counter-clockwise
    page.drawText(gl.ch, {
      x: X(sx(rx)) - (w / 2) * Math.cos(phi),
      y: Y(sy(ry)) - (w / 2) * Math.sin(phi),
      size: fs,
      font: f.bold,
      color: col("#f2f2f4"),
      rotate: degrees(-rot),
    });
  }
  for (const ux of [g.cx - g.rText, g.cx + g.rText]) {
    const [rx, ry] = sealPoint(ux, g.cy);
    page.drawCircle({
      x: X(sx(rx)),
      y: Y(sy(ry)),
      size: 2.4 * k * K,
      color: col("#c9cad0"),
    });
  }

  // logo in the middle: its top-left corner is rotated about the seal centre, then the mark is turned by SEAL_ROT
  const [lx, ly] = sealPoint(g.cx - g.box / 2, g.cy - g.box / 2 - 8);
  logoMark(page, sx(lx), sy(ly), g.box * k, SEAL_ROT);

  // VERIFIED, one letter at a time along the rotated baseline
  const vs = 8 * k * K;
  const sp = 2.4 * k * K;
  const word = "VERIFIED";
  const adv = f.mono.widthOfTextAtSize("V", vs);
  const total = word.length * adv + (word.length - 1) * sp;
  const a = (SEAL_ROT * Math.PI) / 180; // screen clockwise
  const [cx0, cy0] = sealPoint(g.cx, g.cy + 34);
  const dir = { x: Math.cos(a), y: -Math.sin(a) }; // baseline direction in PDF space
  [...word].forEach((ch, i) => {
    const off = -total / 2 + i * (adv + sp);
    page.drawText(ch, {
      x: X(sx(cx0)) + dir.x * off,
      y: Y(sy(cy0)) + dir.y * off,
      size: vs,
      font: f.mono,
      color: col("#b4b5bb"),
      rotate: degrees(-SEAL_ROT),
    });
  });
}

export async function renderCertificatePdf(
  cert: Certificate,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Certificate — ${cert.fullName}`);
  const f: Fonts = {
    reg: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    mono: await doc.embedFont(StandardFonts.Courier),
  };

  const qrImage = await doc.embedPng(
    Buffer.from(
      (await qrDataUrl(verifyUrl(cert.id, cert.fullName))).split(",")[1],
      "base64",
    ),
  );
  const avg = average(cert.exams.map((e) => e.mark));
  const vd =
    verifyDisplay() + `/${cert.id}?full_name=${encodeURI(cert.fullName)}`;

  // ================= Page 1: certificate =================
  const p1 = doc.addPage([PW, PH]);
  background(p1);
  corners(p1);
  brand(p1, f);
  label(p1, f, PROGRAM.certificateLabel, 992, 60, { right: true });
  txt(p1, cert.title, 992, 77, 12, f.reg, MUTED, { right: true });

  txt(p1, "This certifies that", 62, 164, 13, f.reg, MUTED);
  txt(p1, cert.fullName, 62, 201, 40, f.bold, WHITE);
  para(
    p1,
    PROGRAM.durationLine(cert.exams.map((e) => e.examDate)),
    62,
    242,
    500,
    13,
    17,
    f.reg,
    MUTED,
  );

  // arrow
  p1.drawLine({
    start: { x: X(68), y: Y(286) },
    end: { x: X(68), y: Y(322) },
    thickness: 0.75,
    color: MUTED,
  });
  p1.drawLine({
    start: { x: X(63), y: Y(317) },
    end: { x: X(68), y: Y(323) },
    thickness: 0.75,
    color: MUTED,
  });
  p1.drawLine({
    start: { x: X(73), y: Y(317) },
    end: { x: X(68), y: Y(323) },
    thickness: 0.75,
    color: MUTED,
  });
  txt(p1, cert.title, 62, 349, 34, f.bold, WHITE);

  for (const [x1, y1, x2, y2, tone] of DECO_LINES) {
    p1.drawLine({
      start: { x: X(x1), y: Y(y1) },
      end: { x: X(x2), y: Y(y2) },
      thickness: 2.4 * K,
      color: col(decoColor(tone)),
      lineCap: LineCapStyle.Round,
    });
  }
  label(p1, f, "Final score", 992, 166, { right: true });
  txt(p1, `${Math.round(avg)}/10`, 992, 205, 40, f.bold, WHITE, {
    right: true,
  });

  p1.drawLine({
    start: { x: X(62), y: Y(398) },
    end: { x: X(992), y: Y(398) },
    thickness: 0.75,
    color: LINE,
  });

  label(p1, f, "Soft skills", 62, 429);
  para(p1, cert.softSkills, 62, 445, 425, 12.5, 19, f.reg, TEXT);
  label(p1, f, "Learning & results", 552, 429);
  para(p1, cert.hardSkills, 552, 445, 440, 12.5, 19, f.reg, TEXT);

  drawSeal(p1, f);

  // signature (stroke paths from design.ts) + signer
  for (const d of SIGNATURE.paths) {
    p1.drawSvgPath(d, {
      x: X(SIGNATURE.x),
      y: Y(SIGNATURE.y),
      scale: (K * SIGNATURE.size) / 100,
      borderColor: col("#e8e8ea"),
      borderWidth: SIGNATURE.strokeWidth,
      borderLineCap: LineCapStyle.Round,
    });
  }
  txt(p1, PROGRAM.ceoName, 62, 714, 12, f.bold, WHITE);
  txt(p1, PROGRAM.ceoTitle, 62, 731, 10, f.reg, MUTED);

  label(p1, f, "Issued", 558, 649);
  txt(p1, formatDate(cert.issuedAt), 558, 672, 14, f.bold, WHITE);
  label(p1, f, "Series", 800, 649);
  txt(p1, cert.id, 800, 672, 13, f.bold, WHITE);
  const textToDraw = "Verify";
  const linkUrl = vd; 
  txt(p1, textToDraw, 800, 689, 9, f.reg, FAINT);
  const sz = 9 * K;
  const textWidth = f.reg.widthOfTextAtSize(safe(f.reg, textToDraw), sz);
  const linkX = X(800);
  const linkY = Y(689) - sz * 0.36;
  // 3. Attach the clickable link box over the text
  drawLink(p1, linkUrl, linkX, linkY, textWidth, sz);
  
  p1.drawImage(qrImage, {
    x: X(905),
    y: Y(639 + 84),
    width: 84 * K,
    height: 84 * K,
  });

  para(p1, finePrint(vd), 62, 751, 560, 10, 17, f.reg, FAINT);

  // ================= Page 2+: transcript =================
  const tPages: PDFPage[] = [];
  const newTranscriptPage = () => {
    const p = doc.addPage([PW, PH]);
    background(p);
    corners(p);
    brand(p, f);
    label(p, f, "Transcript", 992, 60, { right: true });
    txt(p, cert.fullName, 992, 77, 13, f.bold, WHITE, { right: true });
    txt(p, cert.title, 992, 95, 12, f.reg, MUTED, { right: true });
    label(p, f, "Topic", 62, 149);
    label(p, f, "Description", 328, 149);
    label(p, f, "Exam date", 780, 149);
    label(p, f, "Grade", 992, 149, { right: true });
    tPages.push(p);
    return p;
  };

  let p2 = newTranscriptPage();
  let y = 165;
  const LIMIT = 735;
  let firstOnPage = true;
  for (const e of cert.exams) {
    const topicLines = wrap(e.name, f.bold, 13 * K, 242 * K);
    const descLines = wrap(e.description, f.reg, 10 * K, 428 * K);
    const h =
      30 + Math.max(topicLines.length * 17.5, 2 + descLines.length * 15);
    if (y + h > LIMIT && !firstOnPage) {
      p2 = newTranscriptPage();
      y = 165;
      firstOnPage = true;
    }
    if (!firstOnPage)
      p2.drawLine({
        start: { x: X(62), y: Y(y) },
        end: { x: X(992), y: Y(y) },
        thickness: 0.5,
        color: HAIR,
      });
    const top = y + 15;
    topicLines.forEach((l, i) =>
      txt(p2, l, 62, top + 17.5 * i + 8.75, 13, f.bold, WHITE),
    );
    descLines.forEach((l, i) =>
      txt(p2, l, 328, top + 2 + 15 * i + 7.5, 10, f.reg, MUTED),
    );
    txt(
      p2,
      e.examDate ? formatDate(e.examDate) : "–",
      780,
      top + 8.75,
      13,
      f.reg,
      TEXT,
    );
    txt(p2, String(e.mark), 992, top + 9, 14, f.bold, WHITE, { right: true });
    y += h;
    firstOnPage = false;
  }

  const total = 1 + tPages.length;
  tPages.forEach((p, i) => {
    p.drawLine({
      start: { x: X(62), y: Y(743) },
      end: { x: X(992), y: Y(743) },
      thickness: 0.75,
      color: LINE,
    });
    label(p, f, cert.id, 62, 766, { color: FAINT });
    label(p, f, `${i + 2} / ${total}`, 992, 766, { right: true, color: FAINT });
  });

  return doc.save();
}
