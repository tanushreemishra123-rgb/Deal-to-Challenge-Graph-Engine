// One-call pipeline: raw package → full compiled result.
// This is the deterministic + rules-based ("mock AI") path that runs offline
// for all four supplied packages with no paid AI access.
import { importPackage } from "../import/importPackage.js";
import { assessMaturity } from "./maturity.js";
import { buildGraph } from "./buildGraph.js";
import { runQualityGate } from "./qualityGate.js";

export function compile(raw) {
  const imp = importPackage(raw);
  const maturity = assessMaturity(imp.canonical, imp.validation);
  const { graph, analysis } = buildGraph(imp.canonical);
  const qualityGate = runQualityGate(graph, analysis, imp.canonical);
  return {
    raw: imp.raw,
    canonical: imp.canonical,
    validation: imp.validation,
    maturity,
    graph,
    analysis,
    qualityGate,
  };
}
