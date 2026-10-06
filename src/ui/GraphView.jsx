import React from "react";
import { MODEL_COLOR, C } from "./styles.js";

// Lay nodes out by execution wave: x = wave column, y = stacked within wave.
function layout(graph, analysis) {
  const COL = 230, ROW = 96, PADX = 40, PADY = 36, W = 188, H = 58;
  const waveOf = new Map();
  analysis.waves.forEach((w, i) => w.forEach((id) => waveOf.set(id, i)));
  const rowIn = new Map();
  const pos = {};
  for (const n of graph.nodes) {
    const col = waveOf.get(n.id) ?? 0;
    const row = rowIn.get(col) || 0; rowIn.set(col, row + 1);
    pos[n.id] = { x: PADX + col * COL, y: PADY + row * ROW, w: W, h: H, col, row };
  }
  const width = PADX * 2 + (analysis.waveCount || 1) * COL;
  const maxRows = Math.max(1, ...[...rowIn.values()]);
  const height = PADY * 2 + maxRows * ROW;
  return { pos, width, height, W, H };
}

export default function GraphView({ graph, analysis, selectedId, onSelect }) {
  const { pos, width, height, W, H } = layout(graph, analysis);
  const crit = new Set(analysis.criticalPath);
  const critEdge = (s, t) => crit.has(s) && crit.has(t) &&
    analysis.criticalPath.indexOf(t) === analysis.criticalPath.indexOf(s) + 1;

  return (
    <div className="dg-graph-wrap">
      <svg width={Math.max(width, 600)} height={Math.max(height, 240)} style={{ display: "block", minWidth: "100%" }}>
        <defs>
          <marker id="dg-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0 0 L7 4 L0 8 z" fill={C.mut} />
          </marker>
          <marker id="dg-arrow-crit" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
            <path d="M0 0 L8 4.5 L0 9 z" fill={C.fail} />
          </marker>
        </defs>

        {/* edges */}
        {graph.edges.map((e) => {
          const a = pos[e.source], b = pos[e.target];
          if (!a || !b) return null;
          const x1 = a.x + W, y1 = a.y + H / 2, x2 = b.x, y2 = b.y + H / 2;
          const mx = (x1 + x2) / 2;
          const isCrit = critEdge(e.source, e.target);
          return (
            <path key={e.id} d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
              fill="none" stroke={isCrit ? C.fail : e.blocking ? C.line2 : C.line}
              strokeWidth={isCrit ? 2.2 : 1.3} strokeDasharray={e.blocking ? "0" : "4 3"}
              markerEnd={isCrit ? "url(#dg-arrow-crit)" : "url(#dg-arrow)"} opacity={isCrit ? 0.95 : 0.6} />
          );
        })}

        {/* nodes */}
        {graph.nodes.map((n) => {
          const p = pos[n.id]; if (!p) return null;
          const col = MODEL_COLOR[n.operatingModel?.primary] || C.mut;
          const onCrit = crit.has(n.id);
          const sel = selectedId === n.id;
          const notReady = n.readiness !== "ready" || n.blocked;
          return (
            <g key={n.id} transform={`translate(${p.x},${p.y})`} onClick={() => onSelect(n.id)} style={{ cursor: "pointer" }}>
              <rect width={W} height={H} rx="9" fill={C.panel}
                stroke={sel ? C.ink : onCrit ? C.fail : col} strokeWidth={sel ? 2.4 : onCrit ? 2 : 1.4} />
              <rect width="4" height={H} rx="2" fill={col} />
              <text x="12" y="20" fontSize="11" fontWeight="700" fill={col}>{n.id}</text>
              <text x="12" y="37" fontSize="11" fill={C.ink}>{clip(n.title, 24)}</text>
              <text x="12" y="51" fontSize="9.5" fill={C.mut}>{n.workCategory} · {n.effort.minimum}-{n.effort.maximum}pd</text>
              {notReady && <circle cx={W - 12} cy="13" r="4.5" fill={n.blocked ? C.fail : C.warn} />}
              {onCrit && <text x={W - 10} y={H - 8} fontSize="9" fill={C.fail} textAnchor="end">critical</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
const clip = (s, n) => (s && s.length > n ? s.slice(0, n - 1) + "…" : s || "");
