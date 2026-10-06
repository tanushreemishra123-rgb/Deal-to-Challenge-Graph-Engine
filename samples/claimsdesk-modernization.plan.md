# Execution Plan — ClaimsDesk Modernization

- **Deal id:** 74481f79-8922-4630-9f95-bb9be76a47d1
- **Package maturity:** review-required (score 36)
- **Quality gate:** review-required (10 pass / 2 warn / 0 fail)
- **Nodes:** 24 · **Edges:** 33 · **Effort:** 103–204 person-days
- **Operating models:** Flexible Talent 15 · Challenge 1 · Private Pod 8

## Maturity reasoning
- 2 critical item(s) require resolution or a blocking discovery node.
- 5 design output(s) have not been human-reviewed.
- 2 non-critical open question(s) should be tracked.
- Estimate is missing 1 input(s).

## Execution waves
- **Wave 1** — 18 node(s); FT 14 / CH 1 / PP 3; 61–128 pd
- **Wave 2** — 4 node(s); FT 0 / CH 0 / PP 4; 35–62 pd
- **Wave 3** — 1 node(s); FT 1 / CH 0 / PP 0; 4–8 pd
- **Wave 4** — 1 node(s); FT 0 / CH 0 / PP 1; 3–6 pd

## Critical path (41 person-days)
NODE_016 → NODE_022 → NODE_023 → NODE_024

## Nodes
### NODE_001 — Resolve: SAP S/4HANA integration pattern unconfirmed  `flexible-talent` (high)
- **Category:** discovery · **Readiness:** ready · **Effort:** 2–5 person-days
- **Grounded in:** GAP_01, INT_02, Q_01
- **Why this model:** The work is a focused task for one specialist with known skills. A focused technical assessment fits a single specialist. One clearly-defined role is required. Small, self-contained effort that can be directly managed.

### NODE_002 — Resolve: Policyholder status tracker phase undecided  `flexible-talent` (high)
- **Category:** discovery · **Readiness:** ready · **Effort:** 1–3 person-days
- **Grounded in:** GAP_02, FR_05, Q_02
- **Why this model:** The work is a focused task for one specialist with known skills. A focused technical assessment fits a single specialist. One clearly-defined role is required. Small, self-contained effort that can be directly managed.

### NODE_003 — Resolve: Specific agent accessibility requirements unspecified  `flexible-talent` (high)
- **Category:** discovery · **Readiness:** ready · **Effort:** 1–3 person-days
- **Grounded in:** GAP_03
- **Why this model:** The work is a focused task for one specialist with known skills. A focused technical assessment fits a single specialist. One clearly-defined role is required. Small, self-contained effort that can be directly managed.

### NODE_004 — Resolve: Hyland OnBase future-consolidation scope unclear  `flexible-talent` (high)
- **Category:** discovery · **Readiness:** ready · **Effort:** 1–3 person-days
- **Grounded in:** GAP_04, DEP_01, Q_03
- **Why this model:** The work is a focused task for one specialist with known skills. A focused technical assessment fits a single specialist. One clearly-defined role is required. Small, self-contained effort that can be directly managed.

### NODE_005 — Resolve: Does SAP S/4HANA expose a REST API for journal posting?  `flexible-talent` (high)
- **Category:** discovery · **Readiness:** ready · **Effort:** 2–5 person-days
- **Grounded in:** Q_01, GAP_01, INT_02
- **Why this model:** The work is a focused task for one specialist with known skills. A focused technical assessment fits a single specialist. One clearly-defined role is required. Small, self-contained effort that can be directly managed.

### NODE_006 — Resolve: Will the policyholder status tracker ship in the initial release?  `flexible-talent` (high)
- **Category:** discovery · **Readiness:** ready · **Effort:** 1–3 person-days
- **Grounded in:** Q_02, GAP_02, FR_05
- **Why this model:** The work is a focused task for one specialist with known skills. A focused technical assessment fits a single specialist. One clearly-defined role is required. Small, self-contained effort that can be directly managed.

### NODE_007 — Resolve: Should the portal eventually replace Hyland OnBase?  `flexible-talent` (high)
- **Category:** discovery · **Readiness:** ready · **Effort:** 1–3 person-days
- **Grounded in:** Q_03, DEP_01, GAP_04
- **Why this model:** The work is a focused task for one specialist with known skills. A focused technical assessment fits a single specialist. One clearly-defined role is required. Small, self-contained effort that can be directly managed.

### NODE_008 — Integrate Guidewire ClaimCenter integration  `flexible-talent` (high)
- **Category:** integration · **Readiness:** ready · **Effort:** 4–8 person-days
- **Grounded in:** IF_01
- **Why this model:** The work is a focused task for one specialist with known skills. One clearly-defined role is required. Small, self-contained effort that can be directly managed.

### NODE_009 — Integrate SAP S/4HANA payment-posting integration  `flexible-talent` (high)
- **Category:** integration · **Readiness:** ready · **Effort:** 4–8 person-days
- **Grounded in:** IF_02
- **Why this model:** The work is a focused task for one specialist with known skills. One clearly-defined role is required. Small, self-contained effort that can be directly managed.

### NODE_010 — Integrate Okta SSO federation  `flexible-talent` (high)
- **Category:** integration · **Readiness:** ready · **Effort:** 4–8 person-days
- **Grounded in:** IF_03
- **Why this model:** The work is a focused task for one specialist with known skills. One clearly-defined role is required. Small, self-contained effort that can be directly managed.

### NODE_011 — Integrate Agent-facing claim-submission API  `flexible-talent` (high)
- **Category:** integration · **Readiness:** ready · **Effort:** 4–8 person-days
- **Grounded in:** IF_04
- **Why this model:** The work is a focused task for one specialist with known skills. One clearly-defined role is required. Small, self-contained effort that can be directly managed.

### NODE_012 — Integrate Twilio SMS/email claim notifications  `flexible-talent` (high)
- **Category:** integration · **Readiness:** ready · **Effort:** 4–8 person-days
- **Grounded in:** IF_05
- **Why this model:** The work is a focused task for one specialist with known skills. One clearly-defined role is required. Small, self-contained effort that can be directly managed.

### NODE_013 — Integrate Hyland OnBase document-imaging integration  `flexible-talent` (high)
- **Category:** integration · **Readiness:** ready · **Effort:** 4–8 person-days
- **Grounded in:** IF_06
- **Why this model:** The work is a focused task for one specialist with known skills. One clearly-defined role is required. Small, self-contained effort that can be directly managed.

### NODE_014 — Integrate Legacy ClaimsDesk Portal (parallel-run cutover)  `flexible-talent` (high)
- **Category:** integration · **Readiness:** ready · **Effort:** 4–8 person-days
- **Grounded in:** IF_07
- **Why this model:** The work is a focused task for one specialist with known skills. One clearly-defined role is required. Small, self-contained effort that can be directly managed.

### NODE_015 — Build AI capability: Advisory reserve-range suggestion for examiners  `private-pod` (low)
- **Category:** ai-implementation · **Readiness:** review-required · **Effort:** 6–12 person-days
- **Grounded in:** AIUC_01, FR_10
- **Why this model:** Regulated requirements need sustained delivery ownership. Confidence is low — review the alternative model(s) before committing.
- **Alternatives:** challenge

### NODE_016 — Data platform & migration  `private-pod` (high)
- **Category:** data-engineering · **Readiness:** ready · **Effort:** 8–15 person-days
- **Grounded in:** DATA_01, DATA_02, DATA_03, DATA_04, DATA_05, DD_01, DD_02, DD_03, DD_04, DD_05
- **Why this model:** The components are strongly coupled and must be built together. Restricted/sensitive data requires a controlled, vetted team. Regulated requirements need sustained delivery ownership.

### NODE_017 — Security & compliance controls  `private-pod` (high)
- **Category:** security · **Readiness:** ready · **Effort:** 5–10 person-days
- **Grounded in:** SEC_01, SEC_02, SEC_03, SEC_04, SEC_05, SEC_06
- **Why this model:** Restricted/sensitive data requires a controlled, vetted team. Regulated requirements need sustained delivery ownership. Security-critical, coupled work benefits from a dedicated pod.

### NODE_018 — Explore the user experience  `challenge` (high)
- **Category:** ux-design · **Readiness:** ready · **Effort:** 5–10 person-days
- **Grounded in:** PER_01, PER_02, PER_03, PER_04, FR_01, FR_02, FR_03, FR_04
- **Why this model:** Multiple approaches or perspectives would add value. The scope is bounded and can be evaluated against clear criteria. The work can be packaged and delivered independently. Design exploration is well suited to competitive delivery.

### NODE_019 — Build user-apps  `private-pod` (high)
- **Category:** solution-delivery · **Readiness:** review-required · **Effort:** 7–12 person-days
- **Grounded in:** ARC_01, NFR_02, NFR_05
- **Why this model:** The work needs continuous technical coordination across roles. Regulated requirements need sustained delivery ownership. Multiple technical roles must work together.
- **Depends on:** NODE_018, NODE_016, NODE_017

### NODE_020 — Build api  `private-pod` (high)
- **Category:** backend-api · **Readiness:** review-required · **Effort:** 8–14 person-days
- **Grounded in:** ARC_02, ARC_15, NFR_02, NFR_03, NFR_06, SEC_03, INT_01, INT_02, INT_03, INT_04, INT_05
- **Why this model:** The components are strongly coupled and must be built together. Regulated requirements need sustained delivery ownership.
- **Depends on:** NODE_001, NODE_005, NODE_018, NODE_016, NODE_017

### NODE_021 — Build backend  `private-pod` (high)
- **Category:** solution-delivery · **Readiness:** review-required · **Effort:** 7–12 person-days
- **Grounded in:** ARC_03, NFR_02, NFR_03, NFR_06
- **Why this model:** The work needs continuous technical coordination across roles. Regulated requirements need sustained delivery ownership. Multiple technical roles must work together.
- **Depends on:** NODE_018, NODE_016, NODE_017

### NODE_022 — Build data-storage  `private-pod` (high)
- **Category:** data-engineering · **Readiness:** review-required · **Effort:** 13–24 person-days
- **Grounded in:** ARC_04, ARC_19, ARC_20, ARC_21, ARC_22, ARC_27, ARC_28, NFR_02, NFR_03, NFR_06, SEC_02, FR_02
- **Why this model:** The work needs continuous technical coordination across roles. The components are strongly coupled and must be built together. Regulated requirements need sustained delivery ownership.
- **Depends on:** NODE_016, NODE_017

### NODE_023 — Independent testing & quality  `flexible-talent` (medium)
- **Category:** testing · **Readiness:** ready · **Effort:** 4–8 person-days
- **Grounded in:** NFR_01, NFR_02, NFR_03, NFR_04, NFR_05, NFR_06
- **Why this model:** The work is a focused task for one specialist with known skills. One clearly-defined role is required. Small, self-contained effort that can be directly managed.
- **Alternatives:** challenge
- **Depends on:** NODE_019, NODE_020, NODE_021, NODE_022, NODE_008, NODE_009, NODE_010, NODE_011, NODE_012, NODE_013, NODE_014, NODE_015, NODE_016, NODE_017, NODE_002, NODE_003, NODE_004, NODE_006, NODE_007

### NODE_024 — Deployment & cutover  `private-pod` (high)
- **Category:** deployment · **Readiness:** review-required · **Effort:** 3–6 person-days
- **Grounded in:** CON_01, CON_02, CON_03, CON_04
- **Why this model:** The work needs continuous technical coordination across roles. Regulated requirements need sustained delivery ownership. Multiple technical roles must work together.
- **Depends on:** NODE_023

## Not ready for operational handoff
- NODE_015 (review-required)
- NODE_019 (review-required)
- NODE_020 (review-required)
- NODE_021 (review-required)
- NODE_022 (review-required)
- NODE_024 (review-required)