# Source-to-Canonical Mapping

How the supplied workspace-export packages are normalized into the engine's
canonical execution model. The original package is always preserved verbatim
(`ImportResult.raw`); normalization only *derives* a parallel model.

## Imported sections

| Source path (in the supplied file) | Canonical target | Notes |
|---|---|---|
| `id`, `name`, `customer` | `deal.{id,title,customer}` | Deal header |
| `scope.items[]` (by `kind`) | `scope.*` buckets | See kind map below. **IDs preserved exactly.** |
| `outputs.prd.data.functionalScope` | `functionalScope.*` | capabilities, modules, workstreams, deliveryPackages, outOfScope |
| `outputs.architecture.data` | `architecture.*` | `components[]` (with `requirementIds`), `flows[]`, `environments`, `securityControls`, `platform` |
| `outputs.dataIntegration.data` | `strategy.dataDomains`, `strategy.integrations` | integration `pattern/protocol/auth/direction` retained |
| `outputs.aiStrategy.data` | `strategy.aiUseCases`, `strategy.aiBoundaries` | `boundaries[].type` of `human-decision` → mandatory human-review signal |
| `outputs.estimate.data.result` | `delivery.*` | phases, workstreams, totals, confidence, `missingInputs` |
| `outputs.*.{status,reviewed,staleReasons}` | `outputsMeta.*` | Feeds maturity (unreviewed/stale outputs) |
| `quality.checks[]`, `quality.summary` | `quality.*` | coverage %, findings, export status |

## `scope.items[].kind` → canonical bucket

| kind | bucket | id prefix (observed) |
|---|---|---|
| business, functional, nonFunctional, integration, data, security, technology, constraint, existingSystem, persona | `scope.requirements` | BR_, FR_, NFR_, INT_, DATA_, SEC_, TECH_, CON_, SYS_, PER_ |
| dependency | `scope.dependencies` | DEP_ |
| risk | `scope.risks` | RSK_ |
| gap | `scope.gaps` | GAP_ |
| assumption | `scope.assumptions` | ASM_ |
| question | `scope.questions` | Q_ |

The `type` is retained on every requirement so the classifier and decomposer can
distinguish (e.g.) security vs. data vs. integration requirements.

## Identifier-preservation rules

1. Every `scope.items[].id` is kept **unchanged** and registered in a flat
   `sourceIndex` (`id → {kind, type, bucket, title, critical, …}`) for O(1)
   traceability.
2. Architecture `components[].id`, data `domains[].id`, `integrations[].id`,
   `aiUseCases[].id`, and estimate `workstreams[].id` are likewise preserved and
   indexed.
3. Every generated execution node records the **original** source ids it is
   grounded in (`node.sourceIds`), and every dependency edge keeps a rationale.
   Nothing references a synthetic id in place of a real one.
4. `relatedIds` / `requirementIds` are preserved as-is and validated for dangling
   references (reported, never rewritten).

## Ignored / not-normalized sections

These are intentionally not mapped into the execution model (kept only in the
preserved raw package):

- `disclaimer`, `createdAt`, `updatedAt`, `config`, `estimationConfig`,
  `changeLog`, `executiveSummary`, `input.rawText` / `input.normalized`
  (the raw RFP text and editor metadata).
- `outputs.*.meta` rendering metadata.

They carry no execution-planning signal that isn't already captured by the
normalized fields above. (`input.rawText` remains available in `raw` for audit.)

## Missing-information rule

Fields that are absent are **left absent**. The engine never invents contracts,
security details, estimates, or acceptance conditions. Instead:

- Critical `gap` / `question` items become **blocking discovery nodes**.
- Non-critical open items become **review-required clarification nodes**.
- Integration nodes lacking a `protocol`/`authentication` are marked
  `review-required` (not fabricated).
- Low estimate confidence / `missingInputs` reduce package maturity.

## Compatibility assumptions

- All four supplied files share the same top-level schema (`id, scope, outputs,
  quality, …`); the normalizer keys off that shape.
- Unknown `scope.items[].kind` values are skipped (and would surface via the
  dangling-reference / coverage checks) rather than crashing the import.
- The importer is defensive: any missing section degrades gracefully to an empty
  canonical bucket, and the validator reports the absence.
