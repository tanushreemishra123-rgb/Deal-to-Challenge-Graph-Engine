// ============================================================================
// Canonical internal execution model.
//
// The four supplied packages are full workspace exports with a rich, nested
// shape. We normalise them into this flatter, stable model that the rest of the
// engine depends on — WITHOUT losing any source identifier. The original
// imported package is always kept verbatim alongside the normalized model
// (see ImportResult) for audit and comparison.
// ============================================================================

export const SCHEMA_VERSION = "1.0";

// scope.items[].kind  →  canonical scope bucket + id-prefix (for reference only;
// real ids are preserved exactly as they appear in the file).
export const KIND_MAP = {
  business:        { bucket: "requirements", type: "business" },
  functional:      { bucket: "requirements", type: "functional" },
  nonFunctional:   { bucket: "requirements", type: "non-functional" },
  integration:     { bucket: "requirements", type: "integration" },
  data:            { bucket: "requirements", type: "data" },
  security:        { bucket: "requirements", type: "security" },
  technology:      { bucket: "requirements", type: "technology" },
  constraint:      { bucket: "requirements", type: "constraint" },
  existingSystem:  { bucket: "requirements", type: "existing-system" },
  persona:         { bucket: "requirements", type: "persona" },
  dependency:      { bucket: "dependencies", type: "dependency" },
  risk:            { bucket: "risks",        type: "risk" },
  gap:             { bucket: "gaps",         type: "gap" },
  assumption:      { bucket: "assumptions",  type: "assumption" },
  question:        { bucket: "questions",    type: "question" },
};

export const OPERATING_MODELS = ["flexible-talent", "challenge", "private-pod"];

export const MATURITY = ["execution-candidate", "review-required", "discovery-required", "blocked"];

export const WORK_CATEGORIES = [
  "discovery", "ux-design", "frontend", "backend-api", "integration",
  "data-engineering", "ai-implementation", "cloud-devops", "security",
  "testing", "documentation", "deployment", "technical-review", "solution-delivery",
];

export const PROVENANCE = [
  "imported", "ai-inferred", "ai-recommended",
  "user-created", "user-approved", "deterministic",
];

// Build an empty canonical shell.
export function emptyCanonical() {
  return {
    schemaVersion: SCHEMA_VERSION,
    deal: { id: null, title: null, maturity: "review-required", customer: null, platform: null },
    scope: { requirements: [], assumptions: [], questions: [], gaps: [], risks: [], dependencies: [] },
    functionalScope: { capabilities: [], modules: [], workstreams: [], deliveryPackages: [], outOfScope: [] },
    architecture: { platform: null, components: [], flows: [], environments: [], securityControls: [] },
    strategy: { dataDomains: [], integrations: [], aiUseCases: [], aiBoundaries: [] },
    delivery: { phases: [], workstreams: [], totals: {}, confidence: "medium", missingInputs: [] },
    quality: { status: "review-required", coveragePct: null, checks: [], findings: [], summary: {} },
    // flat index of every source id → {kind,type,title,bucket} for O(1) traceability
    sourceIndex: {},
  };
}

// Register a source id in the flat index (idempotent).
export function indexSource(canon, id, meta) {
  if (!id) return;
  if (!canon.sourceIndex[id]) canon.sourceIndex[id] = meta;
}

export const allScopeItems = (canon) =>
  [].concat(
    canon.scope.requirements, canon.scope.assumptions, canon.scope.questions,
    canon.scope.gaps, canon.scope.risks, canon.scope.dependencies,
  );
