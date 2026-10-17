# WF-002: efficient SDD delivery

Status: Done for instruction implementation and scoped verification; not owner acceptance. Source: owner's 16 Oct request to save tokens, activate SDD,
and translate informal/vibe requirements automatically within the Scrum/BDD/TDD team.
Scope: repository instructions and skills; existing product code and uncommitted
balance work remain outside this change. Owner is Product Owner; lead owns these files.

## Requirements and acceptance

| ID | Required outcome | BDD example and verification |
|---|---|---|
| R1 | Load short core guidance and task-relevant context; preserve detailed contracts. | A1: Given a fresh session, when starting a docs task, then it can follow the core/skill without loading game or delivery history. Measure core/entry sizes and verify reference routing and preservation. |
| R2 | Translate informal requests into one concise SDD contract before implementation. | A2: Given “make it cleaner and easier on phones”, when intake runs, then it records the source intent, observable examples, assumptions, scope and checks without inventing content, mechanics or arbitrary performance targets. Evaluate a realistic intake. |
| R3 | Preserve product authority and make uncertainty explicit. | A3: Given an unspecified reward or personal claim, when drafting the contract, then the decision remains an open question; dependent work waits, independent work proceeds. Routine reversible choices need no extra approval. |
| R4 | Link SDD requirements to BDD examples, TDD checks and the final source. | A4: Given a behavior change or follow-up, when implementing, then requirement → example → test/observation → code evidence is current, with genuine Red/Green or an honest alternative; review covers drift and affected deltas. |
| R5 | Keep the full senior Scrum capabilities available at proportionate cost. | A5: Given a small task, when staffing, then the lead covers roles without launching a team; independent work/review uses bounded context, one writer per file and no recursive teams. Preserve native frontmatter/model/permission settings. |
| R6 | Keep delivery truthful and avoid repeated paperwork/checks. | A6: Given completed work, when reporting, then one contract owns evidence/next action, other records link to it, required checks remain and unrelated suites are not rerun. Structural/link checks and independent workflow exercise; no runtime claim from instruction tests. |

## Decisions

SDD means specification-driven development and is active now. Existing accepted
schema, tests and rule docs are reused as contracts; no parallel game spec or
framework is introduced. Tiny work uses an inline backlog contract; multi-file,
behavioral or resumable work uses one specs/<story-id>-<slug>.md. Drafting a contract
executes the requested workflow and does not grant product/publication authority.
The translator is implemented in the native /scrum skill's instructions, invoked
for ordinary development language; no separate user command or parser is required.

## Evidence and next action

- A1/R1: core reduced from 1,571 to 523 words (66.7% smaller);
  workflow 970 words, entry skill 186. Word counts measure context size,
  not billed tokens. Every technical byte from the prior AGENTS “What this is”
  onward remains intact in PROJECT_RULES.md; affected-reference lookup replaces
  mandatory whole-file reads. Other pre-existing product files are hash-preserved.
- A2/A3/R2/R3: one independent bounded-context reviewer produced two real intake
  artifacts: phone profile cleanup and vague battle/rewards changes. The former
  proceeds with reversible assumptions/preserved information; the latter keeps
  material product decisions pending one bundled question and continues independent
  characterization. Artifacts: Windows Temp `scrum-forward-intake-20261016-7dr93y_u`.
- A4–A6/R4–R6: spec/example/check/source mapping, superseding follow-ups, required
  checks, ownership and no recursive teams are covered by instruction review.
  Local links, YAML/skill validation, settings and all nine native role frontmatters
  pass; model/tool grants are unchanged. Reviewer findings on redundant UX approval
  wording and cross-project terminology were fixed and independently re-inspected.
- Source and reproducible structural evidence: Windows Temp `scrum-sdd-20261016-pmu8075_`.
  Installed CLI version observed: Claude Code2.1.300. Native automatic routing,
  live Claude-team execution, billed token savings and app/browser checks were
  not measured here. Instruction exercises are not runtime product verification.

No product implementation, dependency, migration or owner-service change was made.
Earlier ChessPlusPlus balance test evidence remains scoped to that source; no
unchanged gameplay suites/builds were rerun for this instruction-only task.
The owner authorized commit and push on 17 Oct. Git identifies the publication
commit; actual Actions runs establish build/deployment status. Future tasks use
the new intake automatically, keep one contract and inspect actual context cost/quality.
