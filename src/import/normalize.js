// ============================================================================
// normalize(rawPackage) → canonical model
//
// Maps the supplied workspace-export shape into the canonical execution model.
// Every scope item, architecture component, integration, AI use-case, estimate
// workstream/phase, and quality finding keeps its ORIGINAL id. Nothing is
// invented: fields that are absent stay absent (and are later surfaced as
// gaps/missing information, never silently filled).
// ============================================================================
import { emptyCanonical, KIND_MAP, indexSource } from "../model/canonical.js";

const arr = (x) => (Array.isArray(x) ? x : []);
const str = (x) => (typeof x === "string" ? x : x == null ? "" : String(x));

export function normalize(raw) {
  const c = emptyCanonical();

  // ---- deal header ----
  c.deal.id = raw.id || null;
  c.deal.title = raw.name || raw?.input?.scenarioId || "Untitled deal";
  c.deal.customer = raw?.customer?.name || raw?.customer || null;

  // ---- scope.items[] → canonical scope buckets (ids preserved) ----
  for (const it of arr(raw?.scope?.items)) {
    const map = KIND_MAP[it.kind];
    if (!map) continue; // unknown kind — skip into "ignored" (reported by mapping doc)
    const item = {
      id: it.id,
      kind: it.kind,
      type: map.type,
      title: str(it.title),
      description: str(it.description),
      priority: it.priority || null,
      provenance: it.provenance || "imported",
      critical: !!it.critical,
      review: it.review || null,
      relatedIds: arr(it.relatedIds),
      source: it.source || null, // {sectionId, sectionTitle}
    };
    c.scope[map.bucket].push(item);
    indexSource(c, it.id, { kind: it.kind, type: map.type, bucket: map.bucket, title: item.title, critical: item.critical });
  }

  // ---- outputs.prd.functionalScope ----
  const fs = raw?.outputs?.prd?.data?.functionalScope || {};
  c.functionalScope.capabilities = arr(fs.capabilities).map((x) => keep(x, c, "capability"));
  c.functionalScope.modules = arr(fs.modules).map((x) => keep(x, c, "module"));
  c.functionalScope.workstreams = arr(fs.workstreams).map((x) => keep(x, c, "workstream"));
  c.functionalScope.deliveryPackages = arr(fs.deliveryPackages).map((x) => keep(x, c, "delivery-package"));
  c.functionalScope.outOfScope = arr(fs.outOfScope);

  // ---- architecture ----
  const a = raw?.outputs?.architecture?.data || {};
  c.architecture.platform = a.platform || null;
  c.architecture.components = arr(a.components).map((comp) => {
    indexSource(c, comp.id, { kind: "architecture-component", title: str(comp.name), bucket: "architecture", requirementIds: arr(comp.requirementIds) });
    return {
      id: comp.id, name: str(comp.name), area: comp.area || null,
      logicalComponent: comp.logicalComponent || null, service: comp.service || null,
      purpose: str(comp.purpose), rationale: str(comp.rationale),
      requirementIds: arr(comp.requirementIds), assumptionIds: arr(comp.assumptionIds),
    };
  });
  c.architecture.flows = arr(a.flows).map((f) => ({ from: f.from, to: f.to, label: f.label || null, kind: f.kind || null }));
  c.architecture.environments = arr(a.environments);
  c.architecture.securityControls = arr(a.securityControls);

  // ---- data & integration strategy ----
  const di = raw?.outputs?.dataIntegration?.data || {};
  c.strategy.dataDomains = arr(di.domains).map((d) => {
    indexSource(c, d.id, { kind: "data-domain", title: str(d.name), bucket: "strategy", classification: d.classification });
    return { id: d.id, name: str(d.name), description: str(d.description), owner: d.owner || null,
             classification: d.classification || null, requirementIds: arr(d.requirementIds) };
  });
  c.strategy.integrations = arr(di.integrations).map((g) => {
    indexSource(c, g.id, { kind: "integration-spec", title: str(g.name), bucket: "strategy", system: g.system });
    return { id: g.id, name: str(g.name), system: g.system || null, systemType: g.systemType || null,
             direction: g.direction || null, pattern: g.pattern || null, protocol: g.protocol || null,
             authentication: g.authentication || null, errorHandling: g.errorHandling || null, retry: g.retry || null };
  });

  // ---- AI strategy ----
  const ai = raw?.outputs?.aiStrategy?.data || {};
  c.strategy.aiApplicable = ai.applicable !== false;
  c.strategy.aiUseCases = arr(ai.useCases).map((u) => {
    indexSource(c, u.id, { kind: "ai-usecase", title: str(u.name), bucket: "strategy", requirementIds: arr(u.requirementIds) });
    return { id: u.id, name: str(u.name), description: str(u.description), pattern: u.pattern || null,
             requirementIds: arr(u.requirementIds), safety: u.safety || null, retrieval: u.retrieval || null };
  });
  // boundaries: activity/type(ai|deterministic|human)/reason/requirementIds — the
  // human ones are mandatory human-review checkpoints.
  c.strategy.aiBoundaries = arr(ai.boundaries).map((b) => ({
    activity: str(b.activity), type: b.type || null, reason: str(b.reason), requirementIds: arr(b.requirementIds),
  }));

  // ---- estimate / delivery ----
  const est = raw?.outputs?.estimate?.data?.result || {};
  c.delivery.phases = arr(est.phases).map((p) => keep(p, c, "phase"));
  c.delivery.workstreams = arr(est.workstreams).map((w) => {
    indexSource(c, w.id, { kind: "estimate-workstream", title: str(w.name || w.title), bucket: "delivery" });
    return { id: w.id || null, name: str(w.name || w.title), effort: w.effort ?? w.totalDays ?? null,
             roles: arr(w.roles), requirementIds: arr(w.requirementIds), phase: w.phase || null };
  });
  c.delivery.totals = est.totals || {};
  c.delivery.confidence = (est.confidence || raw?.outputs?.estimate?.data?.confidence || "medium");
  c.delivery.missingInputs = arr(est.missingInputs);
  c.delivery.risks = arr(est.risks);
  c.delivery.dependencies = arr(est.dependencies);
  c.delivery.assumptions = arr(est.assumptions);

  // ---- quality ----
  const q = raw?.quality || {};
  c.quality.checks = arr(q.checks).map((ch) => ({
    id: ch.id, label: str(ch.label), description: str(ch.description),
    status: ch.status || null, count: ch.count ?? null, findings: arr(ch.findings),
  }));
  c.quality.summary = q.summary || {};
  c.quality.coveragePct = q.summary?.requirementCoveragePct ?? null;
  c.quality.exportStatus = q.summary?.exportStatus || null;
  // flatten findings for convenience
  c.quality.findings = c.quality.checks.flatMap((ch) =>
    ch.findings.map((fd) => ({ checkId: ch.id, checkLabel: ch.label, status: ch.status, ...toObj(fd) })));

  // ---- output freshness (reviewed / stale) — feeds maturity ----
  c.outputsMeta = {};
  for (const key of ["prd", "architecture", "dataIntegration", "aiStrategy", "estimate"]) {
    const o = raw?.outputs?.[key];
    if (o) c.outputsMeta[key] = { status: o.status || null, reviewed: !!o.reviewed, staleReasons: arr(o.staleReasons) };
  }

  return c;
}

// Keep an object that has an id, indexing it; otherwise pass through.
function keep(x, c, kind) {
  if (x && typeof x === "object" && x.id) {
    indexSource(c, x.id, { kind, title: str(x.name || x.title), bucket: "functionalScope" });
  }
  return x;
}
const toObj = (fd) => (typeof fd === "string" ? { message: fd } : (fd || {}));
