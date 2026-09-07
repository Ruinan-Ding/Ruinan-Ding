import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
// Every image on this page is served by a third party — 14 origins, none of
// which owe this site an SLA. One capture-phase listener covers all of them:
// `error` doesn't bubble, so capture is the only way to catch it centrally.
// Decorative images (alt="") collapse; captioned ones degrade to their caption
// instead of a broken-image icon.
document.addEventListener('error', (event) => {
  const img = event.target;
  if (!(img instanceof HTMLImageElement) || img.dataset['failed']) return;
  img.dataset['failed'] = '1';
  if (!img.alt) {
    img.remove();
    return;
  }
  const note = document.createElement('span');
  note.className = 'img-unavailable';
  note.textContent = img.alt;
  img.replaceWith(note);
}, true);

bootstrapApplication(AppComponent, appConfig)
  .catch((err: unknown) => console.error(err));

// Bundled rather than loaded from index.html so the build hashes it and stale
// copies don't survive in browser caches. Imported dynamically because a static
// import is hoisted above the bootstrap call no matter where it is written, and
// this is decorative — it has no business running before the page renders.
// @ts-expect-error - side-effect-only JS module, nothing to type
void import('./custom-cursor-follower.js');
