import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../login/auth.service";

function match(field: string, confirmField: string) {
  return (group: AbstractControl): ValidationErrors | null => {
    const a = group.get(field)?.value;
    const b = group.get(confirmField)?.value;
    return a && b && a !== b ? { mismatch: true } : null;
  };
}

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
  <div class="min-h-screen grid place-items-center p-6 bg-gray-50 dark:bg-black">
    <form [formGroup]="form" (ngSubmit)="onSubmit()"
          class="bg-white/90 dark:bg-gray-900/80 rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4 backdrop-blur">
      <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 text-center">Crear cuenta</h2>

      <input type="text" placeholder="Usuario" formControlName="username"
             class="w-full border rounded-lg p-3 dark:bg-gray-800 dark:border-gray-700"
             [class.border-red-500]="invalid('username')"/>

      <input type="email" placeholder="Email" formControlName="email"
             class="w-full border rounded-lg p-3 dark:bg-gray-800 dark:border-gray-700"
             [class.border-red-500]="invalid('email')"/>

      <input [type]="showPwd ? 'text':'password'" placeholder="Contraseña" formControlName="password"
             class="w-full border rounded-lg p-3 dark:bg-gray-800 dark:border-gray-700"
             [class.border-red-500]="invalid('password')"/>
      <input [type]="showPwd ? 'text':'password'" placeholder="Confirmar contraseña" formControlName="confirm"
             class="w-full border rounded-lg p-3 dark:bg-gray-800 dark:border-gray-700"
             [class.border-red-500]="form.hasError('mismatch') && (form.touched || form.dirty)"/>

      <label class="flex items-center gap-2 text-sm">
        <input type="checkbox" (change)="showPwd = !showPwd"> Mostrar contraseña
      </label>

      <button class="w-full bg-gray-900 text-white rounded-lg p-3 disabled:opacity-60"
              [disabled]="form.invalid || loading()">
        <span *ngIf="!loading()">Registrarse</span>
        <span *ngIf="loading()">Creando…</span>
      </button>

      <p *ngIf="ok()" class="text-green-600 text-sm text-center">{{ msg() }}</p>
      <p *ngIf="error()" class="text-red-600 text-sm text-center">{{ msg() }}</p>

      <div class="text-center text-sm">
        <a routerLink="/auth/login" class="underline">Ya tengo cuenta</a>
      </div>
    </form>
  </div>
  `,
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  ok = signal(false);
  error = signal(false);
  msg = signal("");
  showPwd = false;

  form = this.fb.group({
    username: ["", [Validators.required, Validators.minLength(3)]],
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(6)]],
    confirm: ["", [Validators.required]],
  }, { validators: match("password", "confirm") });

  invalid(ctrl: string) {
    const c = this.form.get(ctrl)!;
    return (c.touched || c.dirty) && c.invalid;
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true); this.ok.set(false); this.error.set(false); this.msg.set("");

    const { username, email, password } = this.form.getRawValue();
    this.auth.register({ username: username!, email: email!, password: password! }).subscribe({
      next: (res) => {
        if (res.status) {
          this.ok.set(true);
          this.msg.set(res.message || "Cuenta creada. Iniciá sesión.");
          // opcional: redirigir automáticamente
          setTimeout(() => this.router.navigateByUrl("/auth/login"), 1000);
        } else {
          this.error.set(true);
          this.msg.set(res.message || "No se pudo registrar.");
        }
      },
      error: () => { this.error.set(true); this.msg.set("Error de comunicación."); },
      complete: () => this.loading.set(false),
    });
  }
}
