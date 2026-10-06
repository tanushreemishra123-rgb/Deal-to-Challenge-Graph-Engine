import fs from "fs";
import { compile } from "./src/engine/pipeline.js";
import { exportGraphJSON, exportPlanMarkdown } from "./src/engine/exporters.js";
import { buildPackage } from "./src/classify/packages.js";

const files = {
  "claimsdesk-modernization": "test/fixtures/claimsdesk-modernization.json",
  "clinical-intake-and-patient-support-assistant": "test/fixtures/clinical-intake-and-patient-support-assistant.json",
  "member-experience-modernisation-early-discovery": "test/fixtures/member-experience-modernisation-early-discovery.json",
  "unified-supply-chain-analytics": "test/fixtures/unified-supply-chain-analytics.json",
};

fs.mkdirSync("samples", { recursive: true });
const picked = { flexible: null, challenge: null, pod: null };

for (const [name, path] of Object.entries(files)) {
  const raw = JSON.parse(fs.readFileSync(path, "utf8"));
  const r = compile(raw);
  const gj = exportGraphJSON(r);
  fs.writeFileSync(`samples/${name}.graph.json`, JSON.stringify(gj, null, 2));
  fs.writeFileSync(`samples/${name}.plan.md`, exportPlanMarkdown(r));
  fs.writeFileSync(`samples/${name}.quality-gate.json`, JSON.stringify(r.qualityGate, null, 2));
  // grab one package of each model across the deals
  for (const n of r.graph.nodes) {
    const m = n.operatingModel.primary;
    if (m === "flexible-talent" && !picked.flexible) picked.flexible = buildPackage(n, r.canonical);
    if (m === "challenge" && !picked.challenge) picked.challenge = buildPackage(n, r.canonical);
    if (m === "private-pod" && !picked.pod) picked.pod = buildPackage(n, r.canonical);
  }
  console.log(`✓ ${name}: ${r.graph.nodes.length} nodes, gate=${r.qualityGate.status}, maturity=${r.maturity.maturity}`);
}
fs.writeFileSync("samples/example-flexible-talent-package.json", JSON.stringify(picked.flexible, null, 2));
fs.writeFileSync("samples/example-challenge-package.json", JSON.stringify(picked.challenge, null, 2));
fs.writeFileSync("samples/example-private-pod-package.json", JSON.stringify(picked.pod, null, 2));
console.log("✓ sample model packages written (flexible-talent, challenge, private-pod)");
console.log("\nsamples/:", fs.readdirSync("samples").length, "files");
