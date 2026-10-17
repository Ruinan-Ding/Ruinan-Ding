# Claude plugin support

Keep `/scrum` as the single SAFe/vibe→SDD→BDD→TDD process. Plugins support a
specific step; they do not add product authority, mandatory ceremonies, publication
permission or a second team. Read only the relevant section below.

## Installed project capabilities

| Plugin | Default | Use |
|---|---|---|
| `ponytail@ponytail` | Enabled | Existing required full-mode guidance for code/design; disclose unavailable native invocation. |
| `ralph-loop@claude-plugins-official` | Enabled, no active loop | Explicitly requested bounded iteration on one testable contract. |
| `frontend-design@claude-plugins-official` | Enabled | New or deliberately redesigned UI; preserve the accepted identity, factual copy, accessibility and content-sync checks. |
| `typescript-lsp@claude-plugins-official` | Enabled | Targeted symbol/reference/diagnostic lookup; requires `typescript-language-server` and TypeScript. Diagnostics do not replace tests or browser checks. |
| `security-guidance@claude-plugins-official` | Enabled, pattern warnings | Local edit-pattern reminders; project env sets `ENABLE_CODE_SECURITY_REVIEW=0` and `ENABLE_PATTERN_RULES=1`. Model-powered Stop/commit reviews stay off. |
| `pr-review-toolkit@claude-plugins-official` | Installed, disabled | Focused independent review or simplification when needed; its six agent descriptions otherwise add substantial context. |
| `playwright@claude-plugins-official` | Installed, disabled | Browser interaction/screenshots when documented browser tooling needs support; use native Windows Chrome and a task-owned test server/browser. |
| `context7@claude-plugins-official` | Installed, disabled | Focused package/version documentation lookup when needed; connection/authentication is separate from installation. |

The existing nine profiles remain the delivery team. The review toolkit already
includes a simplifier, so a second simplifier/code-review plugin is unnecessary.
The current contract owns SDD/BDD/TDD; avoid a competing feature/spec orchestrator.
External trackers and publishing helpers need an actual unmet need before installation.
Enable optional MCPs locally only for a matching task, then reload; disable/reload
afterward as for the toolkit below. Context7 queries name the actual package/version
and one topic. Playwright checks retain the repo's viewport, motion, image-failure
and real observer procedures; preserve port4200 and other owner services. Its first
activation may download its helper/browser dependencies. Prefer existing CLI/browser
checks; reserve MCP for interaction that justifies its context cost. Existing browser
procedures remain authoritative. If optional support cannot load/connect, use documented
tooling and disclose the unavailable capability while continuing useful work.

## Focused review

Routine work uses the existing quality capability within runtime delegation policy.
For a toolkit review, enable it locally from the repo shell:

```sh
claude plugin enable pr-review-toolkit@claude-plugins-official --scope local
```

Reload plugins in the active Claude session with `/reload-plugins` (or start a fresh
session), then use `/pr-review-toolkit:review-pr tests`, `errors`, `types`, `comments`,
`code` or `simplify` for the actual concern. Do not default to `all` or parallel
fan-out. Supply the contract IDs, delta including new files, owned paths and raw
evidence; no transcript or whole backlog. Plugin agent/model defaults do not
override runtime policy. Preserve one writer per file and rerun affected checks
after simplification. Report review that could not be performed.

Afterward disable the toolkit at local scope and reload to restore the lean default:

```sh
claude plugin disable pr-review-toolkit@claude-plugins-official --scope local
```

## Bounded Ralph

Installation does not start a loop. Ordinary requests, vague requirements, SAFe
planning and `resume` use normal Scrum intake. Only start Ralph when the owner
requests iterative execution and the contract has observable acceptance and checks.
Resolve material product questions first; keep safe independent work moving.

Include a positive `--max-iterations` on every invocation: default to 4 when the
owner gives no cap; respect a supplied smaller limit and record a requested larger
limit explicitly. Include one truthful completion promise and the same canonical
contract, rather than the entire process/history. For example:

```text
/ralph-loop:ralph-loop "Work only on specs/STORY-example.md under /scrum. Follow its acceptance and required checks. Update its evidence. Cancel on blocked decisions, repeated failure without progress, or user stop. Emit <promise>STORY_DONE</promise> only when acceptance and required checks pass. No publication." --max-iterations 4 --completion-promise "STORY_DONE"
```

Replace the example path with the actual contract. Each iteration reads only its
continuation/delta, runs relevant checks and stores full output outside source.
Do not repeat planning, spawn nested loops, reopen completed scope or retry an
unchanged failure indefinitely. At a blocking decision, exhausted budget or user
stop, cancel via `/ralph-loop:cancel-ralph`, record the gap and return; never emit
a false success promise. A cap limits iterations, not billed tokens. Do not overwrite
another session's loop state; only cancel the task-owned loop. Generated loop state
is local and ignored by Git.

## Install or recover

The tracked settings record sources and defaults; each Windows/WSL Claude profile
still needs its own installation. From this repo, use the native `claude` in the
chosen runtime (or `claude.exe` when administering Windows from WSL):

```sh
claude plugin install ponytail@ponytail --scope project
claude plugin install ralph-loop@claude-plugins-official --scope project
claude plugin install frontend-design@claude-plugins-official --scope project
claude plugin install typescript-lsp@claude-plugins-official --scope project
claude plugin install security-guidance@claude-plugins-official --scope project
claude plugin install pr-review-toolkit@claude-plugins-official --scope project
claude plugin disable pr-review-toolkit@claude-plugins-official --scope project
claude plugin install playwright@claude-plugins-official --scope project
claude plugin disable playwright@claude-plugins-official --scope project
claude plugin install context7@claude-plugins-official --scope project
claude plugin disable context7@claude-plugins-official --scope project
claude plugin list
```

If a marketplace is missing, add `anthropics/claude-plugins-official` or
`DietrichGebert/ponytail` using `claude plugin marketplace add`. Keep existing
user/local overrides; inspect precedence before diagnosing a missing capability.
Install helper binaries in user tooling, not application dependencies. This setup
uses TypeScript language server 5.3.0 for Node 20+ compatibility; reuse installed
TypeScript. Ralph needs Bash, jq and Perl. Windows uses Git Bash and jq on PATH;
its Git Bash path belongs in Windows user settings, never shared Linux settings.
Security guidance needs Python and may bootstrap its helper environment even
with model review disabled. Do not edit cached plugins to change project policy.

Use `claude plugin details <id>` for projected context cost, `/context` for the
current session and actual usage/billing for savings; installation/listing and
fixture checks do not prove autonomous routing or reduced billed usage.

Sources: [Claude plugin scopes/cost](https://code.claude.com/docs/en/discover-plugins),
[Ralph](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/ralph-loop),
[security switches](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/security-guidance),
[Playwright MCP](https://github.com/microsoft/playwright-mcp),
[Context7](https://github.com/upstash/context7),
[Windows setup](https://code.claude.com/docs/en/setup),
[jq](https://jqlang.org/download/). Official source and installed hooks were inspected
17 Oct 2026; verify changed plugin versions before relying on their behavior.
