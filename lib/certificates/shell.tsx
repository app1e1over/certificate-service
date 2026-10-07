// Scoped under .tt so it never leaks into, or depends on, a host site's CSS.
export function CertShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="tt">
      <style>{css}</style>
      {children}
    </div>
  );
}

const css = `
.tt{--bg:#0a0a0a;--panel:#0a0a0a;--text:#f4f4f5;--muted:#9a9ca5;--faint:#6b6d75;--line:#2a2a2e;--accent:#ffffff;
  background:var(--bg);color:var(--text);font-family:var(--font-inter),system-ui,sans-serif;line-height:1.55;-webkit-font-smoothing:antialiased}
.tt *{box-sizing:border-box}
.tt a{color:inherit}
.tt :focus-visible{outline:2px solid #fff;outline-offset:3px}

.tt .page{position:relative;max-width:980px;margin:0 auto;padding:56px 48px;border-left:1px solid var(--line);border-right:1px solid var(--line)}
.tt .page + .page{border-top:1px solid var(--line)}
.tt .page::before,.tt .page::after,.tt .corner-b::before,.tt .corner-b::after{content:"+";position:absolute;color:var(--faint);font-size:14px;line-height:1}
.tt .page::before{top:14px;left:14px}
.tt .page::after{top:14px;right:14px}
.tt .corner-b{position:relative}
.tt .corner-b::before{bottom:-28px;left:-34px;top:auto}
.tt .corner-b::after{bottom:-28px;right:-34px;top:auto}

.tt .label{display:flex;align-items:center;gap:6px;color:var(--muted);font-size:11px;letter-spacing:.18em;text-transform:uppercase}
.tt .label::before{content:"";width:6px;height:6px;background:var(--muted)}
.tt .top-row{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:56px}
.tt .brand{display:flex;align-items:center;gap:12px}
.tt .brand .mark{width:34px;height:34px;background:#fff;color:#0a0a0a;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;border-radius:3px}
.tt .brand .word{font-weight:700;letter-spacing:.08em;font-size:15px}
.tt .top-right{text-align:right}
.tt .top-right .sub{color:var(--muted);font-size:13px;margin-top:4px}

.tt .intro{color:var(--muted);font-size:14px;margin:0 0 6px}
.tt h1.name{font-size:2.4rem;font-weight:700;letter-spacing:-.02em;margin:0 0 14px}
.tt .completion-line{color:var(--muted);font-size:14px;max-width:46ch;margin:0 0 28px}
.tt .arrow{color:var(--faint);margin:8px 0}
.tt h2.track{font-size:1.6rem;font-weight:700;margin:0 0 44px}

.tt .score-block{text-align:right}
.tt .score-block .num{font-size:2.6rem;font-weight:700;letter-spacing:-.02em}

.tt .two-col{display:grid;grid-template-columns:1fr 1fr;gap:40px;padding-top:28px;border-top:1px solid var(--line);margin-top:8px}
.tt .two-col h3{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:0 0 10px}
.tt .two-col p{font-size:13px;color:#d4d4d8;margin:0;max-width:46ch}

.tt .sign-row{display:flex;justify-content:space-between;align-items:flex-end;margin-top:56px;padding-top:28px;border-top:1px solid var(--line)}
.tt .signature{font-family:"Brush Script MT",cursive;font-size:1.6rem}
.tt .signer-name{font-weight:700;font-size:13px;margin-top:4px}
.tt .signer-title{color:var(--muted);font-size:12px}
.tt .issued .num{font-weight:700;font-size:14px;margin-top:2px}
.tt .verify{text-align:right}
.tt .verify .code{font-weight:700;font-size:14px;margin-top:2px}
.tt .verify img{margin-top:10px;width:84px;height:84px;background:#fff;padding:4px}
.tt .verify .host{color:var(--faint);font-size:10px;margin-top:4px}

.tt .fineprint{margin-top:28px;color:var(--faint);font-size:10.5px;max-width:70ch}

.tt .t-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px}
.tt .t-head .who{text-align:right}
.tt .t-head .who .name{font-weight:700;font-size:13px}
.tt .t-head .who .track{color:var(--muted);font-size:12px}

.tt table{width:100%;border-collapse:collapse}
.tt thead th{text-align:left;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);font-weight:500;padding:0 16px 10px 0;border-bottom:1px solid var(--line)}
.tt tbody td{padding:18px 16px 18px 0;border-bottom:1px solid var(--line);vertical-align:top;font-size:13px}
.tt tbody tr:last-child td{border-bottom:none}
.tt td.topic{font-weight:700;max-width:220px}
.tt td.desc{color:var(--muted);max-width:420px}
.tt td.date,.tt td.grade{white-space:nowrap}
.tt td.grade{font-weight:700;text-align:right}
.tt .t-foot{display:flex;justify-content:space-between;color:var(--faint);font-size:10.5px;margin-top:24px}

.tt .status{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:600;margin-bottom:18px}
.tt .status::before{content:"";width:8px;height:8px;border-radius:50%;background:currentColor}
.tt .status.ok{color:#3ddc84}.tt .status.bad{color:#ff6b5e}.tt .status.warn{color:#e8b339}

.tt .actions-row{display:flex;gap:12px;margin:28px 0 0;flex-wrap:wrap}
.tt .btn{display:inline-block;padding:12px 22px;border-radius:999px;background:#fff;color:#0a0a0a;font:inherit;font-weight:600;font-size:13px;text-decoration:none;border:0;cursor:pointer}
.tt .btn.secondary{background:transparent;color:#fff;border:1px solid var(--line)}
.tt .btn:disabled{opacity:.6;cursor:progress}

.tt .notfound-wrap,.tt .error-wrap{max-width:720px;margin:0 auto;padding:120px 24px;text-align:left}

@media (max-width:760px){
  .tt .page{padding:40px 22px}
  .tt .top-row{flex-direction:column;gap:20px}
  .tt .two-col{grid-template-columns:1fr}
  .tt .sign-row{flex-direction:column;align-items:flex-start;gap:24px}
  .tt .verify{text-align:left}
  .tt td.desc{display:none}
  .tt thead th:nth-child(2){display:none}
}
`;
