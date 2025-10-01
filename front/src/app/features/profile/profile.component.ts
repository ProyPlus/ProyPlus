// src/app/features/profile/profile.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TagModule } from 'primeng/tag';

import { AuthService } from '../auth/login/auth.service';
import { StudentService } from '../../core/services/students.service';
import { InvestorService } from '../../core/services/investors.service';

type UserType = 'STUDENT' | 'INVESTOR';
type AnyObj = Record<string, any>;

@Component({
  standalone: true,
  selector: 'app-profile',
  imports: [
    CommonModule, ReactiveFormsModule,
    CardModule, InputTextModule, ButtonModule, DividerModule, ToastModule, TagModule
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  providers: [MessageService]
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private toast = inject(MessageService);
  private auth = inject(AuthService);
  private students = inject(StudentService);
  private investors = inject(InvestorService);

  loading = signal(false);
  saving  = signal(false);

  userType: UserType | null = null;
  userId!: number;
  userEmail = '';

  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName:  ['', [Validators.required, Validators.minLength(2)]],
    address:   [''],
    email:     [{ value: '', disabled: true }]
  });

  ngOnInit(): void {
    const me = this.getMe();
    if (!me) {
      this.toast.add({ severity: 'error', summary: 'Perfil', detail: 'No se encontró la sesión de usuario.' });
      return;
    }
    this.userId = Number(me.id ?? me.userId ?? 0);
    this.userEmail = this.pickEmail(me) || '';

    const rawRoles = (me.roles ?? me.rolesList ?? me.authorities ?? []) as any[];
    const roles: string[] = rawRoles.map(r => (typeof r === 'string' ? r : r?.role ?? r?.authority)).filter(Boolean);

    this.userType = roles.includes('STUDENT') ? 'STUDENT'
                  : roles.includes('INVESTOR') ? 'INVESTOR'
                  : null;

    this.loadProfile();
  }

  /** Intenta varias fuentes para el usuario actual */
  private getMe(): any {
    const a = this.auth as any;
    const direct = a.currentUser ?? a.me ?? a.session ?? a.state ?? a.value;
    const callable = a.getUser?.() ?? a.user?.() ?? a.getCurrentUser?.();
    if (direct) return direct;
    if (callable) return callable;
    // JWT o usuario serializado
    const token = localStorage.getItem('auth:token') || localStorage.getItem('token') || '';
    try {
      const [, payload] = token.split('.');
      if (payload) return JSON.parse(atob(payload));
    } catch {}
    const stored = localStorage.getItem('auth:user') || localStorage.getItem('user');
    try { if (stored) return JSON.parse(stored); } catch {}
    return null;
  }

  private pickEmail(x: AnyObj): string {
    return x?.email || x?.username || x?.sub || x?.user?.email || '';
  }

  /** Pública, la llama el botón "Cancelar" */
  loadProfile() {
    if (!this.userType) {
      this.toast.add({ severity: 'error', summary: 'Perfil', detail: 'No se pudo determinar el rol del usuario.' });
      return;
    }
    this.loading.set(true);

    const handleOk = (rec: AnyObj | null, kind: UserType) => {
      if (!rec) {
        this.toast.add({ severity: 'warn', summary: 'Perfil', detail: 'No se encontraron datos para tu perfil.' });
        this.loading.set(false);
        return;
      }
      // ------ mapeo robusto (soporta campos anidados/alternativos)
      const src = rec as AnyObj;
      const user = src.user ?? {};
      const firstName = src.firstName ?? src.name ?? user.firstName ?? user.name ?? '';
      const lastName  = src.lastName  ?? src.surname ?? user.lastName  ?? user.surname ?? '';
      const email     = this.pickEmail(src) || this.pickEmail(user) || this.userEmail || '';

      const addrObj = src.address ?? user.address ?? null;
      let address = '';
      if (typeof addrObj === 'string') address = addrObj;
      else if (addrObj) {
        address = [addrObj.line1 ?? addrObj.street, addrObj.line2, addrObj.city, addrObj.state]
          .filter(Boolean)
          .join(' ');
      }

      this.form.patchValue({ firstName, lastName, address, email });
      this.loading.set(false);
    };

    const handleErr = (err: any) => {
      console.error(err);
      this.toast.add({ severity: 'error', summary: 'Perfil', detail: 'No se pudieron cargar los datos.' });
      this.loading.set(false);
    };

    if (this.userType === 'INVESTOR') {
      // ✔️ Buscar por email en /investors (más confiable que ID)
      this.investors.loadAll().subscribe({
        next: (list) => {
          const rec =
            list.find(i => (i as any)?.email === this.userEmail) ||
            list.find(i => (i as any)?.user?.email === this.userEmail) ||
            list.find(i => (i as any)?.userId === this.userId);
          if (!rec && this.userId) {
            // último intento por ID (por si coinciden)
            this.investors.getById(this.userId).subscribe({
              next: (r) => handleOk(r as AnyObj, 'INVESTOR'),
              error: handleErr
            });
          } else {
            handleOk(rec as AnyObj ?? null, 'INVESTOR');
          }
        },
        error: handleErr
      });
    } else {
      this.students.loadAll().subscribe({
        next: (list) => {
          const rec =
            list.find(s => (s as any)?.email === this.userEmail) ||
            list.find(s => (s as any)?.user?.email === this.userEmail) ||
            list.find(s => (s as any)?.userId === this.userId);
          if (!(rec) && this.userId && (this.students as any).getById) {
            (this.students as any).getById(this.userId).subscribe({
              next: (r: AnyObj) => handleOk(r, 'STUDENT'),
              error: handleErr
            });
          } else {
            handleOk(rec as AnyObj ?? null, 'STUDENT');
          }
        },
        error: handleErr
      });
    }
  }

  save() {
    if (this.form.invalid || !this.userType) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);

    const addressStr = (this.form.value.address ?? '').toString().trim();
    const addressObject = addressStr ? ({ line1: addressStr } as any) : undefined;

    const base = {
      firstName: this.form.value.firstName?.trim(),
      lastName:  this.form.value.lastName?.trim()
    };

    const payload: any = { ...base, ...(addressObject ? { address: addressObject } : {}) };

    const onOk = () => {
      this.toast.add({ severity: 'success', summary: 'Perfil', detail: 'Datos actualizados.' });
      this.saving.set(false);
      this.loadProfile();
    };
    const onErr = (err: any) => {
      console.error(err);
      this.toast.add({ severity: 'error', summary: 'Perfil', detail: 'No se pudo guardar.' });
      this.saving.set(false);
    };

    // Para actualizar necesitamos el ID REAL del perfil. Lo resolvemos igual que al cargar.
    const afterResolveAndUpdate = (rec: AnyObj | null) => {
      const id = Number((rec as any)?.id ?? (rec as any)?.profileId ?? (rec as any)?.userId ?? this.userId);
      if (!id) {
        this.toast.add({ severity: 'error', summary: 'Perfil', detail: 'No se pudo identificar el registro a actualizar.' });
        this.saving.set(false);
        return;
      }
      if (this.userType === 'INVESTOR') this.investors.update(id, payload).subscribe({ next: onOk, error: onErr });
      else this.students.update(id, payload).subscribe({ next: onOk, error: onErr });
    };

    // Resolución del registro actual para obtener su id correcto
    if (this.userType === 'INVESTOR') {
      this.investors.loadAll().subscribe({
        next: (list) => {
          const rec =
            list.find(i => (i as any)?.email === this.userEmail) ||
            list.find(i => (i as any)?.user?.email === this.userEmail) ||
            list.find(i => (i as any)?.userId === this.userId) || null;
          afterResolveAndUpdate(rec);
        },
        error: onErr
      });
    } else {
      this.students.loadAll().subscribe({
        next: (list) => {
          const rec =
            list.find(s => (s as any)?.email === this.userEmail) ||
            list.find(s => (s as any)?.user?.email === this.userEmail) ||
            list.find(s => (s as any)?.userId === this.userId) || null;
          afterResolveAndUpdate(rec);
        },
        error: onErr
      });
    }
  }
}
