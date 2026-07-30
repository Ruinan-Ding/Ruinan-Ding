import { provideZonelessChangeDetection } from '@angular/core';

// The page is static markup with no bindings, so zone.js has nothing to patch.
export const appConfig = {
  providers: [provideZonelessChangeDetection()]
};
