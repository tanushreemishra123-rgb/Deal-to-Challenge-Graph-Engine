// Assembles the execution graph from a canonical model and runs deterministic
// analysis. Keeps dependsOn in sync on each node from the edge list.
import { decompose } from "../classify/decompose.js";
import { analyzeGraph } from "./dag.js";

export function buildGraph(canonical) {
  const { nodes, edges } = decompose(canonical);

  // sync dependsOn from edges
  const incoming = new Map(nodes.map((n) => [n.id, []]));
  for (const e of edges) if (incoming.has(e.target)) incoming.get(e.target).push(e.source);
  for (const n of nodes) n.dependsOn = incoming.get(n.id);

  const summary = { "flexibleTalent": 0, "challenge": 0, "privatePod": 0 };
  for (const n of nodes) {
    const m = n.operatingModel?.primary;
    if (m === "flexible-talent") summary.flexibleTalent++;
    else if (m === "challenge") summary.challenge++;
    else if (m === "private-pod") summary.privatePod++;
  }

  const graph = {
    graphId: `GRAPH_${(canonical.deal.id || "X").slice(0, 8)}`,
    dealId: canonical.deal.id,
    dealTitle: canonical.deal.title,
    nodes, edges,
    operatingModelSummary: summary,
  };

  const analysis = analyzeGraph(graph);
  return { graph, analysis };
}
