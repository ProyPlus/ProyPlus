// src/app/features/roles/roles.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { DividerModule } from 'primeng/divider';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';

import { of } from 'rxjs';

import { RolesService, IRole, IPermission } from '../../core/services/roles.service';
import { PermissionsService, IPermissionDTO } from '../../core/services/permissions.service';

// Para mostrar chips desde la tabla (vienen de roles.permissionsList)
type PermissionLike = IPermission & Partial<{
  name: string;
  permission: string;
  permissionName: string;
  code: string;
  label: string;
}>;

@Component({
  standalone: true,
  selector: 'app-roles',
  imports: [
    CommonModule, FormsModule,
    ToolbarModule, ButtonModule, InputTextModule,
    TableModule, TagModule, ToastModule, ConfirmDialogModule,
    DialogModule, MultiSelectModule, DividerModule, CardModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss']
})
export class RolesComponent implements OnInit {
  // Servicios
  private svc = inject(RolesService);
  private permsSvc = inject(PermissionsService);
  private toast = inject(MessageService);
  private confirm = inject(ConfirmationService);

  // Estado tabla
  roles: IRole[] = [];
  loading = false;

  // Detalle
  showDetail = false;
  selected: IRole | null = null;

  // Crear/Editar
  showDialog = false;
  isEdit = false;

  // Form model
  formModel: IRole = {
    id: 0,
    role: '',
    permissionsList: []
  };

  // Combo de permisos (desde /api/permissions)
  availablePermissions: IPermissionDTO[] = [];
  selectedPermissions: IPermissionDTO[] = [];

  ngOnInit(): void {
    this.reload();          // carga roles para la grilla
    this.loadPermissions(); // carga permisos para el multiselect
  }

  // === Carga roles (tabla) ===
  reload(): void {
    this.loading = true;
    this.svc.getAll().subscribe({
      next: (data: any[]) => {
        // Normaliza 'permissions' o 'permissionsList'
        this.roles = (data || []).map(r => ({
          ...r,
          permissionsList: r.permissionsList ?? r.permissions ?? []
        }));
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los roles' });
        console.error(err);
      }
    });
  }

  // === Carga permisos (combo) desde /api/permissions ===
  loadPermissions(): void {
    this.permsSvc.getAll().subscribe({
      next: (perms) => { this.availablePermissions = perms || []; },
      error: (err: any) => {
        console.error('Error cargando permisos', err);
        this.availablePermissions = [];
      }
    });
  }

  // ===== Helpers para etiquetas de chips/tabla =====
  private permLabel(p: PermissionLike, index = 0): string {
    // prioriza permissionName del backend
    return (
      p?.permissionName ??
      p?.label ??
      p?.name ??
      p?.permission ??
      (p as any)?.displayName ??
      (p as any)?.code ??
      `Permiso ${p?.id ?? index}`
    ) as string;
  }

  displayPerm(p: any, index = 0): string {
    return this.permLabel(p as PermissionLike, index);
  }

  // ===== Acciones UI =====
  onView(row: IRole) {
    this.selected = row;
    this.showDetail = true;
  }

  openNew(): void {
    this.isEdit = false;
    this.formModel = { id: 0, role: '', permissionsList: [] };
    this.selectedPermissions = [];
    this.showDialog = true;
  }

  edit(row: IRole): void {
    this.isEdit = true;
    this.formModel = { ...row };

    const setSelection = () => {
      // seleccionamos por ID, porque el endpoint devuelve { id, permissionName }
      const ids = new Set((row.permissionsList || []).map((p: any) => p.id));
      this.selectedPermissions = this.availablePermissions.filter(ap => ids.has(ap.id));
    };

    if (this.availablePermissions.length) {
      setSelection();
    } else {
      // si todavía no llegaron los permisos, los traemos y luego seteamos la selección
      this.permsSvc.getAll().subscribe({
        next: (perms) => { this.availablePermissions = perms || []; setSelection(); },
        error: () => { this.availablePermissions = []; }
      });
    }

    this.showDialog = true;
  }

  save(form?: NgForm): void {
    if (form && form.invalid) {
      Object.values(form.controls).forEach(c => c.markAsTouched());
      this.toast.add({ severity: 'warn', summary: 'Validación', detail: 'Completá los campos obligatorios.' });
      return;
    }

    const isEdit = this.isEdit && !!this.formModel.id;

    // El backend espera objetos { id } para permissionsList
    const permsPayload = (this.selectedPermissions || []).map(p => ({ id: p.id }));

    if (!isEdit) {
      const payloadCreate: any = {
        role: this.formModel.role,
        permissionsList: permsPayload
      };

      this.loading = true;

      const apiCreate =
        (this.svc as any).create ||
        (this.svc as any).save ||
        (this.svc as any).add ||
        (this.svc as any).post;

      const obs = typeof apiCreate === 'function'
        ? apiCreate.call(this.svc, payloadCreate)
        : of(null);

      obs.subscribe({
        next: () => {
          this.toast.add({ severity: 'success', summary: 'Rol', detail: 'Creado' });
          this.showDialog = false;
          this.reload();
        },
        error: (err: any) => {
          console.error(err);
          this.toast.add({ severity: 'error', summary: 'Rol', detail: 'No se pudo crear' });
        },
        complete: () => (this.loading = false)
      });
      return;
    }

    const payloadUpdate: any = {
      id: this.formModel.id,
      role: this.formModel.role,
      permissionsList: permsPayload
    };

    this.loading = true;

    const apiUpdate =
      (this.svc as any).update ||
      (this.svc as any).put ||
      (this.svc as any).patch ||
      (this.svc as any).save;

    const obs = typeof apiUpdate === 'function'
      ? apiUpdate.call(this.svc, payloadUpdate)
      : of(null);

    obs.subscribe({
      next: () => {
        this.toast.add({ severity: 'success', summary: 'Rol', detail: 'Actualizado' });
        this.showDialog = false;
        this.reload();
      },
      error: (err: any) => {
        console.error(err);
        this.toast.add({ severity: 'error', summary: 'Rol', detail: 'No se pudo actualizar' });
      },
      complete: () => (this.loading = false)
    });
  }

  del(row: IRole): void {
    this.confirm.confirm({
      message: `¿Eliminar el rol "${row.role}"?`,
      accept: () => {
        // Si tu servicio tiene delete(row.id) activalo acá; por ahora mock:
        this.toast.add({ severity: 'success', summary: 'Eliminado (mock)', detail: row.role });
      }
    });
  }

  onDialogHide(): void {
    this.showDialog = false;
  }

  // ===== Estilos para chips (determinístico)
  private readonly tagPalette: Array<{ bg: string; fg: string }> = [
    { bg: '#22c55e', fg: '#ffffff' }, // green-500
    { bg: '#3b82f6', fg: '#ffffff' }, // blue-500
    { bg: '#f59e0b', fg: '#111111' }, // amber-500
    { bg: '#ef4444', fg: '#ffffff' }, // red-500
    { bg: '#a855f7', fg: '#ffffff' }, // purple-500
    { bg: '#14b8a6', fg: '#ffffff' }, // teal-500
    { bg: '#06b6d4', fg: '#111111' }  // cyan-500
  ];

  private hashKey(str: string): number {
    let h = 0;
    for (let i = 0; i < (str || '').length; i++) {
      h = (h * 31 + str.charCodeAt(i)) >>> 0;
    }
    return h;
  }

  tagStyle(p: any, index: number) {
    const key = this.permLabel(p as PermissionLike, index);
    const h = this.hashKey(key);
    const c = this.tagPalette[h % this.tagPalette.length];

    return {
      'background-color': c.bg,
      'color': c.fg,
      'border-color': 'transparent',
      'border-radius': '8px',
      'font-weight': 700,
      'padding': '0 .5rem'
    };
  }
}
