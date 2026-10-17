# Agent core

This repo contains the GitHub profile (`README.md`, `assets/`) and Angular site
(`ruinan-ding/`). The page mirrors the profile. Read this core once; use the
ordinary-language or `/scrum` entry point in [.claude/skills/scrum/SKILL.md](.claude/skills/scrum/SKILL.md)
for SAFe-aligned SDD → BDD → TDD delivery. The human is Product Owner. All nine senior
capabilities remain available on demand; the lead covers small work directly.

## Owner constraints

- Invoke `/ponytail` (default full) for code/design work. The user-scoped plugin
  is in the owner's Windows Claude installation; WSL/fresh clones may lack it.
  Source: `DietrichGebert/ponytail`; installation: `/plugin marketplace add
  DietrichGebert/ponytail`, then `/plugin install ponytail@ponytail`. If unavailable,
  disclose that; don't claim invocation. Siblings: `/ponytail-review`,
  `/ponytail-audit`, `/ponytail-debt`, `/ponytail-help`.
- Commit/push only when asked. Pushing main deploys. Use `git.exe` from WSL for
  status/add/commit/push; read-only WSL git is fine. Pull with `git.exe pull --rebase`
  before an authorized push; resolve conflicts without discarding existing work.
- Preserve port4200 and unrelated services/files. Test on4201 or another spare
  port, and stop only task-owned services. Run npm from WSL: dependencies are Linux.
- Comments and commit messages explain why in reasoned plain English. Match them.
- A passing build does not establish a working page. Preserve the checks below.

## Architecture invariants

Read the affected sections of [PROJECT_RULES.md](PROJECT_RULES.md) before changing
a technical contract. They preserve the detailed procedures and known failures.

- Image failures use main.ts's capture error handler; meaningful alt text matters.
  Animated GIFs use data-animated-src with stable dimensions and reduced-motion
  behavior; inspect the unloaded state and real scroll/IntersectionObserver.
- Stats cards are generated into assets/stats; read widget bodies, not just200.
  Fonts stay a stylesheet link. Cursor decoration respects coarse/reduced motion.
- ruinanding.com is this site; ruinan-ding.com is the separate Study Timer.
- README markup must survive GitHub sanitization. Content edits use
  [.claude/skills/content-sync/SKILL.md](.claude/skills/content-sync/SKILL.md) and
  stay consistent across the profile and Angular page.

## Checks and targeted context

From `ruinan-ding/`: `npm ci`, `npm test`, then
`npm run build -- --configuration production --base-href /` for application changes.
For visitor-visible changes check the built page at320/360/390/1280px against the
live baseline: no sideways scroll, right-edge overflow or clipped text; relevant
keyboard, image failure and motion states. PROJECT_RULES's “Checking a change”
contains the Windows Chrome/iframe/real-time observer procedure. README changes
also use GitHub's Markdown renderer. Agent/docs-only work uses structural/link/
instruction checks; don't rerun unrelated gameplay or manufacture wording tests.

| Need | Read/search only this context |
|---|---|
| Current task | Top of SCRUM_BACKLOG.md → one linked contract; SCRUM_WORKFLOW.md once as lead |
| Images, GIFs, stats, fonts, cursor, domains | PROJECT_RULES.md: Architecture invariants; relevant source |
| Browser verification | PROJECT_RULES.md: Checking a change |
| npm, Windows/WSL, dependencies, CI | PROJECT_RULES.md: Commands / Known quirks; actual package/workflow files |
| Historical detail | Search a concrete term in PROJECT_RULES.md or backlog history, then read the bounded match |

Do not load whole references or task histories by default. Workers receive IDs,
owned paths, constraints and expected evidence, not copied transcripts. Runtime
policy controls delegation. One writer per file; no recursive teams. Keep one
canonical specification/evidence record, link other records, and expose unperformed
checks or missing independent review. SDD formalizes the existing request; it
cannot invent product authority or authorize publication.
