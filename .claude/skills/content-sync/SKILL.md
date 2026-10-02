---
name: content-sync
description: Change what a visitor sees - text, images, GitHub widgets, links - in both the profile README and the ruinanding.com site without breaking either. Use when adding, removing or changing page content, or when an image renders wrong, shows an error card, or is missing.
---

# Content sync

The site (`ruinan-ding/src/app/app.component.html`) mirrors the profile README (`README.md`), so
a content change usually belongs in both. The same element is written differently in each,
because different things render them:

| | `README.md` (github.com) | `app.component.html` (ruinanding.com) |
|---|---|---|
| Rendered by | GitHub's Markdown and HTML sanitizer | Angular, then the browser |
| Stripped | `target`, `rel`, `style`, scripts | nothing |
| Layout | `align=`, `width=`/`height=` attributes | `styles.css`, section-scoped (`.skills img`, `.about-section img`) |
| Repo images (`assets/`) | relative path: `assets/stats/stats.svg` | `https://raw.githubusercontent.com/Ruinan-Ding/Ruinan-Ding/main/assets/...` |
| Animated GIFs | `src` | `data-animated-src` - the loader sets `src` (AGENTS.md invariant 2) |
| An image that fails | broken-image icon | `main.ts`: `alt=""` removed, captioned replaced by its alt text |

## Procedure

1. **Edit both**, unless the owner says it is one-sided. The words match; the markup follows the
   table above. Links to the two domains are different sites: `ruinanding.com` is this one,
   `ruinan-ding.com` the Study Timer app (AGENTS.md invariant 6).

2. **Every image:**
   - **Alt text that says what it shows.** `alt=""` only for pure decoration: on the site that
     image is removed if it fails, and hidden for reduced motion if it is a GIF. Not a
     generator's placeholder ("Typing SVG", "Readme Card").
   - **On the site, `width` and `height` are the image's real pixel size**, so the box is right
     before it loads and nothing jumps. A GIF: bytes 6-9 of the file, little-endian
     (`curl -r 0-15`). An SVG: the root `<svg>`'s `width`/`height`. Not a guess, and not the
     size you want it shown at - CSS does that.
   - **On the site, it must fit a phone**: the section's CSS gives it `max-width: 100%;
     height: auto`, or the page scrolls sideways (the 600px Spotify card did).
   - **A GIF on the site uses `data-animated-src`**, never `src`.

3. **A widget that renders data** (stats, languages, a pinned repo) is **not hotlinked from a
   github-readme-stats instance** - they run out of API quota and serve error cards. Add a step
   to `.github/workflows/stats-cards.yml` writing to `assets/stats/`, commit a first copy so
   nothing is broken before the run, and reference that.

4. **Check every new third-party URL by its body, not its status.** An error card is a 200
   `image/svg+xml`. Fetch it and read the text: "Something went wrong", "PAT_1", "rate limit".

5. **README:** no `target`, `rel` or `style` - GitHub strips them. To see what GitHub will
   actually render, `POST https://api.github.com/markdown` with `{"mode":"markdown","text": ...}`
   for the old and new file and compare the HTML.

6. **Verify the site** (AGENTS.md, *Checking a change*): `npm test`, the production build, then
   the built page at 320, 360, 390 and 1280px - no sideways scroll, nothing clipped, and the
   image's box the same height before and after it loads.

## Removing content

Remove it from both. For a GIF, nothing else references it. For a generated card, also delete its
step from `stats-cards.yml` and its file from `assets/stats/`, or the workflow keeps rewriting a
card nothing shows. Drop the origin's `dns-prefetch`/`preconnect` from `index.html` if nothing
else uses that host.
