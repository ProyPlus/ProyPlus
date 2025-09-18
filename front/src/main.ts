import 'zone.js';

// ✅ arranca en dark si quedó guardado
const prefersDark = localStorage.getItem('theme:dark');
if (prefersDark === 'true') {
  document.documentElement.classList.add('app-dark'); // o document.body
}

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppRootComponent } from './app/app.component';

bootstrapApplication(AppRootComponent, appConfig).catch(err => console.error(err));
