# ruinanding.com

Angular source for my personal site. Pushing to `main` builds this directory
and publishes `dist/browser` to GitHub Pages via
[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).

The page mirrors the profile README one directory up, so a content change
usually belongs in both.

The whole site is one component:

- `src/app/app.component.html` — all the markup
- `src/styles.css` — all the styling
- `src/custom-cursor-follower.js` — custom cursor and animated favicon

```bash
npm install
npm start      # dev server on http://localhost:4200/
npm run build  # production build into dist/
```
