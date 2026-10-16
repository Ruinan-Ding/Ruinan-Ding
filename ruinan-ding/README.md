# ruinanding.com

Angular source for my personal site. Pushing to `main` builds this directory
and publishes `dist/browser` to GitHub Pages via
[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).

The page mirrors the profile README one directory up, so a content change
usually belongs in both.

Claude development uses the [senior Scrum workflow](../SCRUM_WORKFLOW.md) and
[backlog](../SCRUM_BACKLOG.md). Start with `/scrum <task>`; follow
[AGENTS.md](../AGENTS.md) for repo constraints, BDD/TDD and verification.

The whole site is one component:

- `src/app/app.component.html` — all the markup
- `src/styles.css` — all the styling
- `src/custom-cursor-follower.js` — custom cursor and animated favicon
- `src/animated-gif-visibility.ts` — loads GIFs only while they're near the viewport

```bash
npm install
npm start      # dev server on http://localhost:4200/
npm run build  # production build into dist/
npm test       # unit tests; the deploy runs these before building
```
