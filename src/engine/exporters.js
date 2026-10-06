// Exporters. Machine-readable graph JSON (source-traceable) and a
// human-readable execution plan. Both preserve node ids, source ids,
// dependencies, operating-model classifications + rationale, waves, critical
// path, quality findings, and readiness labels.
import { buildPackage } from "../classify/packages.js";

export function exportGraphJSON({ graph, analysis, maturity, qualityGate, canonical }) {
  return {
    schemaVersion: "1.0",
    exportedAt: new Date().toISOString(),
    deal: { id: canonical.deal.id, title: canonical.deal.title, maturity: maturity.maturity },
    graphId: graph.graphId,
    operatingModelSummary: graph.operatingModelSummary,
    execution: {
      waves: analysis.waves,
      waveSummary: analysis.waveSummary,
      criticalPath: analysis.criticalPath,
      criticalDuration: analysis.criticalDuration,
      totalEffort: { minimum: analysis.totalEffortMin, maximum: analysis.totalEffortMax, unit: "person-days" },
      parallelism: analysis.parallelism,
    },
    qualityGate: { status: qualityGate.status, summary: qualityGate.summary, checks: qualityGate.checks },
    nodes: graph.nodes.map((n) => ({
      id: n.id, title: n.title, objective: n.objective, workCategory: n.workCategory,
      scope: n.scope, sourceIds: n.sourceIds, inputs: n.inputs, deliverables: n.deliverables,
      acceptanceConditions: n.acceptanceConditions, dependsOn: n.dependsOn, effort: n.effort,
      operatingModel: n.operatingModel, provenance: n.provenance, readiness: n.readiness, blocked: n.blocked,
      executionPackage: buildPackage(n, canonical),
    })),
    edges: graph.edges.map((e) => ({
      id: e.id, source: e.source, target: e.target, type: e.type, rationale: e.rationale, blocking: e.blocking,
    })),
    notReadyForHandoff: graph.nodes.filter((n) => n.readiness !== "ready" || n.blocked).map((n) => n.id),
  };
}

export function exportPlanMarkdown({ graph, analysis, maturity, qualityGate, canonical }) {
  const L = [];
  L.push(`# Execution Plan — ${canonical.deal.title}`, "");
  L.push(`- **Deal id:** ${canonical.deal.id}`);
  L.push(`- **Package maturity:** ${maturity.maturity} (score ${maturity.score})`);
  L.push(`- **Quality gate:** ${qualityGate.status} (${qualityGate.summary.pass} pass / ${qualityGate.summary.warn} warn / ${qualityGate.summary.fail} fail)`);
  L.push(`- **Nodes:** ${graph.nodes.length} · **Edges:** ${graph.edges.length} · **Effort:** ${analysis.totalEffortMin}–${analysis.totalEffortMax} person-days`);
  L.push(`- **Operating models:** Flexible Talent ${graph.operatingModelSummary.flexibleTalent} · Challenge ${graph.operatingModelSummary.challenge} · Private Pod ${graph.operatingModelSummary.privatePod}`);
  L.push("");
  L.push(`## Maturity reasoning`, ...maturity.reasons.map((r) => `- ${r}`), "");
  L.push(`## Execution waves`);
  analysis.waveSummary.forEach((w) => L.push(`- **Wave ${w.wave}** — ${w.nodes} node(s); FT ${w["flexible-talent"]} / CH ${w.challenge} / PP ${w["private-pod"]}; ${w.effortMin}–${w.effortMax} pd`));
  L.push("");
  L.push(`## Critical path (${analysis.criticalDuration} person-days)`, analysis.criticalPath.map((id) => title(graph, id)).join(" → "), "");
  L.push(`## Nodes`);
  for (const n of graph.nodes) {
    L.push(`### ${n.id} — ${n.title}  \`${n.operatingModel.primary}\` (${n.operatingModel.confidence})`);
    L.push(`- **Category:** ${n.workCategory} · **Readiness:** ${n.readiness} · **Effort:** ${n.effort.minimum}–${n.effort.maximum} ${n.effort.unit}`);
    L.push(`- **Grounded in:** ${n.sourceIds.join(", ") || "—"}`);
    L.push(`- **Why this model:** ${n.operatingModel.rationale.join(" ")}`);
    if (n.operatingModel.alternatives.length) L.push(`- **Alternatives:** ${n.operatingModel.alternatives.join(", ")}`);
    if (n.dependsOn.length) L.push(`- **Depends on:** ${n.dependsOn.join(", ")}`);
    L.push("");
  }
  L.push(`## Not ready for operational handoff`);
  const nr = graph.nodes.filter((n) => n.readiness !== "ready" || n.blocked);
  L.push(nr.length ? nr.map((n) => `- ${n.id} (${n.readiness})`).join("\n") : "- None — all nodes ready.");
  return L.join("\n");
}

const title = (g, id) => { const n = g.nodes.find((x) => x.id === id); return n ? `${id}` : id; };
