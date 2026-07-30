import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
// Bundled rather than loaded from index.html so the build hashes it and stale
// copies don't survive in browser caches.
import './custom-cursor-follower.js';

bootstrapApplication(AppComponent, appConfig)
  .catch((err: unknown) => console.error(err));
