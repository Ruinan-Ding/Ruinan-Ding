# Claude Scrum workflow

Ruinan-Ding uses BDD to agree observable outcomes and TDD to implement behavior.
One senior, cross-functional Scrum team owns the whole Increment: profile README,
Angular site, assets, tests, accessibility, documentation and delivery readiness.
[AGENTS.md](AGENTS.md) remains the source of repository constraints. The user's
instructions and existing authorization take precedence over this workflow.

Adapted from the neighboring ChessPlusPlus workflow for this static site. Its
backend/game capabilities are replaced by profile-content and asset engineering;
there is no new backend, game ruleset or copied product backlog.

## Run the team

Start Claude Code in this repository and use `/scrum <request>`, or describe a
development task normally. The [Scrum skill](.claude/skills/scrum/SKILL.md) applies
the process. Project [settings](.claude/settings.json) enable experimental native
teams in-process. Role definitions use `model: inherit`; the setup does not select
a new model or change permission rules. Restart an existing Claude session after
adding these files. Ponytail remains required for code/design work; installation
and availability guidance is in AGENTS.md.

Use interactive native teammates when a substantial story benefits from peer
discussion and independent work. Focused subagents suit bounded investigation
or review; dependent edits stay sequential. Native teams need an interactive
session; `claude -p` is not a live-team test. Follow the session's delegation
policy and capacity. If delegation is unavailable, cover responsibilities
sequentially and disclose the missing independent review.

The main conversation coordinates and integrates. Assigned workers follow their
role/task packet and return results; they do not launch another Scrum team or
choose unrelated work. Native team/task state is runtime-managed, not a project
team roster to pre-author. On resume inspect real files, tasks and live workers
before restoring ownership. Configuration discovery does not prove collaboration.

## Accountabilities and senior capabilities

The **human owner is Product Owner**, accountable for product value, goals and
backlog ordering. An analyst supports refinement; it cannot invent personal
claims, approve new public content or reprioritize the product on the owner's
behalf. Resolve routine technical choices within the existing request.

The **Scrum Master** facilitates effectiveness, inspection and impediment removal.
The lead may cover this responsibility directly. **Developers** collectively
plan, implement, verify and maintain the Increment. Specialists are capabilities
within that team, not departments, managers or sequential approval queues.

| Profile | Senior contribution |
|---|---|
| [Scrum Master](.claude/agents/scrum-master.md) | Goals, facilitation, flow, impediments and improvement |
| [Product analyst](.claude/agents/product-analyst.md) | Visitor/maintainer outcomes, refinement and BDD examples |
| [Architect](.claude/agents/architect.md) | Minimal design, browser/content contracts, compatibility and peer review |
| [Frontend developer](.claude/agents/frontend-developer.md) | Angular, CSS, browser lifecycle, interactions and integration |
| [Content engineer](.claude/agents/content-engineer.md) | Profile/site consistency, GitHub rendering, images and generated assets |
| [Quality engineer](.claude/agents/quality-engineer.md) | BDD/TDD pairing, regressions, exploratory testing and acceptance evidence |
| [UX/accessibility](.claude/agents/ux-accessibility.md) | Comprehension, semantics, keyboard access, motion and responsive usability |
| [Security/reliability](.claude/agents/security-reliability.md) | Trust boundaries, dependencies, third-party failures and resource use |
| [Release engineer](.claude/agents/release-engineer.md) | CI, integrated checks, assets and Pages delivery readiness |

Every participant works to a senior standard: understand the full affected path,
challenge unclear examples, explain significant tradeoffs, verify assumptions,
own evidence and surface uncertainty early. Peers help beyond their specialty
and swarm on defects. Seniority is demonstrated through results and qualified
review; a profile label does not improve a model or prove expertise.

One participant may cover several capabilities. Reuse profiles for additional
independent slices within capacity, keeping one Product Owner and one facilitation
responsibility. Activate expertise by risk, rather than launching all nine roles
for every task. Advisory profiles have read/search/Skill tools; writers/testers
inherit the parent's permitted tools. Read-only reviews request execution evidence
from a permitted tester instead of claiming they ran commands.

| Work | Practical staffing |
|---|---|
| Small documentation/configuration change | One writer; structural checks and a peer when impact warrants it. |
| Browser behavior or defect | Frontend and quality pair on examples/tests; a qualified non-author reviews the integrated change. |
| Visitor content or visual change | Content/frontend coordinate shared markup; quality and UX verify both renderers and phone behavior. |
| Automation, assets or dependencies | Release pairs with the affected developer; bring in security/architecture for concrete changed risks. |

## Goals, backlog and Scrum events

[SCRUM_BACKLOG.md](SCRUM_BACKLOG.md) persists the Product Goal, ordered stories,
current Sprint plan, impediments, evidence, next action and improvement experiment.
Native task lists coordinate live workers; the backlog survives sessions. Keep
technical facts in AGENTS.md and existing guides, linking instead of copying them.

Sprints have a fixed duration of one month or less. Agree dates, cadence and the
Sprint Goal with the Product Owner at the first planning event; two weeks is a
suggestion, not an already scheduled Sprint. Until then, label work unscheduled.
An agent session is not a Sprint and progress messages are not invented meetings.

| Event | Concrete outcome |
|---|---|
| Refinement, throughout | Product, development and quality clarify examples, split vertical stories and expose dependencies. The PO orders the backlog. |
| Sprint Planning, at the start | Agree why the Sprint matters, select achievable work and plan how to start. Record dates, Sprint Goal, capacity for verification and selected stories. |
| Daily Scrum, each working day | Developers inspect progress toward the Sprint Goal and adapt the plan within 15 minutes. Record actual impediments and next actions. |
| Sprint Review, at the end | Team and available stakeholders inspect the working Increment and evidence, record actual feedback and adapt the backlog. |
| Retrospective, after review | Inspect collaboration, quality and flow; choose one improvement with an owner, measure and next-review date. |

For a one-month Sprint, Planning is at most eight hours, Review four and
Retrospective three; shorter Sprints usually use shorter events. Do not wait out
timeboxes or manufacture attendance. Missing events/feedback stay visible.

Use small vertical stories with IDs, source/request, outcome, in/out of scope,
Given/When/Then example IDs, decisions/questions, dependencies, owned paths,
status, evidence, review findings and exact next action. Ready means sufficiently
understood to start, not another human approval gate. Use
`Ready → In progress → Review → Done`, or `Blocked` with a specific dependency. Keep one implementation
slice active per writer; finish or explicitly park it before taking another.

Developers adapt the Sprint Backlog while preserving the Sprint Goal. Product
priorities and changes to the goal stay with the PO; only the PO cancels a Sprint
whose goal is obsolete. A follow-up updates the active story's scope/examples and
records superseded decisions; a distinct outcome becomes another backlog item.

For a defect, record visitor impact, expected/actual behavior, reproduction,
source/environment and evidence. Swarm on urgent defects within scope and make
displaced work visible, retaining regression/review checks. Record significant
design or delivery decisions in the story or relevant guide with context, chosen
option, rationale, alternatives and compatibility impact; routine edits need no
separate decision document.

## BDD: discover, formulate, automate

Before changing behavior, combine three perspectives: product (the human PO or
their recorded intent), development and quality. Three Amigos means collaborating
on examples, not requiring three agents to repeat an analysis.

1. Discover the visitor/maintainer purpose, existing behavior and open questions.
   Read affected source and callers. Ask only for missing product decisions;
   continue independent work while they are unresolved.
2. Formulate concrete Given/When/Then examples: initial state, action and observable
   outcome. Include relevant failure paths, boundaries, motion/pointer settings,
   image lifecycle and README/site differences. Avoid unneeded permutations.
3. Map example IDs to existing Node tests, rendered GitHub output or specific
   browser observations before implementation; record actual results afterwards.

For example, a GIF-loader change may use these acceptance examples:

| Example | Given / When / Then | Meaningful evidence |
|---|---|---|
| GIF-A | Given an image beyond the 200px observer margin, when the loader starts, then src remains absent until it enters the margin; after leaving, src is removed. | Existing observer node:test, plus real scroll behavior when changed. |
| GIF-B | Given a captioned GIF, when src is absent or removed, then its reserved box matches the loaded image. | Built-page geometry before/after scroll at all required widths; unit mocks alone cannot prove it. |
| GIF-C | Given reduced motion, when a decorative GIF is present, then it is hidden and never requested. | Real-browser motion preference and resource observations. |

These illustrate current repo contracts, not newly assigned product work. Use
the [content-sync skill](.claude/skills/content-sync/SKILL.md) for visitor content:
agree matching words/links and each renderer's valid markup. Read new widgets'
bodies because a 200 response can still be an error card. Gherkin-style prose and
traceable tests are sufficient; no Cucumber, duplicate .feature files or BDD DSL
is required.

## TDD: Red, Green, Refactor

For new behavior or a reproduced defect:

1. **Red:** add the smallest meaningful behavior test and run it against unchanged
   production code. Record command, test and observed expected failure. A missing
   dependency, syntax error or broken setup is not the behavioral Red.
2. **Green:** make the smallest correct production change and run focused tests.
   Follow Ponytail and existing patterns; do not weaken assertions to fit code.
3. **Refactor:** improve design while green, then run appropriate integrated
   regression and acceptance checks against the final source.

For a pure refactor, establish characterization protection first; no invented
behavior failure is needed. For static content, styles, docs and agent settings,
use relevant rendering/structural checks rather than artificial tests of wording.
If implementation predates tests, say so; reproduce against original source in
isolation where useful instead of inventing test-first history.

Use existing node:test and the documented Chrome/GitHub renderer methods. A unit
test cannot prove responsive rendering, keyboard use, image decoding or layout
stability. Establish a relevant baseline, distinguish pre-existing/environment
failures and preserve failed output before retrying. Investigate timing/shared
state for flaky checks; one passing retry does not explain a failure. Keep
unresolved failures visible rather than skipping checks to claim Done.

## Delegation, review and integration

Inspect the branch, `git.exe status` and diff before assigning work. Preserve
existing uncommitted work. Give each worker this task packet:

```text
Story/goal, scope and acceptance example IDs:
Accepted decisions, open questions and relevant repo invariants:
Branch/HEAD and dirty source to include:
Owned write paths; shared/read-only paths and integrator:
Dependencies, interface decisions and handoff order:
Expected Red/Green, rendering/acceptance checks and evidence:
For review: actual story diff/new files and source-bound results:
Permitted side effects and environment limits:
Return: changed paths, results, findings, gaps and next action:
```

Assign **one writer per file**, including tests, README, app.component.html,
workflows and backlog. Transfer ownership before editing a peer's file. Agree
interfaces before dependent implementation; peers may discuss directly and
challenge assumptions. The integrator owns shared metadata unless assigned
otherwise. Concurrent writes are not safe merely because the roles differ.

Use shared-tree parallelism for disjoint edits. Worktrees must include required
dirty source; a checkout from HEAD alone can omit the owner's fixes. Never reset,
stash or commit someone else's changes to simplify delegation. Route missing
human decisions through the lead. Internal team communication does not authorize
email, chat messages or other external contact.

A qualified non-author reviews the integrated diff and evidence when delegation
is available. A design author cannot independently approve their own design.
Read-only reviewers receive new files as well as the diff, current source identity,
acceptance mapping and actual command results. Separate this story's delta from
earlier dirty changes; request missing evidence rather than inventing execution.

Resolve material findings, rerun affected checks and inspect combined source after
all writers finish. Earlier green branches do not prove integration. Tie review
and test evidence to the commit plus dirty-file identity; later edits require
reassessment even if HEAD is unchanged. If independent review is unavailable,
record self-review and any remaining required review explicitly.

On interruption, persist ownership, decisions, checks and the exact next action.
On completion stop only this task's workers/services, leaving the owner's port
4200 and unrelated work intact. Use `git.exe` for repository operations from WSL
as required by AGENTS.md; run npm from WSL. Never copy local permissions or secrets
into project settings.

## Definition of Done and delivery evidence

An Increment meets every applicable condition. An unperformed required check is
remaining work, not a passing check or silently waived requirement.

- Accepted examples are implemented and mapped to observed results. Missing
  product decisions and material defects are resolved or explicitly outside scope.
- Behavior changes have honest Red/Green/Refactor evidence; refactors and
  content/docs/config changes have the appropriate alternative checks recorded.
- Application changes pass `npm test` and
  `npm run build -- --configuration production --base-href /` from `ruinan-ding/`.
  Check the final combined source. Docs/agent-only changes need format, discovery,
  link and instruction checks; do not manufacture runtime tests.
- Anything a visitor sees is checked in the built page at **320, 360, 390 and
  1280px**, compared with the current live build: no sideways scroll, content
  past the right edge or clipped text. Check relevant keyboard, motion, image
  failure and unloaded/loaded states. Follow AGENTS.md's iframe/real-time Chrome
  method; virtual-time budgets cannot validate IntersectionObserver behavior.
- Changed profile content follows content-sync, including GitHub Markdown
  rendering, matching site content and widget-body/asset checks when applicable.
- The integrated change is reviewed, material findings addressed and review
  independence or its absence explicit. Security, compatibility, accessibility
  and performance checks cover the paths actually affected.
- Relevant guides and backlog reflect the real state with reproducible commands,
  environment, source identity, results and next action. No unused scaffolding,
  temporary artifacts or secrets are introduced. Record only relevant outcomes,
  not raw logs or a duplicate technical manual.

The current [deploy workflow](.github/workflows/deploy.yml) runs Node 24 install,
unit tests and production build before Pages deployment on pushes to main. There
is no separate PR check. The [stats workflow](.github/workflows/stats-cards.yml)
commits generated assets; it is not proof that a widget displays useful content.
BDD discovery, test-first chronology, peer collaboration and browser acceptance
depend on actual evidence; these instructions do not automatically enforce them.

Technical Done, product feedback and publication are separate facts. **Commit
and push only when asked.** An authorized push uses `git.exe pull --rebase` first;
stop and resolve conflicts without discarding work. Pushing main releases the
site. Prepare concrete reviewable delivery before seeking genuinely missing
authorization; Scrum events introduce no additional permission gates. Record
actual CI/deployment links only after those runs exist.

Inspect outcomes and flow: escaped defects, acceptance gaps, cycle/blocked time
and Sprint Goal progress. Use estimates for capacity, not ranking agents; avoid
invented velocity or optimizing lines of code/test counts. Keep feedback direct
and blameless. Trial the workflow on the next owner-selected bounded behavior
story, tracing an example through Red/Green, real collaboration where permitted
and integrated acceptance. Improve it from observed friction without inventing
a feature or pretending configuration checks prove a high-performing team.

## SDD later

SDD means **specification-driven development** here. It remains a future option,
complementing BDD/TDD rather than replacing them. If the owner adopts it, start
with a small behavior contract derived from accepted examples and existing
invariants. Keep stable requirement IDs, link requirements → examples → tests →
code, and inspect drift as changes arrive. Distinguish proposed, accepted,
implemented and verified states and keep one authoritative home for each rule.
Choose tooling only for a demonstrated need; no spec framework, parallel source
of requirements or extra approval step is installed in advance. Clarify SDD if
the owner intends another expansion of the acronym.

## References

The [Scrum Guide](https://scrumguides.org/scrum-guide.html) defines Scrum
accountabilities, events and commitments. Claude's documentation describes
[agent teams](https://code.claude.com/docs/en/agent-teams),
[subagent definitions](https://code.claude.com/docs/en/sub-agents) and
[skills](https://code.claude.com/docs/en/skills). This is repository engineering
configuration, not provisioned organization identity, audit or retention controls.
