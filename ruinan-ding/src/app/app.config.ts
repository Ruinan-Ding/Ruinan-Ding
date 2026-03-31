import { provideZoneChangeDetection } from '@angular/core';

export const appConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true })]
};
