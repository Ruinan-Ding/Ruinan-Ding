---
name: scrum
description: Deliver Ruinan-Ding site, profile content and automation changes with the project's senior Scrum team, BDD examples and TDD. Use for repository development or explicit planning, refinement, review and retrospective requests; not for general Scrum questions.
---

# Scrum delivery

Read [AGENTS.md](../../../AGENTS.md), [SCRUM_WORKFLOW.md](../../../SCRUM_WORKFLOW.md)
and [SCRUM_BACKLOG.md](../../../SCRUM_BACKLOG.md). The request is `$ARGUMENTS`;
if empty, use the active request and recorded next action without inventing work.

The main conversation coordinates. An assigned worker follows its role/task
packet and reports to that lead; it does not create another Scrum team or pull
unrelated work. The user's current instructions and existing authorization apply.

1. Inspect the branch, dirty files, current story and affected source. Invoke
   Ponytail for code/design work as required by AGENTS.md. State the intended
   visitor/maintainer outcome, scope and any missing product decision. Incorporate
   follow-up steering into the active story, recording superseded decisions.
2. Refine concrete Given/When/Then examples using product, development and quality
   perspectives. Map each example to a meaningful check before implementation.
   For visitor content, also use [content-sync](../content-sync/SKILL.md).
3. Select relevant senior profiles from `.claude/agents/`. Delegate independent
   work when runtime policy permits; use native interactive teammates for work
   needing discussion, focused subagents for bounded tasks, and sequence shared
   files. Follow the workflow's task packet and one-writer ownership contract.
   Cover all affected concerns without launching every role for every change.
4. Follow Red → Green → Refactor for behavior changes using the existing test
   tools. Record an observed behavioral failure before the implementation; do
   not call a setup error Red. For docs, static content and agent configuration,
   use applicable structural/rendering checks without manufactured unit tests.
   Separate baseline/environment failures and investigate flakiness.
5. Integrate the actual combined source, perform applicable acceptance checks,
   and obtain a qualified independent review when available. Read-only reviewers
   receive the actual diff/new files and source-bound evidence. Later edits need
   reassessment. Disclose missing checks or independent review truthfully.
6. Update the backlog's status, evidence and next action. Use the Definition of
   Done; record actual feedback and one actionable improvement when appropriate.
   Stop only this task's services/workers. Commit and push only when asked, using
   `git.exe`; pull with rebase before an authorized push. Preserve port 4200.

SDD means specification-driven development here. Keep it optional; no spec
framework, duplicate source of requirements or additional approval gate is added.
