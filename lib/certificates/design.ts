// Single source of truth for the Canva layout ("TenThousand Internship Certificate — template").
// Canva canvas: 1056 x 816 px per page. Both the web page (shell/page) and the PDF (pdf.ts) read these
// numbers, so the two stay in sync. All coordinates are in Canva px, origin top-left.

export const W = 1056;
export const H = 816;

export const C = {
  bg: "#0a0a0a",
  white: "#ffffff",
  text: "#d4d4d8",
  muted: "#9a9ca5",
  faint: "#62646b",
  line: "#25252a",
  hair: "#18181b",
  deco: "#17171a",
};

// Shown in the fine print / under the cert ID. If PUBLIC_VERIFY_URL is set we show its host+path.
export function verifyDisplay(): string {
  const base = process.env.PUBLIC_VERIFY_URL;
  if (!base) return "tenthousand.io/verify";
  return base;
}

export const finePrint = (display: string) =>
  `This certificate confirms completion of TenThousand's internship program. It is not an academic degree or accredited qualification. Scan the QR code or visit ${display} to check authenticity.`;

// ---------------------------------------------------------------------------------------------------
// Handwritten CEO signature (stroke paths in a 100x100 box). Placed at SIGNATURE.x/y, SIGNATURE.size px.
// ---------------------------------------------------------------------------------------------------
export const SIGNATURE = {
  x: 152,
  y: 638,
  size: 66,
  strokeWidth: 1.6,
  paths: [
    // tall "V" with the loop on its right
    "M 10 18 C 16 46 24 76 32 92 C 36 98 41 90 46 70 C 52 46 58 22 64 10 C 67 3 73 5 70 15 C 64 36 48 64 38 82",
    // long flourish sweeping up to the right
    "M 8 88 C 30 82 62 70 98 30",
    // trailing tail
    "M 44 88 C 52 80 56 92 64 84 C 70 78 74 88 84 82 C 90 78 94 82 99 78",
  ],
};

// TT logo mark (48 x 48 box): white rounded square with two black T shapes.
export const LOGO = {
  size: 48,
  radius: 8,
  paths: [
    "M 8 11 H 23 V 19 H 19 V 38 H 12 V 19 H 8 Z",
    "M 25 11 H 40 V 19 H 36 V 38 H 29 V 19 H 25 Z",
  ],
};

// ---------------------------------------------------------------------------------------------------
// Circular "Coding Academy" seal (200 x 200 box). Placed at SEAL.x/y, SEAL.size px.
// ---------------------------------------------------------------------------------------------------
export const SEAL = { x: 326, y: 533, size: 166 };
// The whole seal (text ring, logo, VERIFIED) is turned by this many degrees (negative = counter-clockwise).
export const SEAL_ROT = -18;

// Rotates a point given in seal units about the seal centre by SEAL_ROT.
export function sealPoint(ux: number, uy: number): [number, number] {
  const a = (SEAL_ROT * Math.PI) / 180;
  const dx = ux - 100;
  const dy = uy - 100;
  return [100 + dx * Math.cos(a) - dy * Math.sin(a), 100 + dx * Math.sin(a) + dy * Math.cos(a)];
}

// Small dots running around the outer edge of the seal.
export function sealDots(): [number, number][] {
  return Array.from({ length: 72 }, (_, i) => {
    const a = (i / 72) * Math.PI * 2;
    return [100 + 94.6 * Math.cos(a), 100 + 94.6 * Math.sin(a)] as [number, number];
  });
}

export const SEAL_GEO = {
  cx: 100,
  cy: 100,
  rOuter: 98,
  rBand: 91,
  rInner: 58,
  rText: 75,
  fs: 15,
  spacing: 2.8,
  box: 38, // TT mark
};

// Helvetica-Bold advance widths (1/1000 em) for the glyphs used on the seal.
const ADV: Record<string, number> = {
  A: 722, C: 722, D: 722, E: 667, G: 778, H: 722, I: 278, M: 833, N: 722, O: 778, S: 667, T: 611, U: 722, Y: 667, " ": 278,
};

export type Glyph = { ch: string; x: number; y: number; rot: number };

// Places each letter on a circle. rot is clockwise degrees (screen space); x/y is the baseline centre.
export function arcText(text: string, top: boolean): Glyph[] {
  const { cx, cy, rText, fs, spacing } = SEAL_GEO;
  const chars = [...text];
  const adv = chars.map((c) => ((ADV[c] ?? 700) / 1000) * fs + spacing);
  const total = adv.reduce((a, b) => a + b, 0) - spacing;
  const capH = fs * 0.72;
  const r = top ? rText - capH / 2 : rText + capH / 2;
  let run = 0;
  return chars.map((ch, i) => {
    const w = ((ADV[ch] ?? 700) / 1000) * fs;
    const mid = run + w / 2 - total / 2; // arc-length offset of glyph centre from the text's centre
    run += adv[i];
    const deg = (mid / r) * (180 / Math.PI);
    const th = top ? -90 + deg : 90 - deg;
    const rad = (th * Math.PI) / 180;
    return { ch, x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad), rot: top ? th + 90 : th - 90 };
  });
}

export const SEAL_TOP = "TENTHOUSAND";
export const SEAL_BOTTOM = "CODING ACADEMY";

// Faint decorative strokes behind the final score, Canva px: two fans of lines leaning in towards each other
// (left fan "\\ \\", right fan "/ /") with a few upright lines between them. [x1,y1,x2,y2,tone 0-1]
export const DECO_LINES: [number, number, number, number, number][] = [
  // left fan
  [636, 238, 668, 366, 0.55], [656, 236, 684, 368, 0.75], [678, 240, 700, 366, 0.9], [700, 236, 716, 368, 1],
  [722, 240, 732, 364, 0.9], [744, 238, 750, 366, 0.7], [764, 242, 768, 362, 0.5],
  // centre
  [800, 262, 802, 348, 0.35], [826, 270, 826, 340, 0.3], [852, 262, 850, 348, 0.35],
  // right fan
  [884, 242, 878, 362, 0.5], [906, 238, 896, 366, 0.7], [928, 240, 914, 364, 0.9], [950, 236, 932, 368, 1],
  [972, 240, 950, 366, 0.9], [994, 236, 968, 368, 0.75], [1016, 238, 986, 366, 0.55],
];
export const DECO_BASE = [10, 10, 10]; // background rgb
export const DECO_TOP = [34, 34, 38]; // line rgb at tone 1
export const decoColor = (tone: number) =>
  "#" + DECO_BASE.map((b, i) => Math.round(b + (DECO_TOP[i] - b) * tone).toString(16).padStart(2, "0")).join("");
