import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { StudentService } from '../../../core/services/students.service';
import { DegreeStatus, University, Province, Student } from '../../../models/student.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor],
  templateUrl: './students-form.component.html',
  styleUrls: ['./students-form.component.scss']
})
export class StudentFormComponent {
  private service = inject(StudentService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  universities = Object.values(University);
  degreeStatuses = Object.values(DegreeStatus);
  provinces = Object.values(Province);

  // Signals para mensajes
  successMessage = signal('');
  showModal = signal(false);
  usernameError = signal('');
  emailError = signal('');
  dniError = signal('');

  form = this.fb.group({
    username: ['', [Validators.required, Validators.maxLength(100)]],
    password: ['', Validators.required],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    dni: ['', [Validators.required, Validators.maxLength(20)]],
    phone: ['', [Validators.required, Validators.maxLength(50)]],
    dateOfBirth: ['', Validators.required],
    career: ['', [Validators.required, Validators.maxLength(100)]],
    university: ['', Validators.required],
    degreeStatus: ['', Validators.required],
    street: ['', Validators.required],
    number: ['', Validators.required],
    city: ['', Validators.required],
    province: ['', Validators.required],
    postalCode: ['', Validators.required],
    linkedinUrl: ['', Validators.pattern(/^(https?:\/\/).*$/)],
    description: ['', Validators.maxLength(500)]
  });

  onSubmit() {
    // 1️⃣ Validaciones locales
    if (!this.form.valid) {
      this.form.markAllAsTouched(); // Marca campos inválidos
      return;
    }

    const f = this.form.getRawValue();
    const studentData: Partial<Student> = {
      username: f.username!,
      password: f.password!,
      email: f.email!,
      firstName: f.firstName!,
      lastName: f.lastName!,
      dni: f.dni!,
      phone: f.phone!,
      dateOfBirth: f.dateOfBirth!,
      career: f.career!,
      university: f.university! as University,
      degreeStatus: f.degreeStatus! as DegreeStatus,
      address: {
        street: f.street!,
        number: Number(f.number),
        city: f.city!,
        province: f.province! as Province,
        postalCode: Number(f.postalCode)
      },
      linkedinUrl: f.linkedinUrl!,
      description: f.description!
    };

    // 2️⃣ Crear usuario y manejar errores del backend
    this.service.create(studentData).subscribe({
      next: () => {
        this.usernameError.set('');
        this.emailError.set('');
        this.dniError.set('');

        this.successMessage.set('Usuario registrado correctamente!');
        this.showModal.set(true);

        this.form.reset();

        setTimeout(() => {
          this.showModal.set(false);
          this.router.navigateByUrl('/home-students', { replaceUrl: true });
        }, 2000);
      },
      error: (err: any) => {
        // Limpiar errores anteriores
        this.usernameError.set('');
        this.emailError.set('');
        this.dniError.set('');
        this.successMessage.set('');

        // Detectar duplicados desde backend
        if (err.status === 400 && err.error?.message?.includes('ConstraintViolationException')) {
          const msg = err.error.message as string;
          if (msg.includes('students.username')) this.usernameError.set('Username ya está en uso');
          if (msg.includes('students.email')) this.emailError.set('Email ya está en uso');
          if (msg.includes('students.dni')) this.dniError.set('DNI ya está en uso');
        } else {
          this.successMessage.set('Error al registrar usuario.');
        }
      }
    });
  }

  // Funciones auxiliares para mostrar errores de required/maxlength
  getFieldError(field: string): string | null {
    const control = this.form.get(field);
    if (!control || !control.touched) return null;

    if (control.hasError('required')) return 'Este campo es obligatorio';
    if (control.hasError('maxlength')) return `Máximo ${control.getError('maxlength').requiredLength} caracteres`;
    if (control.hasError('email')) return 'Email inválido';
    if (control.hasError('pattern')) return 'Formato inválido';

    return null;
  }
}
