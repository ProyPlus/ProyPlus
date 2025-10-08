import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { ResetPasswordService } from "../../../core/services/reset-password.service";
// Si tenés el modal reutilizable:
import { AuthErrorModalComponent } from "../shared/auth-error-modal.component";

function match(control: AbstractControl): ValidationErrors | null {
  const pass = control.get("password")?.value;
  const confirm = control.get("confirm")?.value;
  return pass && confirm && pass !== confirm ? { mismatch: true } : null;
}

@Component({
  standalone: true,
  selector: "app-reset-password",
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AuthErrorModalComponent],
  templateUrl: "./reset-password.component.html",
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private resetSvc = inject(ResetPasswordService);

  // estado
  loading = signal(false);
  success = signal(false);
  successMsg = signal("");
  serverError = signal<Error | null>(null);

  // token leído del query param
  token = signal<string>("");

  // visibilidad
  masked = signal(true);
  masked2 = signal(true);

  form = this.fb.group({
    passwordGroup: this.fb.group({
      password: ["", [Validators.required, Validators.minLength(6)]],
      confirm: ["", [Validators.required]],
    }, { validators: match })
  });

  ngOnInit(): void {
  const qToken = this.route.snapshot.queryParamMap.get("token") ?? "";
  if (qToken) this.token.set(qToken);   // 👈 pre-carga el token
}

  get fPassword()  { return this.form.get("passwordGroup.password")!; }
  get fConfirm()   { return this.form.get("passwordGroup.confirm")!; }
  get fGroup()     { return this.form.get("passwordGroup")!; }

  invalid(ctrl: AbstractControl) { return (ctrl.touched || ctrl.dirty) && ctrl.invalid; }

  toggleMask(which: 1 | 2) {
    which === 1 ? this.masked.update(v => !v) : this.masked2.update(v => !v);
  }

  onSubmit() {
    if (!this.token()) {
      this.serverError.set(new Error("Falta el token. Volvé a abrir el enlace del correo o pegá el token manualmente."));
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.serverError.set(null);
    this.success.set(false);
    this.successMsg.set("");

    const password = this.fPassword.value!;

    this.resetSvc.reset(this.token(), password).subscribe({
      next: (res) => {
        this.success.set(true);
        this.successMsg.set(res.message || "Contraseña restablecida con éxito.");
      },
      error: (err: Error) => {
        // Ejemplos del back: 400 "La contraseña debe tener al menos 6 caracteres."
        // 401 "Token inválido: Token inválido."
        this.serverError.set(err);
      },
      complete: () => this.loading.set(false),
    });
  }

  goToLogin() { this.router.navigateByUrl("/auth/login"); }
}
