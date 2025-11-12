import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, AsyncValidatorFn } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { map, catchError, debounceTime, switchMap, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';

import { InvestorService } from '../../../core/services/investors.service';
import { AuthService } from '../../auth/login/auth.service';
import { Investor, Province } from '../../../models/investor.model';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-investors-update-form',
  templateUrl: './investors-update-form.component.html',
  styleUrls: ['./investors-update-form.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule, CommonModule, ToastModule, 
    CardModule, ButtonModule, InputTextModule, TooltipModule, ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService]
})
export class InvestorsUpdateFormComponent implements OnInit {
  investorsUpdateForm!: FormGroup;
  investor!: Investor;
  isLoading = false;
  originalEmail: string = '';

  provinces: { label: string, value: Province }[];

  get addressFormGroup(): FormGroup {
    return this.investorsUpdateForm.get('address') as FormGroup;
  }

  constructor(
    private fb: FormBuilder,
    private investorService: InvestorService,
    private http: HttpClient,
    private auth: AuthService,
    private router: Router,
    private toast: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.provinces = Object.values(Province).map(prov => ({ label: this.formatProvinceForDisplay(prov), value: prov }));
  }

  ngOnInit(): void {
    this.buildForm({} as Investor);
    const userId = this.auth.userId;
    const role = this.auth.getUserRole();

    if (role === 'ROLE_INVESTOR' && userId) {
      this.isLoading = true;
      this.investorService.getById(userId).subscribe({
        next: (investor) => {
          this.investor = investor;
          this.originalEmail = investor.email;
          this.buildForm(investor);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error cargando inversor:', err);
          this.isLoading = false;
          this.router.navigateByUrl('/dashboard');
        }
      });
    } else {
      this.router.navigateByUrl('/dashboard');
    }
  }

  private buildForm(investor: Investor) {
    this.investorsUpdateForm = this.fb.group({
      username: [{ value: investor.username ?? '', disabled: true }, [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: [investor.email ?? '',
        [Validators.required, Validators.email],
        [this.emailValidator()]
      ],
      cuit: [{ value: investor.cuit ?? '', disabled: true }, [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
      contactPerson: [investor.contactPerson ?? '', [Validators.required, Validators.maxLength(100), Validators.pattern('^[a-zA-ZÀ-ÿ\\s]*$')]],
      phone: [investor.phone ?? '', [Validators.required, Validators.pattern(/^\+?\d{8,15}$/)]],
      webSite: [investor.webSite ?? '', [Validators.maxLength(100)]],
      linkedinUrl: [investor.linkedinUrl ?? '', [Validators.pattern(/^(https?:\/\/.*|linkedin\.com\/.*)?$/)]],
      description: [investor.description ?? '', Validators.maxLength(500)],
      address: this.fb.group({
        street: [investor.address?.street ?? '', Validators.required],
        number: [investor.address?.number ?? '', Validators.required],
        city: [investor.address?.city ?? '', Validators.required],
        province: [investor.address?.province ?? '', Validators.required],
        postalCode: [investor.address?.postalCode ?? null, Validators.required]
      })
    });
  }

  guardar() {
    if (this.investorsUpdateForm.invalid) {
      this.investorsUpdateForm.markAllAsTouched();
      this.toast.add({ severity: 'warn', summary: 'Atención', detail: 'Por favor, completa todos los campos requeridos.' });
      return;
    }

    const formValue = this.investorsUpdateForm.getRawValue();
    const apiUrl = `/api/investors/${this.investor.id}`;

    this.http.patch(apiUrl, formValue).subscribe({
      next: () => {
        this.toast.add({ severity: 'success', summary: 'Éxito', detail: 'Perfil actualizado correctamente' });
        setTimeout(() => {
          this.router.navigateByUrl('/dashboard'); // O la ruta que corresponda
        }, 2000);
      },
      error: (err) => {
        console.error('Error actualizando perfil:', err);
        this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el perfil. Inténtalo de nuevo.' });
      }
    });
  }

  cancelar() {
    this.router.navigateByUrl('/dashboard');
  }

  confirmDeleteAccount() {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas eliminar tu cuenta? Esta acción es irreversible y tus datos no podrán ser recuperados.',
      header: 'Confirmación de Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'No, cancelar',
      accept: () => {
        this.isLoading = true;
        const apiUrl = `/api/investors/desactivate/${this.investor.id}`;
        this.http.patch(apiUrl, {}).subscribe({
          next: () => {
            this.toast.add({ severity: 'success', summary: 'Cuenta Eliminada', detail: 'Tu cuenta ha sido eliminada. Serás redirigido.' });
            setTimeout(() => {
              this.auth.logout();
              this.router.navigateByUrl('/auth/login');
            }, 2500);
          },
          error: (err) => {
            this.isLoading = false;
            let detail = 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.';
            if (err.status === 409) { // 409 Conflict
              detail = 'No es posible eliminar tu cuenta porque tienes inversiones o contratos activos. Para proceder, por favor, contacta a soporte para obtener asistencia.';
            } else if (err.error?.message) {
              detail = err.error.message;
            }
            this.toast.add({ severity: 'error', summary: 'Error al Eliminar', detail: detail, life: 7000 });
          }
        });
      }
    });
  }

  private formatProvinceForDisplay(enumValue: string): string {
    return enumValue.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  }

  isInvalidField(field: string, formGroup?: FormGroup): boolean {
    const form = formGroup || this.investorsUpdateForm;
    const control = form.get(field);
    return !!(control && control.invalid && control.touched);
  }

  getFieldError(field: string, formGroup?: FormGroup): string | null {
    const form = formGroup || this.investorsUpdateForm;
    const control = form.get(field);
    if (!control || !control.errors) return null;

    const errors = control.errors;

    if (errors['required']) return 'Este campo es obligatorio';
    if (errors['minlength']) return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    if (errors['maxlength']) return `Máximo ${errors['maxlength'].requiredLength} caracteres`;
    if (errors['email']) return 'Email inválido';
    if (errors['pattern']) return 'Formato inválido';
    if (errors['emailExists']) return 'El email ya está en uso.';

    return null;
  }

  private emailValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value || control.value === this.originalEmail) {
        return of(null);
      }
      return of(control.value).pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(value => this.http.get<boolean>(`/api/users/check-email/${value}`)),
        map(exists => (exists ? { emailExists: true } : null)),
        catchError(() => of(null))
      );
    };
  }
}