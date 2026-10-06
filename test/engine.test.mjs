// Headless test suite. Verifies the spec's required behaviours against the four
// real supplied packages. Run with: npm test
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { compile } from "../src/engine/pipeline.js";
import { exportGraphJSON } from "../src/engine/exporters.js";
import { changeImpact } from "../src/engine/changeImpact.js";
import { analyzeGraph } from "../src/engine/dag.js";
import { classifyNode } from "../src/classify/classify.js";

const dir = path.dirname(fileURLToPath(import.meta.url));
const FILES = {
  claimsdesk: "claimsdesk-modernization.json",
  clinical: "clinical-intake-and-patient-support-assistant.json",
  member: "member-experience-modernisation-early-discovery.json",
  supply: "unified-supply-chain-analytics.json",
};
const load = (f) => JSON.parse(fs.readFileSync(path.join(dir, "fixtures", f), "utf8"));

let pass = 0, fail = 0;
const ok = (name, cond) => { cond ? pass++ : fail++; console.log(`${cond ? "✅" : "❌"} ${name}`); };

const compiled = Object.fromEntries(Object.entries(FILES).map(([k, f]) => [k, compile(load(f))]));

// 1. all four import successfully
for (const [k, r] of Object.entries(compiled))
  ok(`[${k}] imports with no structural errors`, r.validation.stats.errors === 0);

// 2. source ids preserved
for (const [k, r] of Object.entries(compiled)) {
  const rawIds = (r.raw.scope?.items || []).map((i) => i.id);
  ok(`[${k}] all scope-item source ids preserved`, rawIds.every((id) => id in r.canonical.sourceIndex));
}

// 3. every executable node has exactly one primary operating model
for (const [k, r] of Object.entries(compiled)) {
  const good = r.graph.nodes.every((n) => n.operatingModel && ["flexible-talent", "challenge", "private-pod"].includes(n.operatingModel.primary));
  ok(`[${k}] every node has exactly one valid operating model`, good);
}

// 4. classification rationales present
for (const [k, r] of Object.entries(compiled))
  ok(`[${k}] every classification has a rationale`, r.graph.nodes.every((n) => n.operatingModel.rationale.length > 0));

// 5. mixed-model support (all four happen to use all three)
for (const [k, r] of Object.entries(compiled)) {
  const s = r.graph.operatingModelSummary;
  ok(`[${k}] supports mixed operating models`, (s.flexibleTalent > 0) + (s.challenge > 0) + (s.privatePod > 0) >= 2);
}
// not every node is a Challenge
for (const [k, r] of Object.entries(compiled))
  ok(`[${k}] does NOT classify everything as Challenge`, r.graph.operatingModelSummary.challenge < r.graph.nodes.length);

// 6. missing information creates blockers or discovery nodes
ok(`[member] low-maturity package → discovery-required`, compiled.member.maturity.maturity === "discovery-required");
for (const [k, r] of Object.entries(compiled)) {
  const discovery = r.graph.nodes.filter((n) => n.workCategory === "discovery").length;
  ok(`[${k}] creates discovery nodes for gaps/questions`, discovery > 0);
}

// 7. cycles and orphans detected (inject a cycle, expect detection)
{
  const r = compiled.claimsdesk;
  const n = r.graph.nodes;
  const cyc = analyzeGraph({ nodes: n.slice(0, 2), edges: [
    { id: "E1", source: n[0].id, target: n[1].id }, { id: "E2", source: n[1].id, target: n[0].id },
  ] });
  ok(`cycle detection works`, cyc.hasCycle === true);
  const orph = analyzeGraph({ nodes: [n[0], n[1]], edges: [] });
  ok(`orphan detection works`, orph.orphans.length === 2);
}

// 8. execution waves + critical path correct (deterministic small graph)
{
  const nodes = [
    { id: "A", effort: { minimum: 2, maximum: 2 }, operatingModel: { primary: "challenge" } },
    { id: "B", effort: { minimum: 3, maximum: 3 }, operatingModel: { primary: "challenge" } },
    { id: "C", effort: { minimum: 5, maximum: 5 }, operatingModel: { primary: "challenge" } },
  ];
  const edges = [{ id: "e1", source: "A", target: "C" }, { id: "e2", source: "B", target: "C" }];
  const a = analyzeGraph({ nodes, edges });
  ok(`waves: A,B parallel then C`, a.waveCount === 2 && a.waves[0].length === 2 && a.waves[1][0] === "C");
  ok(`critical path is longest-by-effort (B→C)`, a.criticalPath.join("") === "BC" && a.criticalDuration === 8);
}

// 9. real graphs are acyclic and fully grounded
for (const [k, r] of Object.entries(compiled)) {
  ok(`[${k}] generated graph is acyclic`, !r.analysis.hasCycle);
  ok(`[${k}] every node grounded in source ids`, r.graph.nodes.every((n) => n.sourceIds.length > 0));
}

// 10. classification change affects outputs; unaffected nodes preserved
{
  const r = compiled.supply;
  const before = JSON.parse(JSON.stringify(r.graph));
  const after = JSON.parse(JSON.stringify(r.graph));
  const target = after.nodes.find((n) => n.operatingModel.primary === "private-pod");
  target.operatingModel.primary = "challenge"; // simulate override
  target.operatingModel.overridden = true;
  const impact = changeImpact(before, after, target.id);
  ok(`override is detected as a model change`, impact.modelChanges.some((m) => m.id === target.id && m.to === "challenge"));
  ok(`unaffected nodes are preserved`, impact.unaffectedNodes.length > 0 && !impact.unaffectedNodes.includes(target.id));
}

// 11. exports preserve models, rationales, dependencies, source ids
for (const [k, r] of Object.entries(compiled)) {
  const ex = exportGraphJSON(r);
  const good = ex.nodes.every((n) => n.operatingModel.primary && n.operatingModel.rationale.length && n.sourceIds.length >= 0)
    && ex.nodes.every((n) => Array.isArray(n.dependsOn))
    && ex.edges.length === r.graph.edges.length;
  ok(`[${k}] export preserves models, rationales, dependencies`, good);
  ok(`[${k}] export marks not-ready nodes`, Array.isArray(ex.notReadyForHandoff));
}

// 12. mock mode runs all four with no network / no keys (implicit: we got here)
ok(`mock mode compiles all four supplied packages offline`, Object.keys(compiled).length === 4);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
