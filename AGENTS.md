# AGENTS.md

Guidance for AI agents working in this repo. Human-readable too — `ruinan-ding/README.md` covers
setup, this covers the things that are easy to get wrong.

## How to work here

**Invoke the `ponytail` plugin for all code work in this repo** — `/ponytail` (default level
`full`). Source: `DietrichGebert/ponytail` marketplace; install with
`/plugin marketplace add DietrichGebert/ponytail` then `/plugin install ponytail@ponytail`.
It is installed at *user* scope in the owner's Windows Claude Code, not in WSL's, so a session
started from WSL - or a fresh clone by someone else - won't have it.

The plugin is the source of truth for what "lazy" means here — don't restate its rules in this
file, just run it. Sibling skills: `/ponytail-review` (over-engineering review of a diff),
`/ponytail-audit` (whole-repo), `/ponytail-debt`, `/ponytail-help`.

The owner's working rules:

- **Commit and push only when asked.** Pushing to `main` deploys the site, so a push is a release.
- **Use `git.exe` (Windows git) from WSL**, for status, add, commit and push. Only Windows git has
  the owner's identity (Ruinan Ding, ding.r866@gmail.com) and the credential manager; WSL's git
  has neither. Read-only WSL `git` is fine.
- **Pull before pushing.** `stats-cards.yml` commits to `main` as github-actions[bot] every Monday
  the numbers change, so `main` can move without anyone touching it: `git.exe pull --rebase`.
- **Don't touch the owner's dev server on 4200.** Test on a spare port (`npx ng serve --port 4201`)
  and stop it afterwards.
- **Comments are long, reasoned, plain English, and explain why.** Match them. Commit messages
  too: what was wrong, how it showed, why this fix.
- **A passing build is not a working page.** Anything a visitor sees gets checked in a browser,
  at phone widths too (*Checking a change*, below).

## What this is

Two things in one repo:

- **The GitHub profile README** - `README.md` and `assets/` at the root, rendered on
  github.com/Ruinan-Ding.
- **ruinanding.com** - the Angular app in `ruinan-ding/`: Angular 21, zoneless, one standalone
  component, static markup with no bindings. GitHub Pages behind Cloudflare, built and deployed
  by `.github/workflows/deploy.yml` on every push to `main`.

**The page mirrors the README**, so a content change usually belongs in both - and they are
rendered by very different things. The procedure is the `content-sync` skill
(`.claude/skills/content-sync/SKILL.md`).

## Commands

```bash
# From ruinan-ding/
npm ci
npm test        # node:test - the cursor script and the GIF loader (13 tests, 2 Oct 2026)
npm run build -- --configuration production --base-href /   # exactly what CI deploys
npx ng serve --port 4201                                    # 4200 is the owner's

# Installs that move Angular's versions: WSL's own npm is 9.2 and can't (Known quirks)
npx -y npm@11 install
```

CI is `.github/workflows/deploy.yml`: `npm ci`, `npm test`, the production build, then the Pages
deploy, on Node 24, on every push to `main`. There is no separate PR check.

## Architecture invariants

Break these and the page breaks, usually quietly.

**1. Every image is hotlinked, and failures are handled in one place.** Fourteen third-party
origins serve the page's images. `main.ts` has a capture-phase `error` listener (`error` doesn't
bubble): an image with `alt=""` is removed, a captioned one is replaced by its alt text. So alt
text has to be honest - `alt=""` means "decoration, fine to lose". **A third-party error card
served as a 200 image passes straight through it.** `github-readme-stats-sigma-five.vercel.app`
served "Something went wrong ... add an env variable called PAT_1" cards on the site and in the
README while every status check said 200. Checking a widget means reading the body.

**2. Animated GIFs load through `animated-gif-visibility.ts`, so their box must not depend on
them.** They carry `data-animated-src`, never `src`; the loader sets `src` within 200px of the
viewport and removes it again off screen, so nothing decodes or animates out of view. That only
works if the box is identical with and without the image:

- `width`/`height` are the GIF's real pixel size (bytes 6-9 of the file, little-endian). The
  giphy GIF once said 200x343 for a 500x343 image and reserved a box 2.5x too tall.
- `:where(img[data-animated-src])` makes them inline-block and top-aligned. Without inline-block,
  Chrome draws a captioned image with no `src` as a line of alt text, and the cherry blossom photo
  collapsed from ~340px to 27px each time it scrolled away.
- Under reduced motion the decorative ones (`alt=""`) are `display: none`, which also means they
  never intersect and are never fetched. A GIF with alt text is content and stays.

**3. The GitHub stats cards are generated, never hotlinked.** `stats-cards.yml` renders the stats,
top-languages and four project cards into `assets/stats/` with
`stats-organization/github-readme-stats-action` (the route github-readme-stats itself recommends;
the project is unmaintained and its public instances run out of API quota). `GITHUB_TOKEN`, so
public stats only - a PAT secret would add private ones. `fail_on_error` fails the run and keeps
the last good card instead of committing an error card. The README embeds them by relative path,
the site from `raw.githubusercontent.com`, so the weekly commit needs no redeploy (and a
`GITHUB_TOKEN` push doesn't trigger one). The site's `width`/`height` match the cards (400x150,
467x195, 300x190); if the action changes a card's size, change them.

**4. Fonts stay a plain stylesheet link.** `index.html` links Google Fonts with
`rel="stylesheet"`, and the production build inlines that CSS (11 `@font-face` rules) into the
page. The preload-and-swap "async CSS" trick looks faster and is slower: the inliner skips it, so
the fonts wait on an extra request. It was tried and reverted.

**5. The cursor script is decoration.** `custom-cursor-follower.js` is bundled (hashed), imported
dynamically after bootstrap, and bows out on coarse pointers and reduced motion. The
reduced-motion CSS collapses durations rather than using `animation: none`, because the script
removes each sparkle and click ring on `animationend` - which `none` never fires.

**6. Two domains, on purpose.** `ruinanding.com` is this site (canonical, `og:url`).
`ruinan-ding.com` is the separate Study Timer web app (`Ruinan-Ding.github.io`). Not a typo:
they were "unified" once and reverted (`1ef6c10`).

**7. GitHub's README sanitizer is the README's browser.** It strips `target`, `rel` and `style`,
so don't add them; layout is `align=`/`width=`. `height="180em"` on the two stats images comes
from github-readme-stats' example snippet: `180` would make GitHub add its own sizing and change
how they render, so it stays unless that is the point. Check a README change with GitHub's
renderer: `POST https://api.github.com/markdown` with `{"mode":"markdown","text": ...}`.

**8. Pages serves the uploaded artifact as-is.** The Pages source is "GitHub Actions", so Jekyll
never runs and there is no `.nojekyll` (upload-pages-artifact v4+ drops dotfiles anyway).

## Checking a change

`npm test` and the production build first. Then, for anything a visitor sees, the built page in
headless Chrome at **320, 360, 390 and 1280px**: no sideways scroll (`document.scrollWidth` no
wider than the viewport), nothing past the right edge, text not clipped.

- Windows Chrome runs headless from WSL:
  `"/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new`. The Linux
  `chrome-headless-shell` under `~/.cache/ms-playwright` is missing `libnspr4`.
- Serve `dist/browser` with `python3 -m http.server <spare port>`. Headless Chrome has a minimum
  window width, so for phone widths load the site in a same-origin
  `<iframe style="width:390px">` on a wrapper page, measure with JS into the DOM, and read it
  with `--dump-dom`.
- **`--virtual-time-budget` stops rendering frames, so `IntersectionObserver` never fires** and
  the GIF loader looks broken. Anything involving it runs in real time: hold the load event open
  with an `<img>` pointed at an endpoint that sleeps, so `--dump-dom` waits.
- Compare against the current live build, not memory: what changed, and what didn't.

## Known quirks

- **WSL and Windows git disagree on line endings unless told.** Windows git has
  `core.autocrlf=true`; WSL's has it off. `.gitattributes` (`* text=auto eol=lf`, `*.gif` and
  `*.png` binary) makes both see the same LF bytes.
- **`node_modules` was installed from WSL** (Linux esbuild and rollup binaries), so run npm from
  WSL, not from Windows (whose Node is 25).
- **WSL's npm is 9.2** (apt). It can't move the exactly-pinned Angular packages together
  (`ERESOLVE`, even though the versions agree); `npx -y npm@11 install` can, and if npm still
  trips over stale lock entries, drop the `@angular/*` ones from `package-lock.json` and let it
  re-resolve. CI uses Node 24's npm 11.
- **`overrides.piscina` is pinned to 5.3.2** in `package.json` for GHSA-67c8-pqhq-4rmx:
  `@angular/build` 21.2.24 pins 5.2.0. Build-time only. Remove it once `@angular/build` ships
  5.3.2 or later.
- `1.0.0-alpha` is a local-only tag (Apr 2025, 139 commits back) that was never pushed.

## Open items (2 Oct 2026)

- Private-repo numbers on the stats cards need a PAT secret wired into `stats-cards.yml`.
- Angular 22 and TypeScript 7 are out; 21 is supported until about May 2027.
- `ubuntu-latest` moves to Ubuntu 26 from 19 Oct 2026. Nothing should need to change.
- The multi-angle review (line by line, cross-file, cleanup) has not run since the 2 Oct fixes.
