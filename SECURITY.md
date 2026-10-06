# Security notes (SAST / CVE / secrets triage)

Scanned with OpenGrep/Semgrep and Trivy (vuln + secret + misconfig). Summary of
findings and their disposition.

## Clean by construction

- **Secrets:** none. No hardcoded credentials anywhere in source. No AWS keys,
  GitHub/Slack tokens, JWTs, or PEM private keys. The words "password" /
  "secrets" / "API keys" appear only inside the **challenge-supplied input
  packages** (`public/inputs/*.json`, `test/fixtures/*.json`) as the deals'
  *security requirement text* (e.g. "secrets and credential management so API
  keys are never stored in code") — this is data to be analysed, not a credential.
- **Misconfiguration (IaC):** none. The project contains no Dockerfile,
  Kubernetes manifests, or Terraform — there is no infrastructure-as-code surface.
- **Dependency CVEs:** the dependency tree is minimal and pinned to exact
  versions (`react`, `react-dom`, `vite`, `@vitejs/plugin-react`), with a
  committed `package-lock.json`. No `^` ranges.
- **Dangerous sinks:** no `eval`, `new Function`, `child_process`,
  `innerHTML`, or `dangerouslySetInnerHTML`. No network calls in the default
  offline flow; no browser storage.

## Reviewed and accepted (false positives)

- **`detect-object-injection` / `unsafe-dynamic-method` (CWE-94, LOW).** A small
  number of bracket/dynamic lookups use **developer-controlled keys from closed
  internal sets** — a `kind`, a work category, an operating-model name, a status
  string, or a numeric index (e.g. `KIND_MAP[kind]`, `MODEL_COLOR[model]`,
  `scores[model]`). No end-user string is ever used as an object key; there is no
  prototype write and no code-execution sink. This rule is well known for high
  false-positive rates on legitimate table-dispatch code.
- **`jsx-not-internationalized` (INFO).** The app is intentionally English-only;
  i18n is out of scope.
- **`missing-template-string-indicator` (INFO)** in `src/ui/styles.js`. The
  flagged `{…}` sequences are literal CSS rule blocks inside a template string,
  not missing interpolations. Behaviour is correct.

## Notes

- The two large input-package JSON files are committed intentionally: the test
  suite imports them, and the app bundles them for one-click loading. They are
  the challenge's official inputs; evaluators also upload the originals directly.
- The application is a planning aid only — it performs no deployment, no external
  API calls, and no credential handling.
