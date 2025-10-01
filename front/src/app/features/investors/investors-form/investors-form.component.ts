import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { InvestorService } from '../../../core/services/investors.service';
import { Investor, Province } from '../../../models/investor.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-investor-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor],
  templateUrl: './investors-form.component.html',
  styleUrls: ['./investors-form.component.scss']
})
export class InvestorFormComponent {
  private service = inject(InvestorService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  provinces = Object.values(Province);

  // Signals
  successMessage = signal('');
  showModal = signal(false);
  usernameError = signal('');
  emailError = signal('');
  cuitError = signal('');

  form = this.fb.group({
    username: ['', [Validators.required, Validators.maxLength(100)]],
    password: ['', Validators.required],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    cuit: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
    contactPerson: ['', [Validators.required, Validators.maxLength(100)]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?\d{8,15}$/)]],
    webSite: ['', [Validators.maxLength(100)]],
    linkedinUrl: ['', Validators.pattern(/^(https?:\/\/).*$/)],
    description: ['', Validators.maxLength(500)],
    street: ['', Validators.required],
    number: ['', Validators.required],
    city: ['', Validators.required],
    province: ['', Validators.required],
    postalCode: ['', Validators.required]
  });

  onSubmit() {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    const f = this.form.getRawValue();
    const investorData: Partial<Investor> = {
      username: f.username!,
      password: f.password!,
      email: f.email!,
      cuit: f.cuit!,
      contactPerson: f.contactPerson!,
      phone: f.phone!,
      webSite: f.webSite!,
      address: {
        street: f.street!,
        number: Number(f.number),
        city: f.city!,
        province: f.province as Province, 
        postalCode: Number(f.postalCode)
      }
    };

    this.service.create(investorData).subscribe({
      next: () => {
        this.usernameError.set('');
        this.emailError.set('');
        this.cuitError.set('');
        this.successMessage.set('Inversor registrado correctamente!');
        this.showModal.set(true);

        this.form.reset();
        setTimeout(() => {
          this.showModal.set(false);
          this.router.navigateByUrl('/dashboard', { replaceUrl: true });
        }, 2000);
      },
      error: (err: any) => {
        this.usernameError.set('');
        this.emailError.set('');
        this.cuitError.set('');
        this.successMessage.set('');

        if (err.status === 400 && err.error?.message?.includes('ConstraintViolationException')) {
          const msg = err.error.message as string;
          if (msg.includes('investors.username')) this.usernameError.set('Username ya está en uso');
          if (msg.includes('investors.email')) this.emailError.set('Email ya está en uso');
          if (msg.includes('investors.cuit')) this.cuitError.set('CUIT ya está en uso');
        } else {
          this.successMessage.set('Error al registrar inversor.');
        }
      }
    });
  }

  getFieldError(field: string): string | null {
    const control = this.form.get(field);
    if (!control || !control.touched) return null;

    if (control.hasError('required')) return 'Este campo es obligatorio';
    if (control.hasError('maxlength')) return `Máximo ${control.getError('maxlength').requiredLength} caracteres`;
    if (control.hasError('minlength')) return `Mínimo ${control.getError('minlength').requiredLength} caracteres`;
    if (control.hasError('pattern')) return 'Formato inválido';
    if (control.hasError('email')) return 'Email inválido';

    return null;
  }
}
