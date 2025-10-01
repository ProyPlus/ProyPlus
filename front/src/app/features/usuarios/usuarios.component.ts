import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { MultiSelectModule } from 'primeng/multiselect';
import { DividerModule } from 'primeng/divider';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';

import { UsersService, IUser } from '../../core/services/users.service';
import { RolesService, IRole } from '../../core/services/roles.service';

@Component({
  standalone: true,
  selector: 'app-usuarios',
  imports: [
    CommonModule, FormsModule,
    CardModule, ToolbarModule, ButtonModule, InputTextModule,
    TableModule, TagModule, ToastModule, ConfirmDialogModule,
    DialogModule, PasswordModule, CheckboxModule, MultiSelectModule,
    DividerModule, TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss']
})
export class UsuariosComponent implements OnInit {
  private svc = inject(UsersService);
  private rolesSvc = inject(RolesService);
  private toast = inject(MessageService);
  private confirm = inject(ConfirmationService);

  users: IUser[] = [];
  loading = false;
  globalFilter = '';

  // ===== Detalle (solo lectura) =====
  showDetail = false;
  selected: IUser | null = null;

  // ===== Modal Crear/Editar =====
  showDialog = false;
  isEdit = false;

  // Form model
  formModel: IUser = {
    id: 0,
    username: '',
    password: '',
    email: '',
    enabled: true,
    accountNotExpired: true,
    accountNotLocked: true,
    credentialNotExpired: true,
    mustChangePassword: true,
    rolesList: []
  };

  availableRoles: IRole[] = [];
  selectedRoles: IRole[] = [];

  ngOnInit(): void {
    this.reload();
    this.loadRoles();
  }

  loadRoles(): void {
    this.rolesSvc.getAll().subscribe({
      next: (roles) => this.availableRoles = roles || [],
      error: (err) => {
        console.error(err);
        this.toast.add({ severity: 'warn', summary: 'Roles', detail: 'No se pudieron cargar los roles' });
      }
    });
  }

  reload(): void {
    this.loading = true;
    this.svc.getAll().subscribe({
      next: (data: any[]) => {
        // Normaliza para aceptar 'roles' o 'rolesList' desde el backend
        this.users = (data || []).map(u => ({
          ...u,
          rolesList: u.rolesList ?? u.roles ?? []
        }));
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los usuarios' });
        console.error(err);
      }
    });
  }

  // ===== Ver detalle (solo lectura) =====
  onView(row: IUser) {
    this.selected = row;
    this.showDetail = true;
  }

  openNew(): void {
    this.isEdit = false;
    this.formModel = {
      id: 0,
      username: '',
      password: '',
      email: '',
      enabled: true,
      accountNotExpired: true,
      accountNotLocked: true,
      credentialNotExpired: true,
      mustChangePassword: true,
      rolesList: []
    };
    this.selectedRoles = [];
    this.showDialog = true;
  }

  edit(row: IUser): void {
    this.isEdit = true;
    this.formModel = {
      ...row,
      password: '' // nunca mostrar password real
    };
    this.selectedRoles = this.availableRoles.filter(ar => row.rolesList?.some(r => r.id === ar.id));
    this.showDialog = true;
  }

  save(form?: NgForm): void {
    if (form && form.invalid) {
      Object.values(form.controls).forEach(c => c.markAsTouched());
      this.toast.add({ severity: 'warn', summary: 'Validación', detail: 'Completá los campos obligatorios.' });
      return;
    }

    const isEdit = this.isEdit && !!this.formModel.id;
    const rolesById = (this.selectedRoles || []).map(r => ({ id: r.id }));

    if (!isEdit) {
      const payloadCreate: any = {
        username: this.formModel.username,
        password: this.formModel.password, // requerido en alta
        email: this.formModel.email,
        enabled: this.formModel.enabled,
        accountNotExpired: this.formModel.accountNotExpired,
        accountNotLocked: this.formModel.accountNotLocked,
        credentialNotExpired: this.formModel.credentialNotExpired,
        mustChangePassword: this.formModel.mustChangePassword,
        rolesList: rolesById
      };

      this.loading = true;
      this.svc.create(payloadCreate).subscribe({
        next: () => {
          this.toast.add({ severity: 'success', summary: 'Usuario', detail: 'Creado' });
          this.showDialog = false;
          this.reload();
        },
        error: (err) => {
          console.error(err);
          this.toast.add({ severity: 'error', summary: 'Usuario', detail: 'No se pudo crear' });
        },
        complete: () => (this.loading = false)
      });
      return;
    }

    const payloadUpdate: any = {
      id: this.formModel.id,
      username: this.formModel.username,
      email: this.formModel.email,
      enabled: this.formModel.enabled,
      accountNotExpired: this.formModel.accountNotExpired,
      accountNotLocked: this.formModel.accountNotLocked,
      credentialNotExpired: this.formModel.credentialNotExpired,
      mustChangePassword: this.formModel.mustChangePassword,
      rolesList: rolesById
    };

    if (this.formModel.password && this.formModel.password.trim() !== '') {
      payloadUpdate.password = this.formModel.password;
    }

    this.loading = true;
    this.svc.update(payloadUpdate).subscribe({
      next: () => {
        this.toast.add({ severity: 'success', summary: 'Usuario', detail: 'Actualizado' });
        this.showDialog = false;
        this.reload();
      },
      error: (err) => {
        console.error(err);
        this.toast.add({ severity: 'error', summary: 'Usuario', detail: 'No se pudo actualizar' });
      },
      complete: () => (this.loading = false)
    });
  }

  del(row: IUser): void {
    this.confirm.confirm({
      message: `¿Eliminar ${row.username}?`,
      accept: () =>
        this.toast.add({ severity: 'success', summary: 'Eliminado (mock)', detail: row.username })
    });
  }

  onDialogHide(): void {
    this.showDialog = false;
  }

// Paleta propia (hex). Podés ajustarla.
private readonly tagPalette: Array<{bg: string; fg: string}> = [
  { bg: '#22c55e', fg: '#ffffff' }, // green-500
  { bg: '#3b82f6', fg: '#ffffff' }, // blue-500
  { bg: '#f59e0b', fg: '#111111' }, // amber-500
  { bg: '#ef4444', fg: '#ffffff' }, // red-500
  { bg: '#a855f7', fg: '#ffffff' }, // purple-500
  { bg: '#14b8a6', fg: '#ffffff' }, // teal-500
  { bg: '#06b6d4', fg: '#111111' }, // cyan-500
];

/** Hash simple y determinístico por nombre de rol */
private hashRole(name: string): number {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Devuelve estilos inline (gana a cualquier override del tema) */
tagStyle(r: IRole, index: number) {
  const key = r?.role ?? String(index);
  const h = this.hashRole(key);
  const c = this.tagPalette[h % this.tagPalette.length];

  return {
    'background-color': c.bg,
    'color': c.fg,
    'border-color': 'transparent',
    'border-radius': '8px',
    'font-weight': 700,
    'padding': '0 .5rem'
  };
}}

