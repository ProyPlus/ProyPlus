import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { ForgotPasswordService } from "../../../core/services/forgot-password.service"; // usa alias si tenés

@Component({
  standalone: true,
  selector: "app-forgot",
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: "./forgot.component.html",
})
export class ForgotComponent {
  private fb = inject(FormBuilder);
  private forgot = inject(ForgotPasswordService);

  loading = signal(false);
  ok = signal(false);
  error = signal(false);
  msg = signal("");

  form = this.fb.group({ email: ["", [Validators.required, Validators.email]] });

  invalid(ctrl: "email") {
    const c = this.form.get(ctrl)!;
    return (c.touched || c.dirty) && c.invalid;
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true); this.ok.set(false); this.error.set(false); this.msg.set("");

    const email = this.form.value.email!;
    this.forgot.requestReset(email).subscribe({
      next: (res) => {
        this.ok.set(true);
        this.msg.set(res.message || "Te enviamos un correo si el email existe.");
      },
      error: (err: Error) => {
        this.error.set(true);
        this.msg.set(err.message || "Error de comunicación.");
      },
      complete: () => this.loading.set(false),
    });
  }
}
