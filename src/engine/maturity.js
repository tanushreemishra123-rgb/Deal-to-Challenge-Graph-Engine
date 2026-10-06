// ============================================================================
// assessMaturity(canonical, validation) → { maturity, score, reasons[], signals }
//
// Deterministic. Classifies the imported package as one of:
//   execution-candidate | review-required | discovery-required | blocked
// Critical missing information must reduce readiness (and later create blocking
// discovery nodes). An incomplete package is never presented as fully ready.
// ============================================================================
export function assessMaturity(c, validation) {
  const s = validation.stats;
  const reasons = [];
  const signals = {
    criticalGaps: s.criticalGaps,
    criticalQuestions: s.criticalQuestions,
    openQuestions: s.questions - s.criticalQuestions,
    unconfirmedAssumptions: s.assumptions,
    coveragePct: c.quality.coveragePct,
    estimateConfidence: c.delivery.confidence,
    missingEstimateInputs: (c.delivery.missingInputs || []).length,
    unreviewedOutputs: Object.values(c.outputsMeta || {}).filter((m) => m.reviewed === false).length,
    qualityFails: c.quality.checks.filter((q) => (q.status || "").toLowerCase() === "fail").length,
    structuralErrors: s.errors,
  };

  const criticalBlockers = signals.criticalGaps + signals.criticalQuestions;
  const lowConfidence = (c.delivery.confidence || "").toLowerCase() === "low";

  // --- weighted readiness score (0 best → higher = less ready) ---
  let score = 0;
  score += criticalBlockers * 10;
  score += (signals.missingEstimateInputs) * 3;
  score += lowConfidence ? 12 : 0;
  score += signals.unreviewedOutputs * 2;
  score += signals.qualityFails * 8;
  score += signals.coveragePct != null ? (100 - signals.coveragePct) * 0.5 : 10;
  score += signals.openQuestions * 1.5;

  let maturity;
  if (signals.structuralErrors > 0) {
    maturity = "blocked";
    reasons.push(`${signals.structuralErrors} structural error(s) prevent reliable planning.`);
  } else if (criticalBlockers >= 5 || (lowConfidence && criticalBlockers >= 3)) {
    maturity = "discovery-required";
    reasons.push(`${criticalBlockers} critical gaps/questions must be resolved before implementation can be planned.`);
    if (lowConfidence) reasons.push("Estimate confidence is Low — scope and effort are not yet dependable.");
  } else if (criticalBlockers >= 1 || signals.unreviewedOutputs > 0 || signals.qualityFails > 0 ||
             (signals.coveragePct != null && signals.coveragePct < 100) ||
             (c.quality.exportStatus || "").toLowerCase() === "review required") {
    maturity = "review-required";
    if (criticalBlockers) reasons.push(`${criticalBlockers} critical item(s) require resolution or a blocking discovery node.`);
    if (signals.unreviewedOutputs) reasons.push(`${signals.unreviewedOutputs} design output(s) have not been human-reviewed.`);
    if (signals.qualityFails) reasons.push(`${signals.qualityFails} quality check(s) failed.`);
  } else {
    maturity = "execution-candidate";
    reasons.push("Coverage is complete, no critical blockers remain, and outputs are reviewed.");
  }

  // Extra context lines
  if (signals.openQuestions) reasons.push(`${signals.openQuestions} non-critical open question(s) should be tracked.`);
  if (signals.missingEstimateInputs) reasons.push(`Estimate is missing ${signals.missingEstimateInputs} input(s).`);

  return { maturity, score: Math.round(score), reasons, signals };
}
