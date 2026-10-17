# Scrum backlog

Updated 16 Oct 2026. The human owner orders this backlog and owns product/content
decisions. [SCRUM_WORKFLOW.md](SCRUM_WORKFLOW.md) defines the process;
[AGENTS.md](AGENTS.md) and existing guides retain technical facts and constraints.
Current contracts own outcomes/evidence; this backlog keeps ordering and short links.

## Current work

**WF-002 — Efficient SDD delivery: Done for scoped implementation/checks; unscheduled.** The owner requested
cheaper context loading and automatic informal-request → SDD → BDD → TDD delivery.
[Contract, acceptance and evidence](specs/WF-002-efficient-sdd.md) are canonical.
All existing dirty product work is preserved. Read this contract and affected
source; consult completed entries below only for a concrete historical question.
SDD is active now; earlier “optional/future SDD” entries describe their dated state.

## Product Goal

Proposed for confirmation at first planning: maintain a clear, accessible and
reliable personal profile and website with consistent content and verifiable
visitor journeys. This proposal assigns no new features or publication.

## Current Sprint

No Sprint dates, cadence or Sprint Goal have been agreed. This setup is
unscheduled work, not a completed Sprint. At first planning agree dates and a
goal, then select achievable work with verification capacity. Two weeks is a
suggestion, not a scheduled commitment.

## Ordered work

### WF-001 — Adapt the ChessPlusPlus senior Scrum workflow

- **Source/outcome:** owner's 15 Oct request and scope clarification: adapt
  Ruinan-Ding using ChessPlusPlus as reference, with a full senior Scrum team,
  TDD/BDD and possible SDD later.
- **Scope:** nine project role profiles, native team settings, `/scrum`, shared
  goals/events/ownership, BDD/TDD, review, Definition of Done and delivery evidence.
  Adapt content/asset work to this repository's static site and mirrored profile.
- **Owner/paths:** implementing session owns workflow files, AGENTS.md and the
  development README; existing content-sync and public content are reference-only.
- **Status:** Done for workflow configuration and documentation. Native discovery
  and structural checks pass; no live-team delivery trial is claimed.
- **Source:** base HEAD `5dbdf08`; initially clean working tree. After setup
  verification, the owner authorized commit, push and merge. The changes are on
  main; delivery follows the required pull-with-rebase and push sequence.
- **Dependencies:** project role/skill discovery in Claude Code; native teamwork
  requires an interactive session and permitted delegation. Ponytail remains the
  existing user-scoped prerequisite; this setup does not install it elsewhere.

| Example | Given / When / Then | Verification |
|---|---|---|
| WF-001-A | Given a fresh project Claude session, when Scrum work is requested, then the skill and nine relevant role profiles are discoverable with inherited models and the existing permission rules. | Native discovery where available; YAML/JSON, links and skill checks. |
| WF-001-B | Given a behavior story, when refined and implemented, then product/development/quality agree examples and record meaningful Red/Green/Refactor evidence. | Instruction walkthrough and acceptance mapping; no false claim of a live TDD trial. |
| WF-001-C | Given visible content or images, when edited, then the team follows content-sync, GitHub rendering and the four-width built-page checks, including relevant motion/failure states. | Workflow/profile cross-check against AGENTS.md and content-sync. |
| WF-001-D | Given dirty files or parallel work, when delegated, then workers preserve the actual source and one writer owns each file; a non-author reviews the integrated delta when available. | Ownership/review task-packet walkthrough with unavailable-review limits. |
| WF-001-E | Given a docs-only edit, interrupted session or future SDD request, when work resumes, then checks are proportional, status is truthful and optional SDD adds no speculative framework. | Format/link checks and scenario walkthrough. |
| WF-001-F | Given technical Done, when preparing delivery, then no commit/push occurs unless asked, authorized pushes use Windows git and rebase first, and port 4200 stays untouched. | Instruction and settings review against existing owner rules. |

**Verification, 15 Oct 2026:**

- Windows Claude Code 2.1.285, started in this repo: `/context` reports nine
  project custom agents; `/skills` lists project `scrum` and `content-sync`.
  Only local discovery commands were used; the inspection session was closed.
- `python3 /home/druin/.codex/skills/.system/skill-creator/scripts/quick_validate.py
  .claude/skills/scrum` passes. YAML/JSON checks confirm nine unique role names,
  inherited models, advisory tool lists and the minimal native team settings.
  All 28 local Markdown links resolve; new instruction files use LF.
- Existing application checks pass from `ruinan-ding/`: `npm test` (13/13) and
  `npm run build -- --configuration production --base-href /`. Local environment:
  WSL Node v22.22.1/npm 9.2.0; CI uses Node 24. Application source/dependencies
  are unchanged, so these baseline results also cover the final application source.
- Combined-source self-review and instruction walkthroughs cover: docs-only
  work, behavior Red/Green, mirrored content, shared-file conflicts, dirty source,
  tool-limited reviews, missing teammates, flaky/baseline failures, scope changes,
  optional SDD and delivery authorization. These are instruction inspections,
  not observed model behavior or independent peer review.
- No public profile/site content changed, so browser layout and GitHub rendering
  checks were not applicable. Setup verification included no live-team story,
  independent agent review, stakeholder event, CI run or publication. Subsequent
  delivery is recorded in Git history and the actual GitHub Actions runs.

**Next action:** apply `/scrum <task>` to the next owner-selected story. Trial
actual collaboration and Red/Green on a bounded behavior change; agree Sprint
dates and goal when Sprint planning is requested.

No additional product priorities have been assigned. Add owner-requested stories
in their actual order; do not turn historical open items into self-selected work.

## Impediments and improvement

- Product Goal confirmation and first Sprint planning are pending; neither blocks
  the already-authorized workflow setup.
- No stakeholder review, retrospective or live-team behavior story is claimed.
- Proposed experiment for the first real behavior story: the facilitator traces
  one accepted example through observed Red/Green, collaboration and independent
  review where permitted, then measures acceptance gaps and avoidable handoff
  delays. Inspect at the first actual retrospective and choose one correction
  from evidence. No trial story or calendar date has been assigned.
