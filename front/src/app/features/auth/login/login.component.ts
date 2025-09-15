// src/app/features/auth/login/login.component.ts
import { Component, ElementRef, ViewChild, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router,RouterLink } from "@angular/router";
import { AuthService } from "./auth.service";


@Component({
  standalone: true,
  selector: "app-login",
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  // ====== TEMPLATE ======
  template: `
  <div class="min-h-screen bg-animated-gradient flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Burbujas animadas -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-10 left-20 w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm floating" style="animation-delay: 0s;"></div>
      <div class="absolute top-1/3 right-1/4 w-24 h-24 rounded-full bg-white/15 backdrop-blur-sm floating" style="animation-delay: 1s;"></div>
      <div class="absolute bottom-20 left-1/4 w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm floating" style="animation-delay: 2s;"></div>
      <div class="absolute top-1/4 right-20 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm floating" style="animation-delay: 3s;"></div>
    </div>

    <div class="relative w-full max-w-md">
      <!-- Card -->
      <div class="bg-white/20 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 hover:shadow-3xl">
        <div class="p-8">
          <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-white mb-2">Proy +</h1>
            <p class="text-white/80">Autenticación</p>
          </div>

          <!-- Upload imagen -->
          <div class="mb-6">
            <div
              class="image-upload-container border-2 border-dashed border-white/30 rounded-xl p-6 text-center cursor-pointer hover:border-white/50 transition-colors"
              (click)="openFilePicker()"
              (dragover)="onDragOver($event)"
              (dragleave)="onDragLeave()"
              (drop)="onDrop($event)"
              [class.bg-white/10]="dragOver()"
              [class.border-white/50]="dragOver()"
              *ngIf="!previewDataUrl()"
            >
              <div class="flex flex-col items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-white mb-3 pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <p class="text-white font-medium">Click para subir una imagen</p>
                <p class="text-white/60 text-sm mt-1">o arrastrá y soltá</p>
              </div>
              <input #fileInput type="file" class="hidden" accept="image/*" (change)="onFileSelected($event)" />
            </div>

            <!-- Preview -->
            <div *ngIf="previewDataUrl()" class="mt-4 flex justify-center">
              <div class="relative">
                <img [src]="previewDataUrl()!" alt="Preview" class="image-preview w-32 h-32 rounded-full object-cover border-4 border-white/30" />
                <button type="button"
                        (click)="removeImage()"
                        class="absolute -bottom-2 -right-2 bg-indigo-500 rounded-full p-2 shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
                        aria-label="Quitar imagen">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd"
                          d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
                          clip-rule="evenodd"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Form -->
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4" novalidate>
            <div class="relative">
              <input type="text"
                     formControlName="username"
                     autocomplete="username"
                     class="w-full bg-white/20 text-white placeholder-white/50 rounded-lg py-3 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/30 transition"
                     placeholder="Usuario"
                     [class.border-red-500]="showError('username')"
                     [attr.aria-invalid]="showError('username') ? true : null" />
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
              <p *ngIf="showError('username')" class="mt-1 text-xs text-red-200">Ingresá tu usuario.</p>
            </div>

            <div class="relative">
              <input [type]="masked() ? 'password' : 'text'"
                     formControlName="password"
                     autocomplete="current-password"
                     class="w-full bg-white/20 text-white placeholder-white/50 rounded-lg py-3 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/30 transition"
                     placeholder="Contraseña"
                     [class.border-red-500]="showError('password')"
                     [attr.aria-invalid]="showError('password') ? true : null" />
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>

              <button type="button"
                      (click)="toggleMask()"
                      class="absolute inset-y-0 right-0 pr-3 flex items-center text-white/80 hover:text-white text-sm">
                {{ masked() ? 'Mostrar' : 'Ocultar' }}
              </button>
              <p *ngIf="showError('password')" class="mt-1 text-xs text-red-200">Mínimo 6 caracteres.</p>
            </div>

            <button type="submit"
                    [disabled]="form.invalid || loading()"
                    class="w-full mt-2 bg-white text-indigo-600 py-3 px-4 rounded-lg font-semibold hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-500 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-60">
              <span *ngIf="!loading()">Entrar</span>
              <span *ngIf="loading()" class="inline-flex items-center gap-2">
                <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"></circle>
                  <path class="opacity-75" d="M4 12a8 8 0 018-8v4" stroke="currentColor"></path>
                </svg>
                Verificando…
              </span>
            </button>

            <p *ngIf="error()" class="text-sm text-red-200 text-center">Usuario o contraseña inválidos</p>

            <div class="mt-2 text-center">
              <a routerLink="/auth/forgot" class="text-white/70 hover:text-white text-sm transition">¿Olvidaste tu contraseña?</a>
            </div>
          </form>
        </div>
      </div>

      <div class="absolute -bottom-10 left-0 right-0 text-center">
        <p class="text-white/50 text-sm">¿No tenés cuenta?
          <a routerLink="/auth/register" class="text-white hover:underline">Registrate</a>
        </p>
      </div>
    </div>
  </div>
  `,
  // ====== ESTILOS LOCALES ======
  styles: [`
    @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
    @keyframes gradientBG { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }

    .bg-animated-gradient {
      background: linear-gradient(-45deg,#ee7752,#e73c7e,#23a6d5,#23d5ab);
      background-size: 400% 400%;
      animation: gradientBG 15s ease infinite;
    }
    .floating { animation: float 6s ease-in-out infinite; }
    .pulse { animation: pulse 2s cubic-bezier(0.4,0,0.6,1) infinite; }
    .image-upload-container { transition: all .3s ease; }
    .image-upload-container:hover { transform: scale(1.05); }
    .image-preview { transition: all .3s ease; filter: drop-shadow(0 10px 15px rgba(0,0,0,.3)); }
    .image-preview:hover { filter: drop-shadow(0 20px 25px rgba(0,0,0,.4)); }
  `],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private auth = inject(AuthService);

  @ViewChild("fileInput") fileInput!: ElementRef<HTMLInputElement>;

  form = this.fb.group({
    username: ["", [Validators.required]],
    password: ["", [Validators.required, Validators.minLength(6)]],
  });

  loading = signal(false);
  error = signal(false);
  masked = signal(true);

  // imagen (opcional, por si después la querés mandar al backend)
  previewDataUrl = signal<string | null>(null);
  dragOver = signal(false);

  openFilePicker() { this.fileInput?.nativeElement.click(); }

  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      this.previewDataUrl.set(String(ev.target?.result ?? ""));
      // animación simple
      // (el CSS ya tiene transitions en .image-preview)
    };
    reader.readAsDataURL(file);
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.dragOver.set(true);
  }
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

  showError(ctrl: "username" | "password") {
    const c = this.form.get(ctrl)!;
    return (c.touched || c.dirty) && c.invalid;
  }
  toggleMask() { this.masked.update(v => !v); }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set(false);

    const { username, password } = this.form.getRawValue();

    this.auth.login(username!, password!).subscribe({
      next: () => this.router.navigateByUrl("/home", { replaceUrl: true }),
      error: (err) => {
        console.error("Login error:", err);
        this.error.set(true);
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }
}
