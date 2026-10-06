// ============================================================================
// validate(raw, canon) → { ok, issues[], stats }
//
// Deterministic structural + reference validation. Missing information is
// *reported*, never invented. Each issue has a severity so the maturity
// assessment and quality gate can consume them.
// ============================================================================
import { allScopeItems } from "../model/canonical.js";

const REQUIRED_TOP = ["id", "scope", "outputs", "quality"];

export function validate(raw, canon) {
  const issues = [];
  const add = (severity, code, message, refs = []) => issues.push({ severity, code, message, refs });

  // ---- structure ----
  if (!raw || typeof raw !== "object") {
    add("error", "not-json", "Imported package is not a JSON object");
    return { ok: false, issues, stats: {} };
  }
  for (const k of REQUIRED_TOP) {
    if (!(k in raw)) add("error", "missing-section", `Required top-level section "${k}" is missing`);
  }
  if (!Array.isArray(raw?.scope?.items)) add("error", "missing-section", "scope.items[] is missing or not an array");

  // ---- duplicate ids ----
  const seen = new Map();
  for (const it of allScopeItems(canon)) {
    if (!it.id) { add("error", "missing-id", `A ${it.kind} item has no id`, []); continue; }
    seen.set(it.id, (seen.get(it.id) || 0) + 1);
  }
  for (const [id, n] of seen) if (n > 1) add("error", "duplicate-id", `Duplicate source id "${id}" appears ${n}×`, [id]);

  // ---- dangling references (relatedIds / requirementIds point at unknown ids) ----
  const known = new Set(Object.keys(canon.sourceIndex));
  const checkRefs = (ownerId, refs) => {
    for (const r of refs || []) if (r && !known.has(r)) add("warning", "dangling-ref", `"${ownerId}" references unknown id "${r}"`, [ownerId, r]);
  };
  for (const it of allScopeItems(canon)) checkRefs(it.id, it.relatedIds);
  for (const comp of canon.architecture.components) checkRefs(comp.id, comp.requirementIds);
  for (const uc of canon.strategy.aiUseCases) checkRefs(uc.id, uc.requirementIds);
  for (const dom of canon.strategy.dataDomains) checkRefs(dom.id, dom.requirementIds);

  // ---- existing blockers: critical gaps & critical questions ----
  const criticalGaps = canon.scope.gaps.filter((g) => g.critical);
  const criticalQs = canon.scope.questions.filter((q) => q.critical);
  for (const g of criticalGaps) add("blocker", "critical-gap", `Critical gap: ${g.title}`, [g.id, ...g.relatedIds]);
  for (const q of criticalQs) add("blocker", "critical-question", `Critical open question: ${q.title}`, [q.id, ...q.relatedIds]);

  // ---- unresolved questions / unconfirmed assumptions (non-critical) ----
  const openQs = canon.scope.questions.filter((q) => !q.critical);
  if (openQs.length) add("warning", "open-questions", `${openQs.length} unresolved question(s)`, openQs.map((q) => q.id));
  const openAsm = canon.scope.assumptions.filter((a) => (a.review || "").toLowerCase() !== "approved");
  if (openAsm.length) add("warning", "unconfirmed-assumptions", `${openAsm.length} unconfirmed assumption(s)`, openAsm.map((a) => a.id));

  // ---- quality findings carried from the source package ----
  for (const ch of canon.quality.checks) {
    const st = (ch.status || "").toLowerCase();
    if (st && st !== "pass" && st !== "ok" && ch.count) {
      add(st === "fail" ? "error" : "warning", "quality-finding", `Quality check "${ch.label}": ${ch.status} (${ch.count})`, []);
    }
  }

  // ---- stale / unreviewed outputs ----
  for (const [key, meta] of Object.entries(canon.outputsMeta || {})) {
    if (meta.staleReasons?.length) add("warning", "stale-output", `Output "${key}" is stale: ${meta.staleReasons.join("; ")}`);
    if (meta.reviewed === false) add("info", "unreviewed-output", `Output "${key}" has not been human-reviewed`);
  }

  // ---- missing estimation inputs ----
  if (canon.delivery.missingInputs?.length)
    add("warning", "missing-estimate-inputs", `Estimate is missing ${canon.delivery.missingInputs.length} input(s)`, []);
  if ((canon.delivery.confidence || "").toLowerCase() === "low")
    add("warning", "low-estimate-confidence", "Estimate confidence is Low");

  const stats = {
    totalSourceIds: known.size,
    requirements: canon.scope.requirements.length,
    gaps: canon.scope.gaps.length, criticalGaps: criticalGaps.length,
    questions: canon.scope.questions.length, criticalQuestions: criticalQs.length,
    assumptions: canon.scope.assumptions.length,
    components: canon.architecture.components.length,
    integrations: canon.strategy.integrations.length,
    aiUseCases: canon.strategy.aiUseCases.length,
    humanBoundaries: canon.strategy.aiBoundaries.filter((b) => b.type === "human-decision" || b.type === "human").length,
    errors: issues.filter((i) => i.severity === "error").length,
    blockers: issues.filter((i) => i.severity === "blocker").length,
    warnings: issues.filter((i) => i.severity === "warning").length,
  };
  return { ok: stats.errors === 0, issues, stats };
}
