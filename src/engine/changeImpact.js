// ============================================================================
// changeImpact(before, after, changedNodeId) → impact report
//
// Compares two graph snapshots (same ids) and reports what a change affected,
// so reviewers can see blast radius before accepting. Unaffected nodes are
// preserved; only downstream dependents are flagged as needing regeneration.
// ============================================================================
import { analyzeGraph } from "./dag.js";

export function changeImpact(before, after, changedNodeId) {
  const bById = new Map(before.nodes.map((n) => [n.id, n]));
  const aById = new Map(after.nodes.map((n) => [n.id, n]));

  // downstream dependents of the changed node (its execution packages may be invalidated)
  const out = new Map(after.nodes.map((n) => [n.id, []]));
  for (const e of after.edges) if (out.has(e.source)) out.get(e.source).push(e.target);
  const downstream = new Set();
  const walk = (id) => { for (const v of out.get(id) || []) if (!downstream.has(v)) { downstream.add(v); walk(v); } };
  if (changedNodeId) walk(changedNodeId);

  // per-node diff
  const changed = [], modelChanges = [], newlyBlocked = [], newlyReady = [];
  for (const [id, a] of aById) {
    const b = bById.get(id);
    if (!b) { changed.push({ id, change: "added" }); continue; }
    if (b.operatingModel?.primary !== a.operatingModel?.primary)
      modelChanges.push({ id, from: b.operatingModel?.primary, to: a.operatingModel?.primary });
    if (b.readiness !== a.readiness) {
      if (a.readiness === "blocked" || (a.readiness !== "ready" && b.readiness === "ready")) newlyBlocked.push(id);
      if (a.readiness === "ready" && b.readiness !== "ready") newlyReady.push(id);
    }
    if (JSON.stringify(nodeFingerprint(b)) !== JSON.stringify(nodeFingerprint(a))) changed.push({ id, change: "modified" });
  }
  const removed = [...bById.keys()].filter((id) => !aById.has(id)).map((id) => ({ id, change: "removed" }));

  // graph-level recompute
  const an1 = analyzeGraph(before), an2 = analyzeGraph(after);
  const waveChanged = an1.waveCount !== an2.waveCount ||
    JSON.stringify(an1.waves) !== JSON.stringify(an2.waves);
  const criticalPathChanged = JSON.stringify(an1.criticalPath) !== JSON.stringify(an2.criticalPath);
  const effortDelta = { min: an2.totalEffortMin - an1.totalEffortMin, max: an2.totalEffortMax - an1.totalEffortMax };

  // invalidated execution packages = changed node + all downstream
  const invalidatedPackages = [...new Set([changedNodeId, ...downstream, ...changed.map((c) => c.id)].filter(Boolean))];
  const affected = new Set(invalidatedPackages);
  const unaffected = after.nodes.map((n) => n.id).filter((id) => !affected.has(id));

  return {
    changedNodeId,
    affectedNodes: [...affected],
    unaffectedNodes: unaffected,
    downstreamDependents: [...downstream],
    addedNodes: changed.filter((c) => c.change === "added").map((c) => c.id),
    modifiedNodes: changed.filter((c) => c.change === "modified").map((c) => c.id),
    removedNodes: removed.map((c) => c.id),
    modelChanges,
    newlyBlocked, newlyReady,
    invalidatedPackages,
    waveChanged, criticalPathChanged,
    criticalPathBefore: an1.criticalPath, criticalPathAfter: an2.criticalPath,
    effortDelta,
  };
}

const nodeFingerprint = (n) => ({
  title: n.title, workCategory: n.workCategory, scope: n.scope,
  sourceIds: [...(n.sourceIds || [])].sort(), effort: n.effort,
  model: n.operatingModel?.primary, dependsOn: [...(n.dependsOn || [])].sort(),
});
