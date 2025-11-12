import { Component, ElementRef, ViewChild, inject, signal, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { Subscription } from "rxjs";
import { MessageService } from "primeng/api";
import { ToastModule } from "primeng/toast";
import { AuthService } from "./auth.service";
import type { AuthError } from "../shared/auth-errors";

@Component({
  standalone: true,
  selector: "app-login",
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ToastModule],
  templateUrl: "./login.component.html",
  styleUrls: ['./login.component.scss'],
  providers: [MessageService] // Añadir MessageService a los providers
})
export class LoginComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private auth = inject(AuthService);
  private messageService = inject(MessageService); // Inyectar MessageService

  @ViewChild("fileInput") fileInput!: ElementRef<HTMLInputElement>;

  form = this.fb.group({
    username: ["", [Validators.required]],
    password: ["", [Validators.required, Validators.minLength(6)]],
  });

  loading = signal(false);
  masked = signal(true);

  // imagen (opcional)
  previewDataUrl = signal<string | null>(null);
  dragOver = signal(false);

  private subs = new Subscription();

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  // ========= Imagen =========
  openFilePicker() { this.fileInput?.nativeElement.click(); }
  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => this.previewDataUrl.set(String(ev.target?.result ?? ""));
    reader.readAsDataURL(file);
  }
  onDragOver(e: DragEvent) { e.preventDefault(); this.dragOver.set(true); }
  onDragLeave() { this.dragOver.set(false); }
  onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragOver.set(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => this.previewDataUrl.set(String(ev.target?.result ?? ""));
    reader.readAsDataURL(file);
  }
  removeImage() {
    this.previewDataUrl.set(null);
    if (this.fileInput?.nativeElement) this.fileInput.nativeElement.value = "";
  }

  // ========= Validaciones UI =========
  showError(ctrl: "username" | "password") {
    const c = this.form.get(ctrl)!;
    return (c.touched || c.dirty) && c.invalid;
  }
  toggleMask() { this.masked.update(v => !v); }

  // ========= Submit =========
  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);

    const { username, password } = this.form.getRawValue();

    this.auth.login(username!, password!).subscribe({
      next: () => {
        // auth.login ya persiste la sesión; ahora leemos el rol
        const role = (this.auth.getUserRole() || '').toUpperCase();

        if (role.includes('INVESTOR')) {
          this.router.navigateByUrl('/marquesinas', { replaceUrl: true });
        } else if (role.includes('STUDENT')) {
          this.router.navigateByUrl('/misproyectos', { replaceUrl: true });
        } else {
          // fallback
          this.router.navigateByUrl('/marquesinas', { replaceUrl: true });
        }
      },
      error: (err) => {
        this.loading.set(false);
        
        // Lógica mejorada para mensajes de error amigables
        let errorMessage = 'Ocurrió un error inesperado. Por favor, intenta de nuevo.';

        // CORRECCIÓN: Primero verificamos el mensaje de cuenta desactivada, ya que también puede venir con status 401.
        if (err.detail?.includes('desactivada') || err.message?.includes('desactivada')) {
          errorMessage = 'Tu cuenta se encuentra inactiva. Contacta a soporte.';
        } else if (err.status === 401 || err.title?.includes('BadCredentialsException')) {
          errorMessage = 'El usuario o la contraseña son incorrectos.';
        } else if (err.detail?.includes('no fue encontrado') || err.message?.includes('no fue encontrado')) {
          errorMessage = 'El usuario o la contraseña son incorrectos.'; // Mismo mensaje que credenciales inválidas por seguridad
        }

        this.messageService.add({
          severity: 'error',
          summary: 'Error de Inicio de Sesión',
          detail: errorMessage,
          life: 5000 // El mensaje dura 5 segundos
        });
      },
      complete: () => this.loading.set(false),
    });
  }
}
