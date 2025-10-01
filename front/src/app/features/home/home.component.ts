import { Component } from "@angular/core";

@Component({
  standalone: true,
  selector: "app-home",
  template: `
    <div class="min-h-screen grid place-items-center p-6">
      <div class="max-w-md w-full space-y-3 text-center">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Bienvenido 🎉</h1>
        <p class="text-gray-600 dark:text-gray-400">Ya estás dentro de la aplicación.</p>
      </div>
    </div>
  `
})
export class HomeComponent {}
