import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { AuthService } from "../login/auth.service";

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
  <div class="min-h-screen grid place-items-center p-6 bg-gray-50 dark:bg-black">
    <form [formGroup]="form" (ngSubmit)="onSubmit()"
          class="bg-white/90 dark:bg-gray-900/80 rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4 backdrop-blur">
      <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 text-center">Recuperar contraseña</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 text-center">
        Ingresá tu email y te vamos a enviar un enlace.
      </p>

      <input type="email" formControlName="email" placeholder="tu@email.com"
             class="w-full border rounded-lg p-3 dark:bg-gray-800 dark:border-gray-700"
             [class.border-red-500]="invalid('email')"/>

      <button class="w-full bg-gray-900 text-white rounded-lg p-3 disabled:opacity-60"
              [disabled]="form.invalid || loading()">
        <span *ngIf="!loading()">Enviar enlace</span>
        <span *ngIf="loading()">Enviando…</span>
      </button>

      <p *ngIf="ok()" class="text-green-600 text-sm text-center">{{ msg() }}</p>
      <p *ngIf="error()" class="text-red-600 text-sm text-center">{{ msg() }}</p>

      <div class="text-center text-sm">
        <a routerLink="/auth/login" class="underline">Volver a iniciar sesión</a>
      </div>
    </form>
  </div>
  `,
})
export class ForgotComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  loading = signal(false);
  ok = signal(false);
  error = signal(false);
  msg = signal("");

  form = this.fb.group({
    email: ["", [Validators.required, Validators.email]],
  });

  invalid(ctrl: string) {
    const c = this.form.get(ctrl)!;
    return (c.touched || c.dirty) && c.invalid;
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true); this.ok.set(false); this.error.set(false); this.msg.set("");

    const email = this.form.value.email!;
    this.auth.requestPasswordReset(email).subscribe({
      next: (res) => {
        this.ok.set(res.status !== false);
        this.error.set(res.status === false);
        this.msg.set(res.message || (res.status ? "Te enviamos un correo si el email existe." : "No se pudo enviar el correo."));
      },
      error: () => { this.error.set(true); this.msg.set("Error de comunicación."); },
      complete: () => this.loading.set(false),
    });
  }
}
