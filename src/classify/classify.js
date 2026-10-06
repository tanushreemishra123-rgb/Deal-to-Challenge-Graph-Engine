// ============================================================================
// classifyNode(node, canonical) → operatingModel object
//   { primary, alternatives[], confidence, rationale[], sourceIds[], overridden }
//
// Scores each of the three Topcoder operating models from work characteristics
// and picks the best fit WITH an explainable rationale. The engine never assumes
// every node is a Challenge: discovery/specialist work favours Flexible Talent,
// coordinated/coupled/regulated work favours Private Pod, and bounded,
// competitively-deliverable work favours Challenge.
// ============================================================================

export function classifyNode(n, c) {
  const sig = signalsFor(n, c);
  const scores = { "flexible-talent": 0, "challenge": 0, "private-pod": 0 };
  const why = { "flexible-talent": [], "challenge": [], "private-pod": [] };
  const push = (model, pts, reason) => { scores[model] += pts; if (reason) why[model].push(reason); };

  // ---- Private Pod: coordination, coupling, restricted access, regulation ----
  if (sig.coordination) push("private-pod", 3, "The work needs continuous technical coordination across roles.");
  if (sig.coupling >= 8) push("private-pod", 3, "The components are strongly coupled and must be built together.");
  if (sig.restrictedAccess) push("private-pod", 3, "Restricted/sensitive data requires a controlled, vetted team.");
  if (sig.regulated) push("private-pod", 2, "Regulated requirements need sustained delivery ownership.");
  if (sig.roleCount >= 3) push("private-pod", 2, "Multiple technical roles must work together.");
  if (sig.securitySensitive && sig.coupling >= 4) push("private-pod", 1, "Security-critical, coupled work benefits from a dedicated pod.");

  // ---- Challenge: bounded, measurable, benefits from multiple approaches ----
  if (sig.exploratory) push("challenge", 3, "Multiple approaches or perspectives would add value.");
  if (sig.bounded && sig.measurable) push("challenge", 2, "The scope is bounded and can be evaluated against clear criteria.");
  if (sig.independent) push("challenge", 2, "The work can be packaged and delivered independently.");
  if (!sig.restrictedAccess && !sig.regulated && sig.bounded) push("challenge", 1, "No sensitive-access constraints prevent open participation.");
  if (n.workCategory === "ux-design") push("challenge", 1, "Design exploration is well suited to competitive delivery.");

  // ---- Flexible Talent: a known specialist task, directly managed ----
  if (sig.singleSpecialist) push("flexible-talent", 3, "The work is a focused task for one specialist with known skills.");
  if (n.workCategory === "discovery") push("flexible-talent", 2, "A focused technical assessment fits a single specialist.");
  if (sig.roleCount === 1) push("flexible-talent", 2, "One clearly-defined role is required.");
  if (sig.smallEffort && !sig.coordination) push("flexible-talent", 1, "Small, self-contained effort that can be directly managed.");

  // pick primary (ties broken by priority: private-pod > flexible-talent > challenge,
  // but only when scores are equal — never auto-Challenge)
  const ranked = Object.entries(scores).sort((a, b) =>
    b[1] - a[1] || tieRank(a[0]) - tieRank(b[0]));
  const [primary, top] = ranked[0];
  const second = ranked[1];

  // confidence from score separation
  const gap = top - second[1];
  const confidence = top === 0 ? "low" : gap >= 3 ? "high" : gap >= 1 ? "medium" : "low";

  // alternatives: any model within 1 point of the top (and non-zero)
  const alternatives = ranked.slice(1).filter(([, s]) => s > 0 && top - s <= 2).map(([m]) => m);

  // rationale = reasons that pushed the winner, plus (if low confidence) a note
  let rationale = why[primary].slice(0, 4);
  if (!rationale.length) rationale = ["Best-fit given the work characteristics; limited distinguishing signals (see alternatives)."];
  if (confidence === "low") rationale.push("Confidence is low — review the alternative model(s) before committing.");

  return {
    primary,
    alternatives,
    confidence,
    rationale,
    sourceIds: n.sourceIds.slice(0, 8),
    scores,
    overridden: false,
    overrideHistory: [],
  };
}

const tieRank = (m) => ({ "private-pod": 0, "flexible-talent": 1, "challenge": 2 }[m]);

function signalsFor(n, c) {
  const cat = n.workCategory;
  const effMid = ((n.effort?.minimum ?? 0) + (n.effort?.maximum ?? 0)) / 2;
  const coupling = n._coupling ?? (n.sourceIds?.length || 0);
  const componentCount = n._componentCount ?? 0;

  const exploratory = n._exploratory || cat === "ux-design" ||
    (cat === "ai-implementation" && !n._regulatedAI) ||
    (cat === "discovery" && (n.sourceIds?.length || 0) > 3);
  const regulated = !!(n._regulatedAI || n._restrictedData) || hasRegulated(c);
  const restrictedAccess = !!(n._restrictedData || n._securitySensitive && regulated);
  const coordination = !!n._coordination || componentCount >= 3 || cat === "solution-delivery" || cat === "deployment";
  const securitySensitive = !!n._securitySensitive || cat === "security";
  const bounded = !!n._bounded || ["ux-design", "testing", "documentation"].includes(cat) || componentCount <= 2;
  const measurable = (n.acceptanceConditions?.length || 0) >= 2;
  const independent = !!n._independent || cat === "testing" || cat === "ux-design";
  const roleCount = estimateRoles(cat, componentCount);
  const singleSpecialist = roleCount === 1 && !coordination && (cat === "discovery" || effMid <= 6);
  const smallEffort = effMid <= 6;

  return { exploratory, regulated, restrictedAccess, coordination, securitySensitive,
           bounded, measurable, independent, roleCount, singleSpecialist, smallEffort, coupling, componentCount };
}

function estimateRoles(cat, componentCount) {
  if (["discovery", "documentation", "testing"].includes(cat)) return 1;
  if (["ux-design", "security", "data-engineering", "integration"].includes(cat)) return componentCount >= 3 ? 2 : 1;
  if (["ai-implementation", "backend-api", "frontend"].includes(cat)) return 2;
  if (["solution-delivery", "deployment", "cloud-devops"].includes(cat)) return 3;
  return 2;
}
const hasRegulated = (c) =>
  c.strategy.dataDomains?.some((d) => /phi|pii|regulated|restrict|confidential|health|gdpr/i.test((d.classification || "") + (d.name || "")));
