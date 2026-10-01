import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { observeAnimatedGifs } from './animated-gif-visibility';

// Every image comes from a third-party origin that can go down. `error` doesn't
// bubble, so one capture-phase listener handles them all: decorative images
// (alt="") are removed, captioned ones are replaced by their caption.
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
  .then(() => {
    observeAnimatedGifs(document, window);
  })
  .catch((err: unknown) => console.error(err));

// Bundled so the build hashes it for cache-busting, and imported dynamically so
// this decorative script runs after bootstrap (a static import would be hoisted
// above it).
// @ts-expect-error - side-effect-only JS module, nothing to type
void import('./custom-cursor-follower.js');
