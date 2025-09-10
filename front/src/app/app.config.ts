// src/app/app.config.ts
import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import localeEsAr from '@angular/common/locales/es-AR';
import { registerLocaleData } from '@angular/common';

registerLocaleData(localeEsAr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),         // <- ¡no lo dejes vacío!
    provideHttpClient(),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: { preset: Aura },
    }),
    { provide: LOCALE_ID, useValue: 'es-AR' },
  ],
};
