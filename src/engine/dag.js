// ============================================================================
// analyzeGraph({ nodes, edges }) → deterministic graph analysis.
//
// Edges are dependencies: source MUST complete before target (source → target).
// All of this is pure, reproducible computation — no AI.
// ============================================================================

const effMin = (n) => n?.effort?.minimum ?? 0;
const effMax = (n) => n?.effort?.maximum ?? n?.effort?.minimum ?? 0;
const effMid = (n) => (effMin(n) + effMax(n)) / 2;

export function analyzeGraph(graph) {
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];
  const byId = new Map(nodes.map((n) => [n.id, n]));

  // ---- edge hygiene ----
  const issues = [];
  const seenEdge = new Set();
  const validEdges = [];
  for (const e of edges) {
    if (e.source === e.target) { issues.push({ code: "self-dependency", message: `Edge ${e.id} is a self-dependency on ${e.source}`, refs: [e.source] }); continue; }
    if (!byId.has(e.source) || !byId.has(e.target)) { issues.push({ code: "invalid-edge", message: `Edge ${e.id} references a missing node`, refs: [e.source, e.target] }); continue; }
    const key = `${e.source}->${e.target}`;
    if (seenEdge.has(key)) { issues.push({ code: "duplicate-edge", message: `Duplicate dependency ${key}`, refs: [e.source, e.target] }); continue; }
    seenEdge.add(key); validEdges.push(e);
  }

  // adjacency
  const out = new Map(nodes.map((n) => [n.id, []]));
  const inc = new Map(nodes.map((n) => [n.id, []]));
  for (const e of validEdges) { out.get(e.source).push(e.target); inc.get(e.target).push(e.source); }

  // ---- cycle detection (DFS colouring) ----
  const colour = new Map(); // 0 unvisited,1 in-stack,2 done
  const cycles = [];
  const stack = [];
  const dfs = (u) => {
    colour.set(u, 1); stack.push(u);
    for (const v of out.get(u)) {
      if (colour.get(v) === 1) { const i = stack.indexOf(v); cycles.push(stack.slice(i).concat(v)); }
      else if (!colour.get(v)) dfs(v);
    }
    stack.pop(); colour.set(u, 2);
  };
  for (const n of nodes) if (!colour.get(n.id)) dfs(n.id);
  const hasCycle = cycles.length > 0;
  if (hasCycle) issues.push({ code: "cycle", message: `Graph contains ${cycles.length} cycle(s)`, refs: cycles[0] });

  // ---- orphans / entry / terminal ----
  const orphans = nodes.filter((n) => out.get(n.id).length === 0 && inc.get(n.id).length === 0).map((n) => n.id);
  const entry = nodes.filter((n) => inc.get(n.id).length === 0).map((n) => n.id);
  const terminal = nodes.filter((n) => out.get(n.id).length === 0).map((n) => n.id);
  if (nodes.length > 1) for (const id of orphans) issues.push({ code: "orphan", message: `Node ${id} has no dependencies in or out`, refs: [id] });

  // ---- execution waves (Kahn topological layering) ----
  let waves = [];
  let topoOk = !hasCycle;
  if (topoOk) {
    const indeg = new Map(nodes.map((n) => [n.id, inc.get(n.id).length]));
    let frontier = nodes.filter((n) => indeg.get(n.id) === 0).map((n) => n.id);
    const placed = new Set();
    while (frontier.length) {
      waves.push(frontier);
      frontier.forEach((id) => placed.add(id));
      const next = [];
      for (const u of frontier) for (const v of out.get(u)) {
        indeg.set(v, indeg.get(v) - 1);
        if (indeg.get(v) === 0 && !placed.has(v)) next.push(v);
      }
      frontier = next;
    }
    if (placed.size !== nodes.length) topoOk = false; // safety
  }

  // ---- critical path (longest path by effort midpoint) on the DAG ----
  let criticalPath = [], criticalDuration = 0;
  if (topoOk && nodes.length) {
    const order = waves.flat();
    const dist = new Map(nodes.map((n) => [n.id, effMid(byId.get(n.id))]));
    const prev = new Map();
    for (const u of order) for (const v of out.get(u)) {
      const cand = dist.get(u) + effMid(byId.get(v));
      if (cand > dist.get(v)) { dist.set(v, cand); prev.set(v, u); }
    }
    let end = null;
    for (const [id, d] of dist) if (end === null || d > dist.get(end)) end = id;
    criticalDuration = Math.round(dist.get(end) || 0);
    const path = []; let cur = end;
    while (cur != null) { path.unshift(cur); cur = prev.get(cur); }
    criticalPath = path;
  }

  // ---- effort aggregation + operating-model distribution ----
  const totalEffortMin = nodes.reduce((a, n) => a + effMin(n), 0);
  const totalEffortMax = nodes.reduce((a, n) => a + effMax(n), 0);
  const dist = { "flexible-talent": 0, "challenge": 0, "private-pod": 0, unclassified: 0 };
  for (const n of nodes) { const m = n.operatingModel?.primary; dist[m in dist ? m : "unclassified"]++; }

  const waveSummary = waves.map((w, i) => {
    const d = { wave: i + 1, nodes: w.length, "flexible-talent": 0, "challenge": 0, "private-pod": 0,
                effortMin: 0, effortMax: 0 };
    for (const id of w) {
      const n = byId.get(id);
      const m = n.operatingModel?.primary; if (m in d) d[m]++;
      d.effortMin += effMin(n); d.effortMax += effMax(n);
    }
    return d;
  });

  const blocked = nodes.filter((n) => n.readiness === "blocked" || n.blocked).map((n) => n.id);

  return {
    counts: { nodes: nodes.length, edges: validEdges.length },
    hasCycle, cycles, orphans, entry, terminal, blocked,
    waves, waveCount: waves.length, waveSummary,
    criticalPath, criticalDuration,
    totalEffortMin, totalEffortMax,
    operatingModelDistribution: dist,
    parallelism: waves.length ? Math.max(...waves.map((w) => w.length)) : 0,
    issues,
    ready: !hasCycle && issues.filter((i) => i.code === "cycle" || i.code === "invalid-edge").length === 0,
  };
}
