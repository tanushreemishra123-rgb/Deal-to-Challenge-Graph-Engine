// Import orchestrator. Keeps the original package untouched (for audit /
// comparison) and returns it alongside the normalized canonical model and the
// deterministic validation result.
import { normalize } from "./normalize.js";
import { validate } from "./validate.js";

export function importPackage(raw) {
  const canonical = normalize(raw);
  const validation = validate(raw, canonical);
  return {
    raw,                 // preserved verbatim — never mutated
    canonical,           // normalized execution model
    validation,          // { ok, issues[], stats }
    importedAt: new Date().toISOString(),
  };
}
