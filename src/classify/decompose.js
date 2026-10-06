// ============================================================================
// decompose(canonical) → { nodes, edges }
//
// Rules-based (mock-mode "AI") delivery decomposition. Every node is GROUNDED in
// real imported source ids. Missing information becomes discovery/clarification
// work — never invented contracts, security details, or acceptance conditions.
// Each node is labelled with provenance; drafted text is "ai-recommended".
// ============================================================================
import { classifyNode } from "./classify.js";

let _n = 0;
const nid = () => `NODE_${String(++_n).padStart(3, "0")}`;
let _e = 0;
const eid = () => `EDGE_${String(++_e).padStart(3, "0")}`;
export const resetIds = () => { _n = 0; _e = 0; };

const uniq = (a) => [...new Set(a.filter(Boolean))];

export function decompose(c) {
  resetIds();
  const nodes = [];
  const edges = [];
  const addEdge = (source, target, type, rationale, blocking = true) =>
    edges.push({ id: eid(), source, target, type, rationale, blocking, sourceIds: [] });

  // ---------- 1) Discovery / clarification nodes from gaps & questions ----------
  // Critical ones block; non-critical ones are review-required.
  const discoveryNodes = [];
  const blockerItems = [...c.scope.gaps, ...c.scope.questions];
  for (const item of blockerItems) {
    const refs = uniq([item.id, ...item.relatedIds]);
    const node = baseNode({
      title: `Resolve: ${item.title}`,
      objective: `Clarify and confirm "${item.title}" before dependent implementation proceeds.`,
      workCategory: "discovery",
      scope: item.description || item.title,
      sourceIds: refs,
      inputs: ["Access to the relevant stakeholders or source systems"],
      deliverables: ["A documented decision or confirmed answer", "Updated assumptions/requirements"],
      acceptanceConditions: ["The open item is resolved and recorded as a reviewed decision."],
      effort: item.critical ? { minimum: 2, maximum: 5, unit: "person-days" }
                            : { minimum: 1, maximum: 3, unit: "person-days" },
      readiness: "ready",
      blocked: false,
    });
    node._blockerFor = item.relatedIds; // used to wire blocking edges
    node._critical = item.critical;
    nodes.push(node); discoveryNodes.push(node);
  }

  // ---------- 2) Integration nodes (one per integration spec) ----------
  const integrationNodes = [];
  for (const g of c.strategy.integrations) {
    const refs = uniq([g.id, ...reqsReferencing(c, g.id)]);
    const missingContract = !g.protocol || !g.authentication; // do not invent — flag instead
    const node = baseNode({
      title: `Integrate ${g.name}`,
      objective: `Deliver the ${g.name} integration (${g.systemType || "external"} · ${g.pattern || "unspecified pattern"}).`,
      workCategory: "integration",
      scope: `${g.direction || ""} integration with ${g.system || g.name}`.trim(),
      sourceIds: refs,
      inputs: uniq([g.protocol ? `${g.protocol} contract` : null, g.authentication ? `${g.authentication} credentials` : null].filter(Boolean)),
      deliverables: [`${g.name} integration`, "Error handling & retry", "Integration tests"],
      acceptanceConditions: ["Messages flow in the specified direction.", "Failures are handled per the retry policy."],
      effort: { minimum: 4, maximum: 8, unit: "person-days" },
      readiness: missingContract ? "review-required" : "ready",
      blocked: false,
    });
    node._touchesIntegration = g.id;
    node._missingContract = missingContract;
    nodes.push(node); integrationNodes.push(node);
  }

  // ---------- 3) AI implementation nodes (one per AI use case) ----------
  const aiNodes = [];
  const humanBoundaries = c.strategy.aiBoundaries.filter((b) => b.type === "human-decision" || b.type === "human");
  for (const u of c.strategy.aiUseCases) {
    const refs = uniq([u.id, ...u.requirementIds]);
    const node = baseNode({
      title: `Build AI capability: ${u.name}`,
      objective: `Implement "${u.name}" (${u.pattern || "AI"}), including evaluation and safety controls.`,
      workCategory: "ai-implementation",
      scope: u.description || u.name,
      sourceIds: refs,
      inputs: ["Grounding data sources", "Evaluation dataset"],
      deliverables: [`${u.name} implementation`, "Evaluation harness", "Safety guardrails"],
      acceptanceConditions: ["Outputs are grounded and evaluated.", humanBoundaries.length ? "Human review is enforced where required." : "Quality thresholds are met."],
      effort: { minimum: 6, maximum: 12, unit: "person-days" },
      readiness: "review-required",
      blocked: false,
    });
    node._regulatedAI = humanBoundaries.length > 0 || hasRegulatedData(c);
    nodes.push(node); aiNodes.push(node);
  }

  // ---------- 4) Data engineering / migration node ----------
  const dataReqs = c.scope.requirements.filter((r) => r.type === "data");
  if (dataReqs.length || c.strategy.dataDomains.length) {
    const refs = uniq([...dataReqs.map((r) => r.id), ...c.strategy.dataDomains.map((d) => d.id)]);
    const restricted = c.strategy.dataDomains.some((d) => /restrict|phi|pii|regulated|confidential/i.test(d.classification || ""));
    const node = baseNode({
      title: "Data platform & migration",
      objective: "Deliver data domains, pipelines, quality, lineage, and any required migration.",
      workCategory: "data-engineering",
      scope: `${c.strategy.dataDomains.length} data domain(s); ${dataReqs.length} data requirement(s)`,
      sourceIds: refs,
      inputs: ["Source schemas", "Data classification policy"],
      deliverables: ["Data pipelines", "Quality & lineage controls", "Migration (if in scope)"],
      acceptanceConditions: ["Data is validated and reconciled.", "Lineage is traceable."],
      effort: { minimum: 8, maximum: 15, unit: "person-days" },
      readiness: "ready",
      blocked: false,
    });
    node._restrictedData = restricted;
    nodes.push(node); c._dataNode = node;
  }

  // ---------- 5) Security & compliance node ----------
  const secReqs = c.scope.requirements.filter((r) => r.type === "security");
  if (secReqs.length) {
    const refs = uniq(secReqs.map((r) => r.id));
    const node = baseNode({
      title: "Security & compliance controls",
      objective: "Implement security, privacy, and compliance controls across the solution.",
      workCategory: "security",
      scope: `${secReqs.length} security/compliance requirement(s)`,
      sourceIds: refs,
      inputs: ["Compliance scope", "Threat model"],
      deliverables: ["Access controls", "Audit logging", "Compliance evidence"],
      acceptanceConditions: ["Unauthorized access is rejected.", "Controls meet the stated compliance scope."],
      effort: { minimum: 5, maximum: 10, unit: "person-days" },
      readiness: "ready",
      blocked: false,
    });
    node._securitySensitive = true;
    nodes.push(node); c._securityNode = node;
  }

  // ---------- 6) UX / design exploration (from personas + functional scope) ----------
  const personas = c.scope.requirements.filter((r) => r.type === "persona");
  const funcReqs = c.scope.requirements.filter((r) => r.type === "functional");
  if (funcReqs.length) {
    const refs = uniq([...personas.map((p) => p.id), ...funcReqs.slice(0, 4).map((r) => r.id)]);
    const node = baseNode({
      title: "Explore the user experience",
      objective: "Produce UX concepts and a validated interaction design for the core journeys.",
      workCategory: "ux-design",
      scope: `${personas.length} persona(s); core functional journeys`,
      sourceIds: refs,
      inputs: ["Personas", "Core journeys"],
      deliverables: ["UX concepts", "Validated interaction design"],
      acceptanceConditions: ["Designs cover the core journeys.", "Designs meet usability criteria."],
      effort: { minimum: 5, maximum: 10, unit: "person-days" },
      readiness: "ready",
      blocked: false,
    });
    node._exploratory = true; node._bounded = true;
    nodes.push(node); c._uxNode = node;
  }

  // ---------- 7) Core implementation node(s) from architecture areas ----------
  const implNodes = [];
  const areas = groupComponentsByArea(c.architecture.components);
  const areaEntries = Object.entries(areas);
  // If there are many coupled components across areas, produce coordinated build nodes per area.
  for (const [area, comps] of areaEntries.slice(0, 4)) {
    const refs = uniq([...comps.map((x) => x.id), ...comps.flatMap((x) => x.requirementIds)]).slice(0, 12);
    const category = areaToCategory(area);
    const node = baseNode({
      title: `Build ${area}`,
      objective: `Implement the ${area} components and their interfaces.`,
      workCategory: category,
      scope: `${comps.length} architecture component(s) in ${area}`,
      sourceIds: refs,
      inputs: ["Approved architecture", "Interface contracts"],
      deliverables: [`${area} components`, "Automated tests"],
      acceptanceConditions: ["Components meet their stated purpose.", "Automated tests pass."],
      effort: { minimum: 6 + comps.length, maximum: 10 + comps.length * 2, unit: "person-days" },
      readiness: "review-required",
      blocked: false,
    });
    node._componentCount = comps.length;
    node._coupling = comps.length + countCrossRefs(comps);
    node._area = area;
    nodes.push(node); implNodes.push(node);
  }

  // ---------- 8) Testing & deployment ----------
  const nfIds = c.scope.requirements.filter((r) => r.type === "non-functional").map((r) => r.id);
  const funcIds = c.scope.requirements.filter((r) => r.type === "functional").map((r) => r.id);
  const bizIds = c.scope.requirements.filter((r) => r.type === "business").map((r) => r.id);
  const testNode = baseNode({
    title: "Independent testing & quality",
    objective: "Verify the solution against acceptance criteria with independent testing.",
    workCategory: "testing",
    scope: "End-to-end and non-functional testing",
    sourceIds: uniq((nfIds.length ? nfIds : funcIds.length ? funcIds : bizIds).slice(0, 6)),
    inputs: ["Built components", "Acceptance criteria"],
    deliverables: ["Test suites", "Defect report", "Sign-off"],
    acceptanceConditions: ["Acceptance criteria verified.", "Critical defects resolved."],
    effort: { minimum: 4, maximum: 8, unit: "person-days" },
    readiness: "ready", blocked: false,
  });
  testNode._bounded = true; testNode._independent = true;
  nodes.push(testNode);

  const deployNode = baseNode({
    title: "Deployment & cutover",
    objective: "Deploy to target environments and execute cutover.",
    workCategory: "deployment",
    scope: "Environment setup, release, cutover",
    sourceIds: uniq((c.scope.requirements.filter((r) => r.type === "constraint").map((r) => r.id).concat(bizIds)).slice(0, 4)),
    inputs: ["Release artifacts", "Environment access"],
    deliverables: ["Deployed solution", "Runbook"],
    acceptanceConditions: ["Solution runs in the target environment.", "Rollback is tested."],
    effort: { minimum: 3, maximum: 6, unit: "person-days" },
    readiness: "review-required", blocked: false,
  });
  deployNode._coordination = true;
  nodes.push(deployNode);

  // ================= DEPENDENCY WIRING =================
  const implAll = [...implNodes, ...integrationNodes, ...aiNodes, c._dataNode, c._securityNode].filter(Boolean);

  // (a) critical discovery blocks implementation nodes that share its related ids
  for (const d of discoveryNodes.filter((n) => n._critical)) {
    for (const impl of implAll) {
      if (shareId(d.sourceIds, impl.sourceIds) || shareId(d._blockerFor, impl.sourceIds)) {
        addEdge(d.id, impl.id, "blocking-discovery", `${impl.title} needs "${d.title}" resolved first.`, true);
        impl.readiness = impl.readiness === "ready" ? "review-required" : impl.readiness;
      }
    }
  }
  // (b) UX → frontend/impl handoff
  if (c._uxNode) for (const impl of implNodes.filter((n) => ["frontend", "backend-api", "solution-delivery"].includes(n.workCategory)))
    addEdge(c._uxNode.id, impl.id, "design-handoff", "Implementation needs the approved experience.", true);
  // (c) data & security foundations precede implementation
  if (c._dataNode) for (const impl of implNodes) addEdge(c._dataNode.id, impl.id, "data-foundation", "Implementation depends on the data platform.", true);
  if (c._securityNode) for (const impl of implNodes) addEdge(c._securityNode.id, impl.id, "security-foundation", "Implementation must apply security controls.", false);
  // (d) integrations precede implementation that references them
  for (const g of integrationNodes) for (const impl of implNodes)
    if (shareId(g.sourceIds, impl.sourceIds)) addEdge(g.id, impl.id, "integration-dependency", `${impl.title} depends on ${g.title}.`, true);
  // (e) implementation → testing → deployment
  for (const impl of implAll) addEdge(impl.id, testNode.id, "verification", "Built work must be tested.", true);
  addEdge(testNode.id, deployNode.id, "release-gate", "Deployment follows successful testing.", true);

  // (f) connect any remaining orphan to the testing/sign-off gate so every unit of
  // work is accounted for before handoff (discovery items must be closed first).
  const touched = new Set();
  for (const e of edges) { touched.add(e.source); touched.add(e.target); }
  for (const n of nodes) {
    if (n === testNode || n === deployNode || touched.has(n.id)) continue;
    const isDisc = n.workCategory === "discovery";
    addEdge(n.id, testNode.id, isDisc ? "open-item" : "verification",
      isDisc ? "This open item must be resolved before sign-off." : "Must be accounted for before sign-off.",
      !!n._critical);
  }

  // ================= CLASSIFY each node (operating model) =================
  for (const n of nodes) {
    const cls = classifyNode(n, c);
    n.operatingModel = cls;
    // nodes missing information required by their model stay review-required/blocked
    if (n._missingContract && n.operatingModel.primary === "challenge") n.readiness = "review-required";
  }

  // clean internal temp fields
  for (const n of nodes) for (const k of Object.keys(n)) if (k.startsWith("_")) delete n[k];
  delete c._dataNode; delete c._securityNode; delete c._uxNode;

  return { nodes, edges };
}

// ---------- helpers ----------
function baseNode(p) {
  return {
    id: nid(),
    title: p.title,
    objective: p.objective,
    workCategory: p.workCategory,
    scope: p.scope,
    sourceIds: p.sourceIds || [],
    inputs: p.inputs || [],
    deliverables: p.deliverables || [],
    acceptanceConditions: p.acceptanceConditions || [],
    dependsOn: [],
    requiredSkills: [],
    effort: p.effort || { minimum: 3, maximum: 6, unit: "person-days" },
    risks: [],
    assumptions: [],
    blocked: !!p.blocked,
    provenance: "ai-recommended",
    readiness: p.readiness || "review-required",
  };
}
const shareId = (a = [], b = []) => a.some((x) => b.includes(x));
const reqsReferencing = (c, id) =>
  c.scope.requirements.filter((r) => r.relatedIds.includes(id)).map((r) => r.id);
const hasRegulatedData = (c) =>
  c.strategy.dataDomains.some((d) => /phi|pii|regulated|restrict|confidential|health|gdpr/i.test((d.classification || "") + (d.name || "")));
function groupComponentsByArea(components) {
  const g = {};
  for (const comp of components) { const a = comp.area || "Core"; (g[a] ||= []).push(comp); }
  return g;
}
function areaToCategory(area) {
  const a = (area || "").toLowerCase();
  if (/front|ui|experience|portal/.test(a)) return "frontend";
  if (/data|analytic|warehouse|lake/.test(a)) return "data-engineering";
  if (/integration|api|service/.test(a)) return "backend-api";
  if (/ai|ml|model/.test(a)) return "ai-implementation";
  if (/cloud|infra|devops|platform/.test(a)) return "cloud-devops";
  if (/security|identity/.test(a)) return "security";
  return "solution-delivery";
}
function countCrossRefs(comps) {
  const ids = new Set(comps.map((c) => c.id));
  let n = 0; for (const c of comps) for (const r of c.requirementIds || []) if (!ids.has(r)) n++;
  return n;
}
