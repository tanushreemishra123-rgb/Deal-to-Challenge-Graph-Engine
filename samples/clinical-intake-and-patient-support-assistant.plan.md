# Execution Plan — Clinical Intake and Patient Support Assistant

- **Deal id:** 12de4070-50bc-448e-888d-061c62073dcc
- **Package maturity:** review-required (score 36)
- **Quality gate:** review-required (10 pass / 2 warn / 0 fail)
- **Nodes:** 21 · **Edges:** 30 · **Effort:** 92–181 person-days
- **Operating models:** Flexible Talent 11 · Challenge 1 · Private Pod 9

## Maturity reasoning
- 2 critical item(s) require resolution or a blocking discovery node.
- 5 design output(s) have not been human-reviewed.
- 2 non-critical open question(s) should be tracked.
- Estimate is missing 1 input(s).

## Execution waves
- **Wave 1** — 15 node(s); FT 10 / CH 1 / PP 4; 54–113 pd
- **Wave 2** — 4 node(s); FT 0 / CH 0 / PP 4; 31–54 pd
- **Wave 3** — 1 node(s); FT 1 / CH 0 / PP 0; 4–8 pd
- **Wave 4** — 1 node(s); FT 0 / CH 0 / PP 1; 3–6 pd

## Critical path (35 person-days)
NODE_013 → NODE_019 → NODE_020 → NODE_021

## Nodes
### NODE_001 — Resolve: Epic sandbox write capability unconfirmed  `flexible-talent` (high)
- **Category:** discovery · **Readiness:** ready · **Effort:** 2–5 person-days
- **Grounded in:** GAP_01, INT_01, Q_01
- **Why this model:** The work is a focused task for one specialist with known skills. A focused technical assessment fits a single specialist. One clearly-defined role is required. Small, self-contained effort that can be directly managed.

### NODE_002 — Resolve: Assistant deployment form undecided  `flexible-talent` (high)
- **Category:** discovery · **Readiness:** ready · **Effort:** 1–3 person-days
- **Grounded in:** GAP_02, Q_02
- **Why this model:** The work is a focused task for one specialist with known skills. A focused technical assessment fits a single specialist. One clearly-defined role is required. Small, self-contained effort that can be directly managed.

### NODE_003 — Resolve: Target phase for the CareEverywhere integration not set  `flexible-talent` (high)
- **Category:** discovery · **Readiness:** ready · **Effort:** 1–3 person-days
- **Grounded in:** GAP_03, INT_05, Q_03
- **Why this model:** The work is a focused task for one specialist with known skills. A focused technical assessment fits a single specialist. One clearly-defined role is required. Small, self-contained effort that can be directly managed.

### NODE_004 — Resolve: Does the Epic FHIR R4 sandbox support writing referral data?  `flexible-talent` (high)
- **Category:** discovery · **Readiness:** ready · **Effort:** 2–5 person-days
- **Grounded in:** Q_01, GAP_01
- **Why this model:** The work is a focused task for one specialist with known skills. A focused technical assessment fits a single specialist. One clearly-defined role is required. Small, self-contained effort that can be directly managed.

### NODE_005 — Resolve: Should the assistant be standalone or embedded in the portal?  `flexible-talent` (high)
- **Category:** discovery · **Readiness:** ready · **Effort:** 1–3 person-days
- **Grounded in:** Q_02, GAP_02
- **Why this model:** The work is a focused task for one specialist with known skills. A focused technical assessment fits a single specialist. One clearly-defined role is required. Small, self-contained effort that can be directly managed.

### NODE_006 — Resolve: Confirm the target phase for the CareEverywhere integration  `flexible-talent` (high)
- **Category:** discovery · **Readiness:** ready · **Effort:** 1–3 person-days
- **Grounded in:** Q_03, GAP_03
- **Why this model:** The work is a focused task for one specialist with known skills. A focused technical assessment fits a single specialist. One clearly-defined role is required. Small, self-contained effort that can be directly managed.

### NODE_007 — Integrate Epic FHIR R4 write and read integration  `flexible-talent` (high)
- **Category:** integration · **Readiness:** ready · **Effort:** 4–8 person-days
- **Grounded in:** IF_01
- **Why this model:** The work is a focused task for one specialist with known skills. One clearly-defined role is required. Small, self-contained effort that can be directly managed.

### NODE_008 — Integrate Inbound document channel integration  `flexible-talent` (high)
- **Category:** integration · **Readiness:** ready · **Effort:** 4–8 person-days
- **Grounded in:** IF_02
- **Why this model:** The work is a focused task for one specialist with known skills. One clearly-defined role is required. Small, self-contained effort that can be directly managed.

### NODE_009 — Integrate Five9 handoff integration  `flexible-talent` (high)
- **Category:** integration · **Readiness:** ready · **Effort:** 4–8 person-days
- **Grounded in:** IF_03
- **Why this model:** The work is a focused task for one specialist with known skills. One clearly-defined role is required. Small, self-contained effort that can be directly managed.

### NODE_010 — Integrate Patient-portal authentication reuse  `flexible-talent` (high)
- **Category:** integration · **Readiness:** ready · **Effort:** 4–8 person-days
- **Grounded in:** IF_04
- **Why this model:** The work is a focused task for one specialist with known skills. One clearly-defined role is required. Small, self-contained effort that can be directly managed.

### NODE_011 — Build AI capability: Retrieval-augmented generation (RAG) assistant: Patient-support assistant Q&A and 3 related functions  `private-pod` (high)
- **Category:** ai-implementation · **Readiness:** review-required · **Effort:** 6–12 person-days
- **Grounded in:** AIUC_01, BR_04, FR_05, FR_06, FR_07, FR_09, NFR_03, NFR_05, NFR_06, INT_03, INT_04, DATA_02, DATA_03, DATA_05, SEC_06, TECH_01, TECH_02, CON_01, CON_02, SYS_05, PER_02, RSK_02, GAP_02, ASM_02, Q_02
- **Why this model:** The components are strongly coupled and must be built together. Regulated requirements need sustained delivery ownership.

### NODE_012 — Build AI capability: Document extraction pipeline with human validation: Structured field extraction and 1 related function  `private-pod` (high)
- **Category:** ai-implementation · **Readiness:** review-required · **Effort:** 6–12 person-days
- **Grounded in:** AIUC_02, FR_02, FR_10, NFR_02, NFR_05, TECH_02, CON_03, RSK_01
- **Why this model:** The components are strongly coupled and must be built together. Regulated requirements need sustained delivery ownership.

### NODE_013 — Data platform & migration  `private-pod` (high)
- **Category:** data-engineering · **Readiness:** ready · **Effort:** 8–15 person-days
- **Grounded in:** DATA_01, DATA_02, DATA_03, DATA_04, DATA_05, DD_01, DD_02, DD_03, DD_04, DD_05
- **Why this model:** The components are strongly coupled and must be built together. Restricted/sensitive data requires a controlled, vetted team. Regulated requirements need sustained delivery ownership.

### NODE_014 — Security & compliance controls  `private-pod` (high)
- **Category:** security · **Readiness:** ready · **Effort:** 5–10 person-days
- **Grounded in:** SEC_01, SEC_02, SEC_03, SEC_04, SEC_05, SEC_06
- **Why this model:** Restricted/sensitive data requires a controlled, vetted team. Regulated requirements need sustained delivery ownership. Security-critical, coupled work benefits from a dedicated pod.

### NODE_015 — Explore the user experience  `challenge` (high)
- **Category:** ux-design · **Readiness:** ready · **Effort:** 5–10 person-days
- **Grounded in:** PER_01, PER_02, FR_01, FR_02, FR_03, FR_04
- **Why this model:** Multiple approaches or perspectives would add value. The scope is bounded and can be evaluated against clear criteria. The work can be packaged and delivered independently. Design exploration is well suited to competitive delivery.

### NODE_016 — Build user-apps  `private-pod` (high)
- **Category:** solution-delivery · **Readiness:** review-required · **Effort:** 7–12 person-days
- **Grounded in:** ARC_01, NFR_06
- **Why this model:** The work needs continuous technical coordination across roles. Regulated requirements need sustained delivery ownership. Multiple technical roles must work together.
- **Depends on:** NODE_015, NODE_013, NODE_014

### NODE_017 — Build api  `private-pod` (low)
- **Category:** backend-api · **Readiness:** review-required · **Effort:** 8–14 person-days
- **Grounded in:** ARC_02, ARC_15, NFR_01, NFR_06, SEC_03, INT_01
- **Why this model:** Regulated requirements need sustained delivery ownership. Confidence is low — review the alternative model(s) before committing.
- **Alternatives:** challenge
- **Depends on:** NODE_001, NODE_015, NODE_013, NODE_014

### NODE_018 — Build backend  `private-pod` (high)
- **Category:** solution-delivery · **Readiness:** review-required · **Effort:** 7–12 person-days
- **Grounded in:** ARC_03, NFR_01, NFR_06
- **Why this model:** The work needs continuous technical coordination across roles. Regulated requirements need sustained delivery ownership. Multiple technical roles must work together.
- **Depends on:** NODE_015, NODE_013, NODE_014

### NODE_019 — Build data-storage  `private-pod` (high)
- **Category:** data-engineering · **Readiness:** review-required · **Effort:** 9–16 person-days
- **Grounded in:** ARC_04, ARC_18, ARC_24, NFR_01, NFR_06, SEC_02, BR_01, BR_03, FR_01, FR_02, FR_03, FR_04
- **Why this model:** The work needs continuous technical coordination across roles. The components are strongly coupled and must be built together. Regulated requirements need sustained delivery ownership.
- **Depends on:** NODE_013, NODE_014

### NODE_020 — Independent testing & quality  `flexible-talent` (medium)
- **Category:** testing · **Readiness:** ready · **Effort:** 4–8 person-days
- **Grounded in:** NFR_01, NFR_02, NFR_03, NFR_04, NFR_05, NFR_06
- **Why this model:** The work is a focused task for one specialist with known skills. One clearly-defined role is required. Small, self-contained effort that can be directly managed.
- **Alternatives:** challenge
- **Depends on:** NODE_016, NODE_017, NODE_018, NODE_019, NODE_007, NODE_008, NODE_009, NODE_010, NODE_011, NODE_012, NODE_013, NODE_014, NODE_002, NODE_003, NODE_004, NODE_005, NODE_006

### NODE_021 — Deployment & cutover  `private-pod` (high)
- **Category:** deployment · **Readiness:** review-required · **Effort:** 3–6 person-days
- **Grounded in:** CON_01, CON_02, CON_03, CON_04
- **Why this model:** The work needs continuous technical coordination across roles. Regulated requirements need sustained delivery ownership. Multiple technical roles must work together.
- **Depends on:** NODE_020

## Not ready for operational handoff
- NODE_011 (review-required)
- NODE_012 (review-required)
- NODE_016 (review-required)
- NODE_017 (review-required)
- NODE_018 (review-required)
- NODE_019 (review-required)
- NODE_021 (review-required)