import type { CSSProperties, ReactNode } from "react";
import { C, DECO_LINES, H, LOGO, SEAL, SEAL_BOTTOM, SEAL_GEO, SEAL_ROT, SEAL_TOP, SIGNATURE, W, arcText, decoColor, sealDots } from "./design";

// Scoped under .tt so it never leaks into, or depends on, a host site's CSS.
export function CertShell({ children }: { children: ReactNode }) {
  return (
    <div className="tt">
      <style>{css}</style>
      {children}
    </div>
  );
}

// Canva px -> responsive length. A .sheet is 1056 Canva px wide and scales with its container.
export const u = (n: number) => `calc(var(--u) * ${n})`;

type PosProps = {
  x?: number; // left edge
  r?: number; // Canva x of the right edge; text is right-aligned
  y: number; // vertical centre (or top when top=true)
  top?: boolean;
  s?: number; // font size
  w?: number; // max width
  lh?: number; // line height
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

// Absolutely positioned text, placed using the Canva coordinates.
export function At({ x, r, y, top, s, w, lh, className, style, children }: PosProps) {
  const st: CSSProperties = {
    position: "absolute",
    top: u(y),
    ...(r !== undefined ? { right: u(W - r), textAlign: "right" } : { left: u(x ?? 0) }),
    ...(top ? {} : { transform: "translateY(-50%)" }),
    ...(s ? { fontSize: u(s) } : {}),
    ...(w ? { maxWidth: u(w) } : {}),
    ...(lh ? { lineHeight: u(lh) } : {}),
    ...style,
  };
  return (
    <div className={className} style={st}>
      {children}
    </div>
  );
}

// "■ LABEL" in spaced mono caps.
export function Label({ children }: { children: ReactNode }) {
  return (
    <span className="lab">
      <i />
      <span>{children}</span>
    </span>
  );
}

// The TT mark: white rounded square with two black T shapes. Also used (smaller) in the middle of the seal.
function LogoShapes() {
  return (
    <>
      <rect width={LOGO.size} height={LOGO.size} rx={LOGO.radius} fill="#fff" />
      {LOGO.paths.map((d, i) => (
        <path key={i} d={d} fill="#0a0a0a" />
      ))}
    </>
  );
}

export function Brand({ x = 62, y = 56 }: { x?: number; y?: number }) {
  return (
    <>
      <svg className="abs" viewBox="0 0 48 48" role="img" aria-label="TenThousand" style={{ left: u(x), top: u(y), width: u(48), height: u(48) }}>
        <LogoShapes />
      </svg>
      <At x={x + 60} y={y + 25} s={17} className="word">
        TENTHOUSAND
      </At>
    </>
  );
}

export function Corners({ growing = false }: { growing?: boolean }) {
  // On a sheet that can grow taller than 816px, the bottom marks anchor to the bottom edge instead.
  const pts: [number, number][] = [[33, 33], [1021, 33], [33, 782], [1021, 782]];
  return (
    <>
      {pts.map(([x, y], i) => (
        <span
          key={i}
          className="plus"
          style={{ left: u(x), ...(growing && y > 400 ? { bottom: u(H - y) } : { top: u(y) }), fontSize: u(16) }}
        >
          +
        </span>
      ))}
    </>
  );
}

export function Decoration() {
  return (
    <svg className="deco" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      {DECO_LINES.map(([x1, y1, x2, y2, tone], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={decoColor(tone)} strokeWidth={2.4} strokeLinecap="round" />
      ))}
    </svg>
  );
}

export function Signature() {
  return (
    <svg
      className="abs"
      role="img"
      aria-label="Signature"
      viewBox="0 0 100 100"
      style={{ left: u(SIGNATURE.x), top: u(SIGNATURE.y), width: u(SIGNATURE.size), height: u(SIGNATURE.size) }}
    >
      {SIGNATURE.paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#e8e8ea" strokeWidth={SIGNATURE.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

export function Seal() {
  const g = SEAL_GEO;
  const glyphs = [...arcText(SEAL_TOP, true), ...arcText(SEAL_BOTTOM, false)];
  const ff = "Helvetica, Arial, sans-serif";
  const k = g.box / LOGO.size;
  return (
    <svg
      className="abs"
      role="img"
      aria-label="TenThousand Coding Academy verified seal"
      viewBox="0 0 200 200"
      style={{ left: u(SEAL.x), top: u(SEAL.y), width: u(SEAL.size), height: u(SEAL.size) }}
    >
      <circle cx={g.cx} cy={g.cy} r={g.rOuter} fill="#0f0f11" stroke="#c9cad0" strokeWidth={2.2} />
      <circle cx={g.cx} cy={g.cy} r={g.rBand} fill="#18181b" stroke="#55565c" strokeWidth={0.8} />
      {sealDots().map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={0.9} fill="#8d8f96" />
      ))}
      <circle cx={g.cx} cy={g.cy} r={g.rInner} fill="#0c0c0e" stroke="#c9cad0" strokeWidth={1.6} />
      <circle cx={g.cx} cy={g.cy} r={g.rInner - 4} fill="none" stroke="#3a3b40" strokeWidth={0.6} />
      <g transform={`rotate(${SEAL_ROT} ${g.cx} ${g.cy})`}>
        {glyphs.map((gl, i) => (
          <text
            key={i}
            transform={`translate(${gl.x.toFixed(2)} ${gl.y.toFixed(2)}) rotate(${gl.rot.toFixed(2)})`}
            textAnchor="middle"
            fontSize={g.fs}
            fontWeight={700}
            fill="#f2f2f4"
            fontFamily={ff}
          >
            {gl.ch}
          </text>
        ))}
        <circle cx={g.cx - g.rText} cy={g.cy} r={2.4} fill="#c9cad0" />
        <circle cx={g.cx + g.rText} cy={g.cy} r={2.4} fill="#c9cad0" />
        <g transform={`translate(${g.cx - g.box / 2} ${g.cy - g.box / 2 - 8}) scale(${k})`}>
          <LogoShapes />
        </g>
        <text x={g.cx} y={g.cy + 34} textAnchor="middle" fontSize={8} letterSpacing={2.4} fill="#b4b5bb" fontFamily="ui-monospace, Menlo, monospace">
          VERIFIED
        </text>
      </g>
    </svg>
  );
}

const css = `
.tt{--bg:${C.bg};--text:${C.text};--muted:${C.muted};--faint:${C.faint};--line:${C.line};--hair:${C.hair};
  background:var(--bg);color:#fff;font-family:var(--font-inter,Inter),Helvetica,Arial,system-ui,sans-serif;line-height:1.5;-webkit-font-smoothing:antialiased;min-height:100vh}
.tt *{box-sizing:border-box}
.tt a{color:inherit}
.tt :focus-visible{outline:2px solid #fff;outline-offset:3px}

.tt .wrap{max-width:1056px;margin:0 auto;padding:28px 16px 56px}
.tt .scroller{overflow-x:auto;margin-top:18px;border:1px solid var(--line)}
.tt .scroller + .scroller{margin-top:24px}

/* A sheet is 1056 x 816 Canva px and scales with its own width (--u = 1 Canva px). Below 760px it scrolls sideways. */
.tt .sheet{--u:calc(100cqw / 1056);position:relative;width:100%;min-width:760px;aspect-ratio:1056 / 816;background:var(--bg);overflow:hidden;container-type:inline-size}
.tt .abs{position:absolute}

.tt .plus{position:absolute;color:var(--faint);line-height:1;transform:translate(-50%,-50%);font-family:ui-monospace,Menlo,monospace}
.tt .logo{position:absolute;background:#fff;color:#0a0a0a;font-weight:800;display:flex;align-items:center;justify-content:center;letter-spacing:-.02em}
.tt .word{font-weight:700;letter-spacing:.12em;white-space:nowrap}

.tt .lab{display:inline-flex;align-items:center;white-space:nowrap;font-family:ui-monospace,"SF Mono",Menlo,Consolas,"Liberation Mono",monospace;
  font-size:calc(var(--u) * 10.5);letter-spacing:.34em;text-transform:uppercase;line-height:1}
.tt .lab i{display:inline-block;width:calc(var(--u) * 6);height:calc(var(--u) * 6);background:var(--muted);margin-right:calc(var(--u) * 8);flex:none}
.tt .lab span{margin-right:-.34em;color:var(--muted)}

.tt .muted{color:var(--muted)}
.tt .bold{font-weight:700;letter-spacing:-.01em;white-space:nowrap}
.tt .body{color:var(--text)}
.tt .hr{position:absolute;height:1px;background:var(--line)}
.tt .deco{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none}
.tt .arrow{position:absolute}

/* transcript page: grows if the module descriptions need more than one sheet of height */
.tt .sheet.t{overflow:visible;display:flex;flex-direction:column;padding:calc(var(--u) * 126) calc(var(--u) * 64) 0 calc(var(--u) * 62)}
.tt table{width:100%;border-collapse:collapse;table-layout:fixed}
.tt th{text-align:left;font-weight:400;padding:0 0 calc(var(--u) * 20)}
.tt td{vertical-align:top;padding:calc(var(--u) * 15) calc(var(--u) * 20) calc(var(--u) * 15) 0;border-top:1px solid var(--hair);font-size:calc(var(--u) * 13)}
.tt tbody tr:first-child td{border-top:none}
.tt td.topic{font-weight:700;color:#fff;line-height:1.35;padding-right:calc(var(--u) * 24)}
.tt td.desc{color:var(--muted);font-size:calc(var(--u) * 10);line-height:1.5;padding-top:calc(var(--u) * 17)}
.tt td.date{color:var(--text);white-space:nowrap}
.tt td.g{font-weight:700;color:#fff;text-align:right;padding-right:0;font-size:calc(var(--u) * 14)}
.tt th.g{text-align:right}
.tt .t-foot{margin-top:auto;border-top:1px solid var(--line);padding:calc(var(--u) * 15) 0 calc(var(--u) * 40);display:flex;justify-content:space-between;align-items:center}
.tt .t-foot .lab span{color:var(--faint)}
.tt .t-foot .lab i{background:var(--faint)}

/* status chip / buttons / error + not-found pages */
.tt .status{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:600}
.tt .status::before{content:"";width:8px;height:8px;border-radius:50%;background:currentColor}
.tt .status.ok{color:#3ddc84}.tt .status.bad{color:#ff6b5e}.tt .status.warn{color:#e8b339}
.tt .actions-row{display:flex;gap:12px;margin:18px 0 0;flex-wrap:wrap}
.tt .btn{display:inline-block;padding:12px 22px;border-radius:999px;background:#fff;color:#0a0a0a;font:inherit;font-weight:600;font-size:13px;text-decoration:none;border:0;cursor:pointer}
.tt .btn.secondary{background:transparent;color:#fff;border:1px solid var(--line)}
.tt .btn:disabled{opacity:.6;cursor:progress}
.tt .notfound-wrap,.tt .error-wrap{max-width:720px;margin:0 auto;padding:120px 24px;text-align:left}
.tt .notfound-wrap h1.name,.tt .error-wrap h1.name{font-size:2.2rem;font-weight:700;letter-spacing:-.02em;margin:18px 0 14px}
.tt .completion-line{color:var(--muted);font-size:14px;max-width:46ch;margin:0}
`;
