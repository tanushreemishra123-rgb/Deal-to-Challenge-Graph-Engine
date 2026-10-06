// Design tokens + global stylesheet. Dark, professional "compiler console" look.
export const C = {
  bg: "#0d1117", bg2: "#0a0e14", panel: "#151b24", panel2: "#1b2330", line: "#273040", line2: "#374357",
  ink: "#e6edf7", mut: "#8b98ad", mut2: "#5f6b80",
  // operating models
  ft: "#4cc4f0",    // flexible-talent (sky)
  ch: "#f0b34c",    // challenge (amber)
  pp: "#a78bfa",    // private-pod (violet)
  // status
  ok: "#3fb950", warn: "#d29922", fail: "#f85149", crit: "#ff7b72", disc: "#58a6ff",
};

export const MODEL_COLOR = { "flexible-talent": C.ft, "challenge": C.ch, "private-pod": C.pp };
export const MODEL_LABEL = { "flexible-talent": "Flexible Talent", "challenge": "Challenge", "private-pod": "Private Pod" };
export const MATURITY_COLOR = {
  "execution-candidate": C.ok, "review-required": C.warn, "discovery-required": C.disc, "blocked": C.fail,
};
export const GATE_COLOR = { ready: C.ok, "review-required": C.warn, blocked: C.fail };

export const CSS = `
* { box-sizing: border-box; }
.dg {
  --bg:${C.bg}; --panel:${C.panel}; --panel2:${C.panel2}; --line:${C.line}; --ink:${C.ink}; --mut:${C.mut};
  background:${C.bg}; color:var(--ink); min-height:100vh;
  font-family:"Inter",ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif; font-size:14px; line-height:1.5;
}
.dg-mono { font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace; }
.dg-head { display:flex; align-items:center; gap:14px; padding:14px 20px; border-bottom:1px solid var(--line); background:${C.bg2}; position:sticky; top:0; z-index:20; flex-wrap:wrap; }
.dg-logo { width:34px; height:34px; border-radius:9px; background:linear-gradient(135deg,${C.pp},${C.ft}); display:grid; place-items:center; color:#0a0e14; font-weight:800; }
.dg-title { font-size:16px; font-weight:700; }
.dg-sub { font-size:12px; color:var(--mut); }
.dg-badge { margin-left:auto; font-size:12px; color:${C.ok}; border:1px solid ${C.line2}; padding:5px 10px; border-radius:999px; display:inline-flex; gap:6px; align-items:center; }
.dg-dot { width:7px;height:7px;border-radius:50%;background:currentColor;box-shadow:0 0 7px currentColor; }
.dg-tabs { display:flex; gap:4px; padding:0 16px; border-bottom:1px solid var(--line); background:${C.bg2}; overflow-x:auto; }
.dg-tab { border:none; background:none; color:var(--mut); padding:12px 14px; font-size:13px; cursor:pointer; border-bottom:2px solid transparent; white-space:nowrap; font-family:inherit; display:flex; gap:8px; align-items:center; }
.dg-tab:hover { color:var(--ink); }
.dg-tab[data-on="1"] { color:var(--ink); border-bottom-color:${C.ft}; }
.dg-tab .n { font-size:10px; background:var(--panel2); border:1px solid var(--line); border-radius:999px; padding:1px 7px; color:var(--mut); }
.dg-tab:disabled { opacity:.4; cursor:default; }
.dg-wrap { padding:18px 20px; max-width:1400px; margin:0 auto; }
.dg-row { display:flex; gap:16px; align-items:flex-start; flex-wrap:wrap; }
.dg-card { background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:16px; }
.dg-card + .dg-card { margin-top:14px; }
.dg-eyebrow { font-size:11px; letter-spacing:.07em; text-transform:uppercase; color:var(--mut); margin-bottom:10px; }
.dg-h { font-size:15px; font-weight:650; margin:0 0 8px; }
.dg-p { color:#c2ccdb; margin:0 0 8px; }
.dg-mut { color:var(--mut); font-size:13px; }
.dg-btn { border:1px solid var(--line2); background:var(--panel2); color:var(--ink); border-radius:9px; padding:9px 14px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; transition:.12s; }
.dg-btn:hover { border-color:${C.ft}; }
.dg-btn.primary { background:linear-gradient(135deg,${C.ft},#2b9fd4); color:#04121a; border:none; }
.dg-btn.primary:hover { filter:brightness(1.07); }
.dg-btn:disabled { opacity:.45; cursor:default; }
.dg-btn.sm { padding:5px 10px; font-size:12px; }
.dg-pills { display:flex; gap:8px; flex-wrap:wrap; }
.dg-pill { font-size:11px; border:1px solid var(--line2); border-radius:999px; padding:3px 9px; color:var(--mut); display:inline-flex; gap:6px; align-items:center; }
.dg-sel { display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:10px; }
.dg-file { border:1px solid var(--line); background:var(--panel2); border-radius:10px; padding:12px 13px; cursor:pointer; transition:.12s; }
.dg-file:hover { border-color:${C.ft}; transform:translateY(-1px); }
.dg-file .t { font-weight:650; font-size:13.5px; }
.dg-file .d { font-size:11.5px; color:var(--mut); margin-top:3px; }
.dg-kpi { display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:10px; }
.dg-stat { background:${C.bg2}; border:1px solid var(--line); border-radius:10px; padding:11px 12px; }
.dg-stat .n { font-size:18px; font-weight:700; } .dg-stat .l { font-size:10.5px; color:var(--mut); text-transform:uppercase; letter-spacing:.04em; }
.dg-chip { font-size:10.5px; font-weight:700; padding:2px 8px; border-radius:6px; border:1px solid currentColor; text-transform:capitalize; }
.dg-issue { display:flex; gap:9px; align-items:flex-start; font-size:13px; padding:7px 0; border-top:1px solid var(--line); }
.dg-sev { font-size:10px; font-weight:700; padding:2px 7px; border-radius:5px; flex:none; text-transform:uppercase; }
.dg-table { width:100%; border-collapse:collapse; font-size:13px; }
.dg-table th { text-align:left; color:var(--mut); font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:.04em; padding:8px 10px; border-bottom:1px solid var(--line); }
.dg-table td { padding:9px 10px; border-bottom:1px solid var(--line); vertical-align:top; }
.dg-table tr:hover td { background:${C.bg2}; }
.dg-node-row { cursor:pointer; }
.dg-left { width:56px; flex:none; } 
.dg-split { display:grid; grid-template-columns:1fr 360px; gap:16px; align-items:start; }
@media (max-width:1000px){ .dg-split { grid-template-columns:1fr; } }
.dg-insp { position:sticky; top:120px; }
.dg-section { margin-top:12px; }
.dg-section h5 { font-size:11px; text-transform:uppercase; letter-spacing:.05em; color:var(--mut); margin:0 0 5px; }
.dg-list { margin:0; padding-left:18px; } .dg-list li { margin:2px 0; }
.dg-src { font-size:11px; }
.dg-graph-wrap { border:1px solid var(--line); border-radius:12px; background:${C.bg2}; overflow:auto; max-height:620px; }
.dg-legend { display:flex; gap:14px; flex-wrap:wrap; font-size:12px; color:var(--mut); margin-bottom:10px; align-items:center; }
.dg-legend b { color:var(--ink); }
.dg-swatch { width:11px; height:11px; border-radius:3px; display:inline-block; margin-right:5px; vertical-align:middle; }
.dg-sketch { fill:var(--panel); stroke:var(--line2); cursor:pointer; }
.dg-check { display:flex; align-items:center; gap:10px; font-size:13px; padding:8px 0; border-top:1px solid var(--line); }
.dg-mk { width:18px;height:18px;border-radius:5px;display:grid;place-items:center;font-size:11px;font-weight:700;flex:none; }
.dg-select, .dg-input { background:var(--bg); color:var(--ink); border:1px solid var(--line2); border-radius:8px; padding:7px 9px; font-size:13px; font-family:inherit; }
.dg-note { background:#10243a; border:1px solid ${C.disc}55; color:#bcd; border-radius:9px; padding:9px 11px; font-size:12.5px; margin-top:8px; }
.dg-foot { color:${C.mut2}; font-size:11.5px; text-align:center; padding:20px; }
.dg-prov { font-size:10px; padding:1px 6px; border-radius:4px; background:var(--panel2); border:1px solid var(--line); color:var(--mut); }
.dg-bar { height:7px; border-radius:4px; background:var(--panel2); overflow:hidden; display:flex; }
`;

export const fmt = (v) => (v == null ? "—" : typeof v === "string" ? v : JSON.stringify(v, null, 2));
export const sevColor = (s) => ({ error: C.fail, blocker: C.crit, warning: C.warn, info: C.mut, pass: C.ok, fail: C.fail, warn: C.warn }[s] || C.mut);
