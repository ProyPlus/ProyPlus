import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';

// 👇 AÑADIR ESTO
import { provideHttpClient /*, withInterceptorsFromDi */ } from '@angular/common/http';

import Lara from '@primeuix/themes/lara';
import { definePreset } from '@primeuix/themes';

const Preset = definePreset(Lara, {
  semantic: {
    primary: {
      50:'{blue.50}',100:'{blue.100}',200:'{blue.200}',300:'{blue.300}',
      400:'{blue.400}',500:'{blue.500}',600:'{blue.600}',700:'{blue.700}',
      800:'{blue.800}',900:'{blue.900}',950:'{blue.950}'
    }
  }
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    providePrimeNG({
      ripple: true,
      theme: { preset: Preset, options: { darkModeSelector: '.app-dark' } }
    }),

    // ✅ HttpClient para que se pueda inyectar en servicios (AuthService, etc.)
    provideHttpClient(), 
    // Si tenías interceptores registrados con HTTP_INTERCEPTORS,
    // usá en su lugar:
    // provideHttpClient(withInterceptorsFromDi()),
  ]
};
