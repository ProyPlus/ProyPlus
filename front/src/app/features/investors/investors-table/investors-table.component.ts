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
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';

import { HttpClient } from '@angular/common/http';

// 👇 desde features/investors → core/services (dos niveles)
import { InvestorService } from '../../../core/services/investors.service';

interface IAddress {
  street: string;
  number: number;
  city: string;
  province: string;
  postalCode: number;
}

interface IInvestorView {
  id: number;
  username: string;
  email: string;
  photoUrl?: string | null;

  enabled: boolean;
  accountNotExpired: boolean;
  accountNotLocked: boolean;
  credentialNotExpired: boolean;

  cuit?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  webSite?: string | null;

  // 👇 NO opcional
  address: IAddress;

  password?: string;
}

@Component({
  standalone: true,
  selector: 'app-investors',
  imports: [
    CommonModule, FormsModule,
    CardModule, ToolbarModule, ButtonModule, InputTextModule,
    TableModule, TagModule, ToastModule, ConfirmDialogModule,
    DialogModule, PasswordModule, CheckboxModule, DividerModule, TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './investors-table.component.html',
  styleUrls: ['./investors-table.component.scss']
})
export class InvestorsComponent implements OnInit {
  private svc = inject(InvestorService);
  private toast = inject(MessageService);
  private confirm = inject(ConfirmationService);
  private http = inject(HttpClient);

  // relativo (proxy)
  private apiUrl = '/api/investors';

  investors: IInvestorView[] = [];
  loading = false;

  showDetail = false;
  selected: IInvestorView | null = null;

  showDialog = false;
  isEdit = false;

  formModel: IInvestorView = this.emptyForm();

  ngOnInit(): void { this.reload(); }
 private defaultAddress(): IAddress {
    return { street: '', number: 0, city: '', province: '', postalCode: 0 };
  }

  private emptyForm(): IInvestorView {
    return {
      id: 0,
      username: '',
      email: '',
      password: '',
      enabled: true,
      accountNotExpired: true,
      accountNotLocked: true,
      credentialNotExpired: true,
      photoUrl: null,
      cuit: '',
      contactPerson: '',
      phone: '',
      webSite: '',
      address: this.defaultAddress(),
    };
  }

  private normalize(dto: any): IInvestorView {
    return {
      id: dto?.id ?? 0,
      username: dto?.username ?? '',
      email: dto?.email ?? '',
      enabled: dto?.enabled ?? true,
      accountNotExpired: dto?.accountNotExpired ?? true,
      accountNotLocked: dto?.accountNotLocked ?? true,
      credentialNotExpired: dto?.credentialNotExpired ?? true,
      photoUrl: dto?.photoUrl ?? null,
      cuit: dto?.cuit ?? '',
      contactPerson: dto?.contactPerson ?? '',
      phone: dto?.phone ?? '',
      webSite: dto?.webSite ?? '',
      address: dto?.address ?? this.defaultAddress(),  // ✅ fallback objeto
      password: ''
    };
  }

  reload(): void {
    this.loading = true;
    this.svc.loadAll().subscribe({
      next: (data) => {
        this.investors = (data || []).map(d => this.normalize(d));
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.toast.add({ severity: 'error', summary: 'Investors', detail: 'No se pudieron cargar' });
      }
    });
  }

  onView(row: IInvestorView) { this.selected = row; this.showDetail = true; }

  openNew(): void {
    this.isEdit = false;
    this.formModel = this.emptyForm();
    this.showDialog = true;
  }

 
  edit(row: IInvestorView): void {
    this.isEdit = true;
    this.formModel = {
      ...row,
      password: '',
      address: row.address ?? this.defaultAddress(),   // ✅ asegurado
    };
    this.showDialog = true;
  }

  save(form?: NgForm): void {
    if (form && form.invalid) {
      Object.values(form.controls).forEach(c => c.markAsTouched());
      this.toast.add({ severity: 'warn', summary: 'Validación', detail: 'Completá los campos obligatorios.' });
      return;
    }

    const isEdit = this.isEdit && !!this.formModel.id;

    if (!isEdit) {
      const payload: any = {
        username: this.formModel.username,
        email: this.formModel.email,
        password: this.formModel.password, // si tu backend lo pide al crear
        enabled: this.formModel.enabled,
        accountNotExpired: this.formModel.accountNotExpired,
        accountNotLocked: this.formModel.accountNotLocked,
        credentialNotExpired: this.formModel.credentialNotExpired,
        cuit: this.formModel.cuit,
        contactPerson: this.formModel.contactPerson,
        phone: this.formModel.phone,
        webSite: this.formModel.webSite,
        address: this.formModel.address
      };

      this.loading = true;
      this.svc.create(payload).subscribe({
        next: () => {
          this.toast.add({ severity: 'success', summary: 'Investor', detail: 'Creado' });
          this.showDialog = false;
          this.reload();
        },
        error: (err) => {
          console.error(err);
          this.toast.add({ severity: 'error', summary: 'Investor', detail: 'No se pudo crear' });
        },
        complete: () => (this.loading = false)
      });
      return;
    }

    const body: any = {
      username: this.formModel.username,
      email: this.formModel.email,
      enabled: this.formModel.enabled,
      accountNotExpired: this.formModel.accountNotExpired,
      accountNotLocked: this.formModel.accountNotLocked,
      credentialNotExpired: this.formModel.credentialNotExpired,
      cuit: this.formModel.cuit,
      contactPerson: this.formModel.contactPerson,
      phone: this.formModel.phone,
      webSite: this.formModel.webSite,
      address: this.formModel.address
    };
    if (this.formModel.password && this.formModel.password.trim() !== '') {
      body.password = this.formModel.password;
    }

    this.loading = true;
    this.svc.update(this.formModel.id, body).subscribe({
      next: () => {
        this.toast.add({ severity: 'success', summary: 'Investor', detail: 'Actualizado' });
        this.showDialog = false;
        this.reload();
      },
      error: (err) => {
        console.error(err);
        this.toast.add({ severity: 'error', summary: 'Investor', detail: 'No se pudo actualizar' });
      },
      complete: () => (this.loading = false)
    });
  }

  toggleActive(row: IInvestorView, enable: boolean): void {
    this.confirm.confirm({
      message: `${enable ? '¿Activar' : '¿Desactivar'} ${row.username}?`,
      accept: () => {
        // primero intento endpoints dedicados
        const obs = enable ? this.svc.activate(row.id) : this.svc.deactivate(row.id);
        obs.subscribe({
          next: () => {
            this.toast.add({ severity: enable ? 'success' : 'warn', summary: 'Investor', detail: enable ? 'Activado' : 'Desactivado' });
            this.reload();
          },
          error: () => {
            // fallback: PUT con enabled
            this.svc.update(row.id, { enabled: enable }).subscribe({
              next: () => {
                this.toast.add({ severity: enable ? 'success' : 'warn', summary: 'Investor', detail: enable ? 'Activado' : 'Desactivado' });
                this.reload();
              },
              error: (err2) => {
                console.error(err2);
                this.toast.add({ severity: 'error', summary: 'Investor', detail: 'Operación fallida' });
              }
            });
          }
        });
      }
    });
  }

  onDialogHide(): void { this.showDialog = false; }

  // (misma estética de tags que el resto; aquí no hay roles pero dejamos helper por consistencia)
  private readonly tagPalette: Array<{bg: string; fg: string}> = [
    { bg: '#22c55e', fg: '#ffffff' }, { bg: '#3b82f6', fg: '#ffffff' }, { bg: '#f59e0b', fg: '#111111' },
    { bg: '#ef4444', fg: '#ffffff' }, { bg: '#a855f7', fg: '#ffffff' }, { bg: '#14b8a6', fg: '#ffffff' },
    { bg: '#06b6d4', fg: '#111111' },
  ];
  private hashRole(name: string): number { let h=0; for (let i=0;i<(name||'').length;i++) h=(h*31+name.charCodeAt(i))>>>0; return h; }
  tagStyle(_: any, i: number) {
    const c = this.tagPalette[i % this.tagPalette.length];
    return { 'background-color': c.bg, 'color': c.fg, 'border-color': 'transparent', 'border-radius': '8px', 'font-weight': 700, 'padding': '0 .5rem' };
  }
  
}
