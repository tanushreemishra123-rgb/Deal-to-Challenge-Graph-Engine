// ============================================================================
// runQualityGate(graph, analysis, canonical) → { status, checks[], summary }
//
// Deterministic graph-quality validation before operational handoff.
// status ∈ { ready, review-required, blocked }.
// ============================================================================
import { OPERATING_MODELS } from "../model/canonical.js";

export function runQualityGate(graph, analysis, canonical) {
  const nodes = graph.nodes, edges = graph.edges;
  const checks = [];
  const add = (id, label, status, detail, refs = []) => checks.push({ id, label, status, detail, refs });

  // 1. source coverage — every executable node grounded in imported ids
  const ungrounded = nodes.filter((n) => !n.sourceIds || n.sourceIds.length === 0);
  add("source-coverage", "Source coverage", ungrounded.length ? "fail" : "pass",
    ungrounded.length ? `${ungrounded.length} node(s) are not grounded in imported ids` : "Every node is grounded in imported source ids",
    ungrounded.map((n) => n.id));

  // 2. unsupported references — node source ids exist in the imported package
  const known = new Set(Object.keys(canonical.sourceIndex));
  const badRefs = nodes.filter((n) => n.sourceIds.some((s) => !known.has(s)));
  add("supported-refs", "Grounding references valid", badRefs.length ? "fail" : "pass",
    badRefs.length ? `${badRefs.length} node(s) reference unknown ids` : "All node references resolve to imported ids",
    badRefs.map((n) => n.id));

  // 3. operating-model completeness
  const noModel = nodes.filter((n) => !n.operatingModel || !OPERATING_MODELS.includes(n.operatingModel.primary));
  add("model-complete", "Operating-model completeness", noModel.length ? "fail" : "pass",
    noModel.length ? `${noModel.length} node(s) lack a valid operating model` : "Every node has exactly one valid operating model",
    noModel.map((n) => n.id));

  // 4. classification rationale present
  const noRationale = nodes.filter((n) => !(n.operatingModel?.rationale?.length));
  add("model-rationale", "Classification rationale", noRationale.length ? "fail" : "pass",
    noRationale.length ? `${noRationale.length} node(s) missing rationale` : "Every classification has an explainable rationale",
    noRationale.map((n) => n.id));

  // 5. missing inputs / acceptance conditions
  const noAcceptance = nodes.filter((n) => !(n.acceptanceConditions?.length));
  add("acceptance", "Acceptance conditions", noAcceptance.length ? "warn" : "pass",
    noAcceptance.length ? `${noAcceptance.length} node(s) missing acceptance conditions` : "Every node has acceptance conditions",
    noAcceptance.map((n) => n.id));

  // 6. duplicate / overlapping scope (same source-id set + same category)
  const sig = new Map();
  const dups = [];
  for (const n of nodes) {
    const key = `${n.workCategory}:${[...n.sourceIds].sort().join(",")}`;
    if (n.sourceIds.length && sig.has(key)) dups.push(n.id); else sig.set(key, n.id);
  }
  add("overlap", "No duplicate/overlapping scope", dups.length ? "warn" : "pass",
    dups.length ? `${dups.length} node(s) overlap in scope` : "No overlapping node scope detected", dups);

  // 7. cycles
  add("acyclic", "Graph is acyclic", analysis.hasCycle ? "fail" : "pass",
    analysis.hasCycle ? `Graph contains ${analysis.cycles.length} cycle(s)` : "No cycles", analysis.hasCycle ? analysis.cycles[0] : []);

  // 8. orphans
  add("no-orphans", "No orphan nodes", analysis.orphans.length ? "warn" : "pass",
    analysis.orphans.length ? `${analysis.orphans.length} orphan node(s)` : "No orphan nodes", analysis.orphans);

  // 9. invalid dependencies
  const invalid = analysis.issues.filter((i) => ["invalid-edge", "self-dependency", "duplicate-edge"].includes(i.code));
  add("valid-edges", "Dependencies valid", invalid.length ? "fail" : "pass",
    invalid.length ? `${invalid.length} invalid dependency edge(s)` : "All dependencies are valid", []);

  // 10. model-to-work sanity (regulated/restricted work should not be a Challenge)
  const mismatch = nodes.filter((n) =>
    n.operatingModel?.primary === "challenge" &&
    (n.workCategory === "security" || /restricted|regulated|phi/i.test(n.scope || "")));
  add("model-fit", "Model-to-work fit", mismatch.length ? "warn" : "pass",
    mismatch.length ? `${mismatch.length} sensitive node(s) classified as Challenge — review` : "Operating models fit the work", mismatch.map((n) => n.id));

  // 11. blocked / review-required nodes (not ready for handoff)
  const notReady = nodes.filter((n) => n.readiness !== "ready" || n.blocked);
  add("node-readiness", "Node readiness", notReady.length ? "warn" : "pass",
    notReady.length ? `${notReady.length} node(s) are blocked or review-required` : "All nodes are ready", notReady.map((n) => n.id));

  // 12. critical-path completeness
  add("critical-path", "Critical path present", analysis.criticalPath.length ? "pass" : "warn",
    analysis.criticalPath.length ? `Critical path spans ${analysis.criticalPath.length} node(s), ${analysis.criticalDuration} person-days` : "No critical path computed", analysis.criticalPath);

  // ---- overall status ----
  const anyFail = checks.some((c) => c.status === "fail");
  const anyWarn = checks.some((c) => c.status === "warn");
  const status = anyFail ? "blocked" : anyWarn ? "review-required" : "ready";

  const summary = {
    status,
    pass: checks.filter((c) => c.status === "pass").length,
    warn: checks.filter((c) => c.status === "warn").length,
    fail: checks.filter((c) => c.status === "fail").length,
  };
  return { status, checks, summary };
}
