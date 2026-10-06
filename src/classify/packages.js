// ============================================================================
// buildPackage(node, canonical) → model-specific execution package
//
// Produces the package shape required by the node's operating model. Content is
// drafted from the node's grounded fields; nothing is invented. Fields that
// would require missing information are marked as "to be confirmed" and lower
// the readiness rather than being fabricated.
// ============================================================================
const TBC = "To be confirmed (missing from source — see linked discovery).";

export function buildPackage(node, canonical) {
  const common = {
    nodeId: node.id,
    title: node.title,
    operatingModel: node.operatingModel.primary,
    sourceIds: node.sourceIds,
    readiness: node.readiness,
  };
  if (node.operatingModel.primary === "flexible-talent") return { ...common, kind: "flexible-talent", ...flexible(node) };
  if (node.operatingModel.primary === "challenge") return { ...common, kind: "challenge", ...challenge(node, canonical) };
  return { ...common, kind: "private-pod", ...pod(node) };
}

function flexible(n) {
  return {
    requiredRoles: rolesFor(n),
    requiredSkills: skillsFor(n),
    seniority: n.workCategory === "discovery" ? "Senior specialist" : "Mid–senior",
    durationOrCapacity: effortText(n),
    responsibilities: n.deliverables,
    startDependencies: n.dependsOn,
    requiredAccessAndEnvironment: n.inputs.length ? n.inputs : [TBC],
    readinessNote: n.readiness === "ready" ? "Ready to assign." : "Resolve linked items before assigning.",
  };
}

function challenge(n, c) {
  return {
    objective: n.objective,
    businessAndTechnicalContext: n.scope,
    deliverables: n.deliverables,
    evaluationCriteria: n.acceptanceConditions,
    acceptanceConditions: n.acceptanceConditions,
    inputAssets: n.inputs.length ? n.inputs : [TBC],
    requiredTechnologies: skillsFor(n),
    dependencies: n.dependsOn,
    confidentialityLimitations: hasSensitive(n, c)
      ? "Sensitive data must not be shared with open participants; share sanitized inputs only."
      : "No unrestricted access to sensitive information is required.",
    expectedReviewProcess: "Submissions reviewed against the evaluation criteria; winner selected on score.",
    readinessNote: n.readiness === "ready" ? "Ready to launch." : "Confirm inputs/criteria before launch.",
  };
}

function pod(n) {
  return {
    objective: n.objective,
    requiredRoles: rolesFor(n),
    requiredSkills: skillsFor(n),
    technicalLeadership: "A technical lead owns architecture decisions and coordination.",
    componentOwnership: n.scope,
    deliveryResponsibilities: n.deliverables,
    securityAndAccess: /security|data|integration|ai/.test(n.workCategory)
      ? "Controlled access to restricted systems/data; least-privilege enforced."
      : "Standard delivery access.",
    coordinationDependencies: n.dependsOn,
    expectedDuration: effortText(n),
    definitionOfCompletion: n.acceptanceConditions,
    readinessNote: n.readiness === "ready" ? "Ready to mobilize." : "Resolve linked items before mobilizing the pod.",
  };
}

// ---- helpers ----
function rolesFor(n) {
  const map = {
    discovery: ["Specialist / Analyst"],
    "ux-design": ["UX Designer"],
    frontend: ["Frontend Engineer"],
    "backend-api": ["Backend Engineer"],
    integration: ["Integration Engineer"],
    "data-engineering": ["Data Engineer"],
    "ai-implementation": ["AI/ML Engineer", "Data Engineer"],
    "cloud-devops": ["Cloud/DevOps Engineer"],
    security: ["Security Engineer"],
    testing: ["QA Engineer"],
    deployment: ["Release Engineer", "Cloud/DevOps Engineer"],
    "solution-delivery": ["Tech Lead", "Backend Engineer", "Frontend Engineer"],
    documentation: ["Technical Writer"],
    "technical-review": ["Principal Engineer"],
  };
  return map[n.workCategory] || ["Engineer"];
}
function skillsFor(n) {
  const map = {
    integration: ["API design", "Messaging/ETL", "Error handling"],
    "data-engineering": ["Pipelines", "Data quality", "Lineage"],
    "ai-implementation": ["LLM/ML", "RAG", "Evaluation", "Safety"],
    security: ["IAM", "Compliance", "Threat modeling"],
    "ux-design": ["Interaction design", "Usability testing"],
    testing: ["Test automation", "NFR testing"],
    frontend: ["UI frameworks", "Accessibility"],
    "backend-api": ["Service design", "Databases"],
    "cloud-devops": ["IaC", "CI/CD", "Observability"],
  };
  return map[n.workCategory] || ["General engineering"];
}
const effortText = (n) => `${n.effort.minimum}–${n.effort.maximum} ${n.effort.unit}`;
const hasSensitive = (n, c) =>
  n.workCategory === "security" || /restricted|regulated|phi|confidential/i.test(n.scope || "") ||
  (c.strategy.dataDomains || []).some((d) => /restrict|phi|pii|confidential/i.test(d.classification || ""));
