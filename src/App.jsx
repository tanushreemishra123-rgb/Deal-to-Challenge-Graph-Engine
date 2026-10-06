import React, { useState, useMemo, useEffect } from "react";
import { compile } from "./engine/pipeline.js";
import { analyzeGraph } from "./engine/dag.js";
import { runQualityGate } from "./engine/qualityGate.js";
import { changeImpact } from "./engine/changeImpact.js";
import { classifyNode } from "./classify/classify.js";
import { buildPackage } from "./classify/packages.js";
import { exportGraphJSON, exportPlanMarkdown } from "./engine/exporters.js";
import { CSS, C, MODEL_COLOR, MODEL_LABEL, MATURITY_COLOR, GATE_COLOR, sevColor } from "./ui/styles.js";
import GraphView from "./ui/GraphView.jsx";

const INPUTS = [
  { file: "claimsdesk-modernization.json", scenario: "Enterprise application modernization" },
  { file: "clinical-intake-and-patient-support-assistant.json", scenario: "Regulated AI-enabled healthcare solution" },
  { file: "member-experience-modernisation-early-discovery.json", scenario: "Early discovery · missing information" },
  { file: "unified-supply-chain-analytics.json", scenario: "Data, integration, analytics & forecasting" },
];
const TABS = ["Import", "Decomposition", "Graph", "Execution Plan", "Packages", "Validation & Export"];
const clone = (o) => JSON.parse(JSON.stringify(o));
const download = (name, text, type = "application/json") => {
  const blob = new Blob([text], { type }); const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
};

export default function App() {
  const [base, setBase] = useState(null);      // original compile result (immutable)
  const [work, setWork] = useState(null);       // working graph {nodes,edges,operatingModelSummary}
  const [tab, setTab] = useState(0);
  const [sel, setSel] = useState(null);
  const [lastChange, setLastChange] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const loadRaw = (raw) => {
    try {
      const r = compile(raw);
      setBase(r); setWork(clone(r.graph)); setSel(r.graph.nodes[0]?.id || null);
      setLastChange(null); setErr(null); setTab(0);
    } catch (e) { setErr(String(e)); }
  };
  const loadBundled = async (file) => {
    setLoading(true); setErr(null);
    try { const res = await fetch(`inputs/${file}`); loadRaw(await res.json()); }
    catch (e) { setErr(`Could not load ${file}: ${e}`); }
    finally { setLoading(false); }
  };
  const onUpload = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => { try { loadRaw(JSON.parse(r.result)); } catch (x) { setErr("Invalid JSON: " + x); } };
    r.readAsText(f);
  };

  // recompute analysis + quality from the working graph
  const liveAnalysis = useMemo(() => (work ? analyzeGraph(work) : null), [work]);
  const liveQuality = useMemo(() => (work && base ? runQualityGate(work, liveAnalysis, base.canonical) : null), [work, liveAnalysis, base]);
  const impact = useMemo(() => (base && work && lastChange ? changeImpact(base.graph, work, lastChange) : null), [base, work, lastChange]);

  const updateSummary = (g) => {
    const s = { flexibleTalent: 0, challenge: 0, privatePod: 0 };
    for (const n of g.nodes) { const m = n.operatingModel?.primary; if (m === "flexible-talent") s.flexibleTalent++; else if (m === "challenge") s.challenge++; else if (m === "private-pod") s.privatePod++; }
    g.operatingModelSummary = s; return g;
  };
  const overrideModel = (nodeId, model) => {
    setWork((g0) => {
      const g = clone(g0); const n = g.nodes.find((x) => x.id === nodeId); if (!n) return g0;
      const prev = n.operatingModel.primary;
      n.operatingModel = { ...n.operatingModel, primary: model, overridden: true,
        overrideHistory: [...(n.operatingModel.overrideHistory || []), { from: prev, to: model, at: new Date().toISOString(), decidedBy: "user-reviewed" }],
        rationale: [`User-reviewed override: ${MODEL_LABEL[model]} selected (was ${MODEL_LABEL[prev]}).`, ...n.operatingModel.rationale],
        confidence: "high" };
      n.provenance = "user-approved";
      return updateSummary(g);
    });
    setLastChange(nodeId);
  };
  const toggleBlocked = (nodeId) => {
    setWork((g0) => { const g = clone(g0); const n = g.nodes.find((x) => x.id === nodeId); if (!n) return g0;
      n.blocked = !n.blocked; n.readiness = n.blocked ? "blocked" : "review-required"; return g; });
    setLastChange(nodeId);
  };
  const syncDeps = (g) => {
    const inc = new Map(g.nodes.map((n) => [n.id, []]));
    for (const e of g.edges) if (inc.has(e.target)) inc.get(e.target).push(e.source);
    for (const n of g.nodes) n.dependsOn = inc.get(n.id);
    return g;
  };
  // edit arbitrary node fields (scope, category, effort, acceptance, inputs, deliverables, title)
  const editNode = (nodeId, patch) => {
    setWork((g0) => { const g = clone(g0); const n = g.nodes.find((x) => x.id === nodeId); if (!n) return g0;
      Object.assign(n, patch); if (n.provenance === "ai-recommended") n.provenance = "user-approved"; return g; });
    setLastChange(nodeId);
  };
  const approveNode = (nodeId) => {
    setWork((g0) => { const g = clone(g0); const n = g.nodes.find((x) => x.id === nodeId); if (!n) return g0;
      n.provenance = "user-approved"; n.readiness = n.blocked ? "blocked" : "ready"; return g; });
    setLastChange(nodeId);
  };
  const removeNode = (nodeId) => {
    setWork((g0) => { let g = clone(g0);
      g.nodes = g.nodes.filter((n) => n.id !== nodeId);
      g.edges = g.edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
      return updateSummary(syncDeps(g)); });
    setSel((s) => (s === nodeId ? null : s)); setLastChange(nodeId);
  };
  const splitNode = (nodeId) => {
    setWork((g0) => { const g = clone(g0); const i = g.nodes.findIndex((x) => x.id === nodeId); if (i < 0) return g0;
      const src = g.nodes[i];
      const mk = (suffix) => ({ ...clone(src), id: `${src.id}.${suffix}`, title: `${src.title} (${suffix})`,
        provenance: "user-created", effort: { ...src.effort, minimum: Math.max(1, Math.round(src.effort.minimum / 2)), maximum: Math.max(1, Math.round(src.effort.maximum / 2)) } });
      const a = mk("a"), b = mk("b");
      g.nodes.splice(i, 1, a, b);
      // rewire edges: incoming → a, outgoing → b, and a → b
      g.edges = g.edges.map((e) => e.target === nodeId ? { ...e, target: a.id } : e.source === nodeId ? { ...e, source: b.id } : e);
      g.edges.push({ id: `EDGE_${Date.now()}`, source: a.id, target: b.id, type: "split-handoff", rationale: "Second half depends on the first.", blocking: true, sourceIds: [] });
      return updateSummary(syncDeps(g)); });
    setLastChange(nodeId);
  };
  const addDependency = (fromId, toId) => {
    if (!fromId || !toId || fromId === toId) return;
    setWork((g0) => { const g = clone(g0);
      if (g.edges.some((e) => e.source === fromId && e.target === toId)) return g0;
      g.edges.push({ id: `EDGE_${Date.now()}`, source: fromId, target: toId, type: "user-dependency", rationale: "User-added dependency.", blocking: true, sourceIds: [] });
      return syncDeps(g); });
    setLastChange(toId);
  };
  const removeDependency = (fromId, toId) => {
    setWork((g0) => { const g = clone(g0);
      g.edges = g.edges.filter((e) => !(e.source === fromId && e.target === toId));
      return syncDeps(g); });
    setLastChange(toId);
  };

  const selNode = work?.nodes.find((n) => n.id === sel) || null;
  const nodeEditProps = { onEdit: editNode, onRemove: removeNode, onSplit: splitNode, onApprove: approveNode,
    onAddDep: addDependency, onRemoveDep: removeDependency, allNodes: work?.nodes || [] };

  return (
    <div className="dg">
      <style>{CSS}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />

      <div className="dg-head">
        <div className="dg-logo">⟐</div>
        <div>
          <div className="dg-title">Deal-to-Challenge Graph Engine</div>
          <div className="dg-sub">Compiles deal-scoping packages into an execution-ready, operating-model-classified DAG.</div>
        </div>
        <span className="dg-badge"><span className="dg-dot" /> Mock AI mode · offline</span>
      </div>

      <div className="dg-tabs">
        {TABS.map((t, i) => (
          <button key={t} className="dg-tab" data-on={tab === i ? 1 : 0} disabled={!base && i > 0} onClick={() => setTab(i)}>
            {t}{i === 1 && work ? <span className="n">{work.nodes.length}</span> : null}
          </button>
        ))}
      </div>

      <div className="dg-wrap">
        {err && <div className="dg-card" style={{ borderColor: C.fail, color: C.fail }}>{err}</div>}

        {/* ========== 1. IMPORT ========== */}
        {tab === 0 && (
          <ImportView base={base} loading={loading} onBundled={loadBundled} onUpload={onUpload} onNext={() => setTab(1)} />
        )}

        {/* ========== 2. DECOMPOSITION ========== */}
        {tab === 1 && work && (
          <div className="dg-split">
            <div>
              <div className="dg-card">
                <div className="dg-eyebrow">Delivery node inventory · {work.nodes.length} nodes</div>
                <table className="dg-table">
                  <thead><tr><th>ID</th><th>Title</th><th>Category</th><th>Model</th><th>Effort</th><th>Readiness</th></tr></thead>
                  <tbody>
                    {work.nodes.map((n) => (
                      <tr key={n.id} className="dg-node-row" data-on={sel === n.id} onClick={() => setSel(n.id)}
                        style={{ outline: sel === n.id ? `1px solid ${C.ft}` : "none" }}>
                        <td className="dg-mono" style={{ color: C.mut }}>{n.id}</td>
                        <td>{n.title}</td>
                        <td className="dg-mut">{n.workCategory}</td>
                        <td><ModelChip m={n.operatingModel.primary} overridden={n.operatingModel.overridden} /></td>
                        <td className="dg-mut">{n.effort.minimum}-{n.effort.maximum}</td>
                        <td><ReadyChip r={n.readiness} blocked={n.blocked} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Inspector node={selNode} canonical={base.canonical} onOverride={overrideModel} onToggleBlocked={toggleBlocked} {...nodeEditProps} />
          </div>
        )}

        {/* ========== 3. GRAPH ========== */}
        {tab === 2 && work && liveAnalysis && (
          <div className="dg-split">
            <div>
              <div className="dg-card">
                <div className="dg-legend">
                  <span><span className="dg-swatch" style={{ background: C.ft }} />Flexible Talent</span>
                  <span><span className="dg-swatch" style={{ background: C.ch }} />Challenge</span>
                  <span><span className="dg-swatch" style={{ background: C.pp }} />Private Pod</span>
                  <span style={{ color: C.fail }}>━ critical path</span>
                  <span className="dg-mut">⟂ dashed = non-blocking · ● = not-ready</span>
                  <span style={{ marginLeft: "auto" }} className="dg-mut">waves →</span>
                </div>
                <GraphView graph={work} analysis={liveAnalysis} selectedId={sel} onSelect={setSel} />
                <div className="dg-row" style={{ marginTop: 10 }}>
                  <Stat n={liveAnalysis.hasCycle ? "YES" : "none"} l="cycles" color={liveAnalysis.hasCycle ? C.fail : C.ok} />
                  <Stat n={liveAnalysis.orphans.length} l="orphans" color={liveAnalysis.orphans.length ? C.warn : C.ok} />
                  <Stat n={liveAnalysis.waveCount} l="waves" />
                  <Stat n={liveAnalysis.parallelism} l="max parallel" />
                  <Stat n={liveAnalysis.entry.length} l="entry nodes" />
                  <Stat n={liveAnalysis.terminal.length} l="terminal" />
                </div>
                {liveAnalysis.issues.length > 0 && (
                  <div className="dg-section">
                    <h5>Graph issues</h5>
                    {liveAnalysis.issues.slice(0, 8).map((i, k) => (
                      <div className="dg-issue" key={k}><span className="dg-sev" style={{ color: sevColor("warn"), borderColor: sevColor("warn") }}>{i.code}</span><span>{i.message}</span></div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <Inspector node={selNode} canonical={base.canonical} onOverride={overrideModel} onToggleBlocked={toggleBlocked} {...nodeEditProps} />
          </div>
        )}

        {/* ========== 4. EXECUTION PLAN ========== */}
        {tab === 3 && work && liveAnalysis && (
          <PlanView graph={work} analysis={liveAnalysis} maturity={base.maturity} />
        )}

        {/* ========== 5. PACKAGES ========== */}
        {tab === 4 && work && (
          <div className="dg-split">
            <div className="dg-card">
              <div className="dg-eyebrow">Model-specific execution package</div>
              {selNode ? <PackageView node={selNode} canonical={base.canonical} /> : <div className="dg-mut">Select a node.</div>}
            </div>
            <div className="dg-card dg-insp">
              <div className="dg-eyebrow">Nodes</div>
              {work.nodes.map((n) => (
                <div key={n.id} className="dg-check" style={{ cursor: "pointer" }} onClick={() => setSel(n.id)}>
                  <ModelChip m={n.operatingModel.primary} />
                  <span style={{ color: sel === n.id ? C.ink : C.mut }}>{n.id} {n.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========== 6. VALIDATION & EXPORT ========== */}
        {tab === 5 && work && liveQuality && (
          <ExportView base={base} work={work} analysis={liveAnalysis} quality={liveQuality} impact={impact}
            onExportGraph={() => download(`${base.canonical.deal.title.replace(/\W+/g, "-").toLowerCase()}.graph.json`,
              JSON.stringify(exportGraphJSON({ ...base, graph: work, analysis: liveAnalysis, qualityGate: liveQuality }), null, 2))}
            onExportPlan={() => download(`${base.canonical.deal.title.replace(/\W+/g, "-").toLowerCase()}.plan.md`,
              exportPlanMarkdown({ ...base, graph: work, analysis: liveAnalysis, qualityGate: liveQuality }), "text/markdown")} />
        )}
      </div>

      <div className="dg-foot">
        Deterministic engine for validation, waves, critical path, coverage & quality · AI-assisted (mock) decomposition & classification · every output is grounded and provenance-tagged · no paid AI required.
      </div>
    </div>
  );
}

/* ---------------- subcomponents ---------------- */
const Stat = ({ n, l, color }) => (<div className="dg-stat"><div className="n" style={{ color: color || C.ink }}>{n}</div><div className="l">{l}</div></div>);
const ModelChip = ({ m, overridden }) => (<span className="dg-chip" style={{ color: MODEL_COLOR[m] }}>{MODEL_LABEL[m]}{overridden ? " ✎" : ""}</span>);
const ReadyChip = ({ r, blocked }) => { const col = blocked ? C.fail : r === "ready" ? C.ok : r === "blocked" ? C.fail : C.warn; return <span className="dg-chip" style={{ color: col }}>{blocked ? "blocked" : r}</span>; };

function ImportView({ base, loading, onBundled, onUpload, onNext }) {
  return (
    <>
      <div className="dg-card">
        <div className="dg-eyebrow">1 · Import a deal-scoping package</div>
        <p className="dg-p">Load one of the four supplied packages directly, or upload your own export. The original package is preserved unchanged; a normalized execution model is derived alongside it.</p>
        <div className="dg-sel">
          {INPUTS.map((x) => (
            <div key={x.file} className="dg-file" onClick={() => onBundled(x.file)}>
              <div className="t">{x.file.replace(".json", "").replace(/-/g, " ")}</div>
              <div className="d">{x.scenario}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <label className="dg-btn sm" style={{ cursor: "pointer" }}>Upload JSON…<input type="file" accept="application/json,.json" style={{ display: "none" }} onChange={onUpload} /></label>
          {loading && <span className="dg-mut" style={{ marginLeft: 10 }}>Loading…</span>}
        </div>
      </div>

      {base && (
        <>
          <div className="dg-card">
            <div className="dg-eyebrow">Normalized package · {base.canonical.deal.title}</div>
            <div className="dg-kpi">
              <Stat n={base.validation.stats.totalSourceIds} l="source ids" />
              <Stat n={base.validation.stats.requirements} l="requirements" />
              <Stat n={base.validation.stats.components} l="components" />
              <Stat n={base.validation.stats.integrations} l="integrations" />
              <Stat n={base.validation.stats.aiUseCases} l="AI use cases" />
              <Stat n={base.validation.stats.gaps} l="gaps" color={C.disc} />
              <Stat n={base.validation.stats.questions} l="questions" color={C.disc} />
              <Stat n={base.canonical.delivery.confidence} l="estimate conf." />
            </div>
          </div>

          <div className="dg-row">
            <div className="dg-card" style={{ flex: "1 1 320px" }}>
              <div className="dg-eyebrow">2 · Package maturity</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span className="dg-chip" style={{ color: MATURITY_COLOR[base.maturity.maturity], fontSize: 13, padding: "4px 11px" }}>{base.maturity.maturity}</span>
                <span className="dg-mut">readiness score {base.maturity.score} (lower = more ready)</span>
              </div>
              <ul className="dg-list dg-mut">{base.maturity.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </div>
            <div className="dg-card" style={{ flex: "1 1 320px" }}>
              <div className="dg-eyebrow">3 · Blockers, gaps & open questions</div>
              {base.validation.issues.filter((i) => ["blocker", "error"].includes(i.severity)).slice(0, 8).map((i, k) => (
                <div className="dg-issue" key={k}>
                  <span className="dg-sev" style={{ color: sevColor(i.severity), borderColor: sevColor(i.severity) }}>{i.severity}</span>
                  <span>{i.message} {i.refs?.length ? <span className="dg-mono dg-mut">[{i.refs.slice(0, 3).join(", ")}]</span> : null}</span>
                </div>
              ))}
              {base.validation.stats.blockers === 0 && <div className="dg-mut">No blocking items.</div>}
            </div>
          </div>
          <div style={{ marginTop: 14 }}><button className="dg-btn primary" onClick={onNext}>Run delivery decomposition →</button></div>
        </>
      )}
    </>
  );
}

const CATS = ["discovery","ux-design","frontend","backend-api","integration","data-engineering","ai-implementation","cloud-devops","security","testing","documentation","deployment","technical-review","solution-delivery"];
function Inspector({ node, canonical, onOverride, onToggleBlocked, onEdit, onRemove, onSplit, onApprove, onAddDep, onRemoveDep, allNodes }) {
  const [edit, setEdit] = React.useState(false);
  const [depTo, setDepTo] = React.useState("");
  React.useEffect(() => setEdit(false), [node?.id]);
  if (!node) return <div className="dg-card dg-insp dg-mut">Select a node to inspect.</div>;
  const om = node.operatingModel;
  const candidates = allNodes.filter((n) => n.id !== node.id && !node.dependsOn.includes(n.id));
  return (
    <div className="dg-card dg-insp">
      <div className="dg-eyebrow" style={{ display: "flex", alignItems: "center", gap: 6 }}>
        Node · {node.id} <span className="dg-prov">{node.provenance}</span>
        <button className="dg-btn sm" style={{ marginLeft: "auto" }} onClick={() => setEdit((e) => !e)}>{edit ? "Done" : "Edit"}</button>
      </div>
      {edit ? (
        <div className="dg-section">
          <h5>Edit node</h5>
          <input className="dg-input" style={{ width: "100%", marginBottom: 6 }} value={node.title} onChange={(e) => onEdit(node.id, { title: e.target.value })} />
          <textarea className="dg-input" style={{ width: "100%", marginBottom: 6 }} rows={2} value={node.scope} onChange={(e) => onEdit(node.id, { scope: e.target.value })} />
          <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
            <select className="dg-select" value={node.workCategory} onChange={(e) => onEdit(node.id, { workCategory: e.target.value })}>
              {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input className="dg-input" type="number" style={{ width: 70 }} value={node.effort.minimum} onChange={(e) => onEdit(node.id, { effort: { ...node.effort, minimum: +e.target.value } })} />
            <input className="dg-input" type="number" style={{ width: 70 }} value={node.effort.maximum} onChange={(e) => onEdit(node.id, { effort: { ...node.effort, maximum: +e.target.value } })} />
            <span className="dg-mut dg-src" style={{ alignSelf: "center" }}>pd (min/max)</span>
          </div>
          <textarea className="dg-input" style={{ width: "100%" }} rows={3}
            value={node.acceptanceConditions.join("\n")}
            onChange={(e) => onEdit(node.id, { acceptanceConditions: e.target.value.split("\n").filter(Boolean) })}
            placeholder="One acceptance condition per line" />
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            <button className="dg-btn sm" onClick={() => onApprove(node.id)}>Approve node</button>
            <button className="dg-btn sm" onClick={() => onSplit(node.id)}>Split</button>
            <button className="dg-btn sm" style={{ borderColor: C.fail, color: C.fail }} onClick={() => onRemove(node.id)}>Remove</button>
          </div>
        </div>
      ) : (
        <>
          <div className="dg-h">{node.title}</div>
          <div className="dg-mut" style={{ marginBottom: 8 }}>{node.objective}</div>
        </>
      )}
      <div className="dg-pills">
        <span className="dg-pill">{node.workCategory}</span>
        <span className="dg-pill">{node.effort.minimum}-{node.effort.maximum} {node.effort.unit}</span>
        <ReadyChip r={node.readiness} blocked={node.blocked} />
      </div>

      <div className="dg-section">
        <h5>Operating model <ModelChip m={om.primary} overridden={om.overridden} /> · {om.confidence}</h5>
        <ul className="dg-list dg-mut">{om.rationale.map((r, i) => <li key={i}>{r}</li>)}</ul>
        {om.alternatives?.length > 0 && <div className="dg-mut dg-src">Alternatives: {om.alternatives.map((m) => MODEL_LABEL[m]).join(", ")}</div>}
        <div style={{ marginTop: 8, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <span className="dg-mut dg-src">Override:</span>
          {["flexible-talent", "challenge", "private-pod"].map((m) => (
            <button key={m} className="dg-btn sm" onClick={() => onOverride(node.id, m)}
              style={{ borderColor: om.primary === m ? MODEL_COLOR[m] : C.line, color: om.primary === m ? MODEL_COLOR[m] : C.ink }}>
              {MODEL_LABEL[m]}</button>
          ))}
          <button className="dg-btn sm" onClick={() => onToggleBlocked(node.id)}>{node.blocked ? "Unblock" : "Mark blocked"}</button>
        </div>
        {om.overrideHistory?.length > 0 && <div className="dg-note">User-reviewed override recorded ({om.overrideHistory.length}).</div>}
      </div>

      <div className="dg-section"><h5>Source evidence (traceability)</h5>
        <div className="dg-pills">{node.sourceIds.map((id) => {
          const meta = canonical.sourceIndex[id];
          return <span key={id} className="dg-pill dg-mono" title={meta?.title || ""}>{id}</span>;
        })}</div>
      </div>
      <div className="dg-section"><h5>Deliverables</h5><ul className="dg-list dg-mut">{node.deliverables.map((d, i) => <li key={i}>{d}</li>)}</ul></div>
      <div className="dg-section"><h5>Acceptance conditions</h5><ul className="dg-list dg-mut">{node.acceptanceConditions.map((d, i) => <li key={i}>{d}</li>)}</ul></div>
      <div className="dg-section"><h5>Dependencies (depends on)</h5>
        <div className="dg-pills" style={{ marginBottom: 6 }}>
          {node.dependsOn.length ? node.dependsOn.map((d) => (
            <span key={d} className="dg-pill dg-mono">{d}
              <span style={{ cursor: "pointer", color: C.fail, marginLeft: 4 }} onClick={() => onRemoveDep(d, node.id)} title="remove dependency">✕</span>
            </span>
          )) : <span className="dg-mut dg-src">none</span>}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <select className="dg-select" value={depTo} onChange={(e) => setDepTo(e.target.value)} style={{ flex: 1 }}>
            <option value="">add dependency on…</option>
            {candidates.map((n) => <option key={n.id} value={n.id}>{n.id} — {n.title.slice(0, 30)}</option>)}
          </select>
          <button className="dg-btn sm" disabled={!depTo} onClick={() => { onAddDep(depTo, node.id); setDepTo(""); }}>Add</button>
        </div>
        <div className="dg-mut dg-src" style={{ marginTop: 4 }}>Adding a dependency that forms a cycle will be flagged by the graph checks.</div>
      </div>
    </div>
  );
}

function PlanView({ graph, analysis, maturity }) {
  const om = graph.operatingModelSummary;
  return (
    <>
      <div className="dg-card">
        <div className="dg-eyebrow">Execution overview</div>
        <div className="dg-kpi">
          <Stat n={graph.nodes.length} l="nodes" />
          <Stat n={analysis.waveCount} l="waves" />
          <Stat n={`${analysis.totalEffortMin}-${analysis.totalEffortMax}`} l="effort (pd)" />
          <Stat n={analysis.criticalDuration} l="critical path (pd)" color={C.fail} />
          <Stat n={om.flexibleTalent} l="flex talent" color={C.ft} />
          <Stat n={om.challenge} l="challenge" color={C.ch} />
          <Stat n={om.privatePod} l="private pod" color={C.pp} />
        </div>
      </div>
      <div className="dg-card">
        <div className="dg-eyebrow">Execution waves · operating-model distribution</div>
        <table className="dg-table">
          <thead><tr><th>Wave</th><th>Nodes</th><th>Flex Talent</th><th>Challenge</th><th>Private Pod</th><th>Effort (pd)</th><th>Mix</th></tr></thead>
          <tbody>{analysis.waveSummary.map((w) => (
            <tr key={w.wave}><td>Wave {w.wave}</td><td>{w.nodes}</td>
              <td style={{ color: C.ft }}>{w["flexible-talent"]}</td>
              <td style={{ color: C.ch }}>{w.challenge}</td>
              <td style={{ color: C.pp }}>{w["private-pod"]}</td>
              <td className="dg-mut">{w.effortMin}-{w.effortMax}</td>
              <td style={{ width: 140 }}><div className="dg-bar">
                <span style={{ width: pct(w["flexible-talent"], w.nodes), background: C.ft }} />
                <span style={{ width: pct(w.challenge, w.nodes), background: C.ch }} />
                <span style={{ width: pct(w["private-pod"], w.nodes), background: C.pp }} />
              </div></td>
            </tr>))}</tbody>
        </table>
      </div>
      <div className="dg-card">
        <div className="dg-eyebrow">Critical path · {analysis.criticalDuration} person-days</div>
        <div className="dg-pills">{analysis.criticalPath.map((id, i) => (
          <React.Fragment key={id}><span className="dg-pill dg-mono" style={{ borderColor: C.fail, color: C.fail }}>{id}</span>{i < analysis.criticalPath.length - 1 ? <span className="dg-mut">→</span> : null}</React.Fragment>
        ))}</div>
        <div className="dg-note">The critical path is the longest dependency chain by effort — it bounds the minimum delivery duration. Earliest parallel starts are the Wave 1 nodes.</div>
      </div>
    </>
  );
}
const pct = (a, b) => `${b ? Math.round((a / b) * 100) : 0}%`;

function PackageView({ node, canonical }) {
  const pkg = buildPackage(node, canonical);
  const entries = Object.entries(pkg).filter(([k]) => !["nodeId", "kind"].includes(k));
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <ModelChip m={node.operatingModel.primary} /><div className="dg-h" style={{ margin: 0 }}>{node.title}</div>
      </div>
      <div className="dg-mut dg-src" style={{ marginBottom: 10 }}>{MODEL_LABEL[pkg.operatingModel]} package · readiness {pkg.readiness}</div>
      {entries.map(([k, v]) => (
        <div className="dg-section" key={k}>
          <h5>{camel(k)}</h5>
          {Array.isArray(v) ? (v.length ? <ul className="dg-list dg-mut">{v.map((x, i) => <li key={i}>{typeof x === "string" ? x : JSON.stringify(x)}</li>)}</ul> : <div className="dg-mut">—</div>)
            : <div className="dg-mut">{String(v)}</div>}
        </div>
      ))}
    </>
  );
}
const camel = (s) => s.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

function ExportView({ base, work, analysis, quality, impact, onExportGraph, onExportPlan }) {
  const coverage = base.canonical.quality.coveragePct;
  const allIds = new Set(work.nodes.flatMap((n) => n.sourceIds));
  return (
    <>
      <div className="dg-row">
        <div className="dg-card" style={{ flex: "1 1 320px" }}>
          <div className="dg-eyebrow">Quality gate · <span style={{ color: GATE_COLOR[quality.status] }}>{quality.status}</span></div>
          <div className="dg-mut" style={{ marginBottom: 6 }}>{quality.summary.pass} pass · {quality.summary.warn} warn · {quality.summary.fail} fail</div>
          {quality.checks.map((c) => (
            <div className="dg-check" key={c.id}>
              <span className="dg-mk" style={{ background: `${sevColor(c.status)}22`, color: sevColor(c.status), border: `1px solid ${sevColor(c.status)}66` }}>
                {c.status === "pass" ? "✓" : c.status === "warn" ? "!" : "✕"}</span>
              <span><b>{c.label}</b> <span className="dg-mut">— {c.detail}</span></span>
            </div>
          ))}
        </div>
        <div className="dg-card" style={{ flex: "1 1 280px" }}>
          <div className="dg-eyebrow">Traceability & coverage</div>
          <div className="dg-kpi">
            <Stat n={`${coverage}%`} l="requirement coverage" />
            <Stat n={allIds.size} l="source ids traced" />
            <Stat n={work.nodes.filter((n) => n.readiness !== "ready" || n.blocked).length} l="not ready" color={C.warn} />
            <Stat n={work.nodes.filter((n) => n.operatingModel.overridden).length} l="user overrides" color={C.pp} />
          </div>
          <div className="dg-section">
            <h5>Export</h5>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="dg-btn primary" onClick={onExportGraph}>Export graph JSON</button>
              <button className="dg-btn" onClick={onExportPlan}>Export execution plan</button>
            </div>
            <div className="dg-note">Exports preserve node ids, source ids, dependencies, operating-model classifications + rationale, waves, critical path, quality findings, and readiness. Not-ready nodes are flagged for handoff.</div>
          </div>
        </div>
      </div>

      {impact && (
        <div className="dg-card">
          <div className="dg-eyebrow">Change impact · last edit to {impact.changedNodeId}</div>
          <div className="dg-kpi">
            <Stat n={impact.affectedNodes.length} l="affected" color={C.warn} />
            <Stat n={impact.unaffectedNodes.length} l="preserved" color={C.ok} />
            <Stat n={impact.downstreamDependents.length} l="downstream" />
            <Stat n={impact.modelChanges.length} l="model changes" color={C.pp} />
            <Stat n={impact.criticalPathChanged ? "yes" : "no"} l="crit-path changed" color={impact.criticalPathChanged ? C.fail : C.ok} />
            <Stat n={impact.waveChanged ? "yes" : "no"} l="waves changed" color={impact.waveChanged ? C.warn : C.ok} />
          </div>
          {impact.invalidatedPackages.length > 0 && (
            <div className="dg-section"><h5>Execution packages to regenerate</h5>
              <div className="dg-pills">{impact.invalidatedPackages.map((id) => <span key={id} className="dg-pill dg-mono">{id}</span>)}</div></div>
          )}
          <div className="dg-note">Unaffected nodes and their packages are preserved. Only the changed node and its downstream dependents are flagged for regeneration.</div>
        </div>
      )}
    </>
  );
}
