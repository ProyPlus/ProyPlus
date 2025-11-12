import { Component, EventEmitter, inject, Input, Output, signal, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { StudentService } from '../../../core/services/students.service';
import { DegreeStatus, University, Province, Student } from '../../../models/student.model';
import { Router, RouterLink } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// PrimeNG
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { KeyFilterModule } from 'primeng/keyfilter';
import { of } from 'rxjs';
import { map, catchError, debounceTime, switchMap, distinctUntilChanged } from 'rxjs/operators';

/**
 * Validador personalizado para asegurar que la fecha sea anterior a la fecha actual.
 * @param control El control del formulario a validar.
 */
export function pastDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null; // No validar si no hay valor
  }
  const controlDate = new Date(control.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Comparar solo fechas, sin la hora
  return controlDate < today ? null : { futureDate: true };
}

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor, RouterLink, InputTextModule, ButtonModule, KeyFilterModule, TooltipModule, ToastModule],
  providers: [MessageService],
  templateUrl: './students-form.component.html',
  styleUrls: ['./students-form.component.scss']
})
export class StudentFormComponent implements OnInit {
  private service = inject(StudentService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private toast = inject(MessageService);
  private http = inject(HttpClient);

  /** Si es true, el componente se comporta como un modal (no redirige, emite evento) */
  @Input() isModal = false;

  /** Evento que se emite cuando se crea un estudiante con éxito en modo modal */
  @Output() userCreated = new EventEmitter<void>();

  universities: { label: string, value: University }[];
  degreeStatuses: { label: string, value: DegreeStatus }[];
  provinces: { label: string, value: Province }[];

  constructor() {
    this.universities = Object.values(University).map(uni => ({ label: uni.replace(/_/g, ' '), value: uni }));
    this.provinces = Object.values(Province).map(prov => ({ label: this.formatProvinceForDisplay(prov), value: prov }));
    this.degreeStatuses = [
      { label: 'En curso', value: DegreeStatus.IN_PROGRESS },
      { label: 'Completado', value: DegreeStatus.COMPLETED },
      { label: 'Suspendido', value: DegreeStatus.SUSPENDED },
      { label: 'Abandonado', value: DegreeStatus.ABANDONED }
    ];
  }

  // Signals para mensajes
  successMessage = signal('');
  showModal = signal(false);

  form!: FormGroup; // Declaramos el formulario sin inicializarlo aquí

  ngOnInit() {
    this.form = this.fb.group({
      username: ['',
        [Validators.required, Validators.minLength(3), Validators.maxLength(50)], // Validadores síncronos
        [this.usernameValidator()] // Validadores asíncronos
      ],
      password: ['', [Validators.required, Validators.minLength(6)]],
      email: ['',
        [Validators.required, Validators.email, Validators.maxLength(100)],
        [this.emailValidator()]
      ],
      firstName: ['', [Validators.required, Validators.maxLength(100), Validators.pattern('^[a-zA-ZÀ-ÿ\\s]*$')]],
      lastName: ['', [Validators.required, Validators.maxLength(100), Validators.pattern('^[a-zA-ZÀ-ÿ\\s]*$')]],
      dni: ['',
        [Validators.required, Validators.maxLength(20)],
        [this.dniValidator()]
      ],
      phone: ['', [Validators.required, Validators.maxLength(50)]],
      dateOfBirth: ['', [Validators.required, pastDateValidator]],
      career: ['', Validators.required],
      university: ['', Validators.required],
      degreeStatus: ['', Validators.required],
      street: ['', Validators.required],
      number: ['', Validators.required],
      city: ['', Validators.required],
      province: ['', Validators.required],
      postalCode: ['', Validators.required],
      linkedinUrl: ['', Validators.pattern(/^(https?:\/\/.*|linkedin\.com\/.*)?$/)],
      description: ['', Validators.maxLength(500)] // Campo de descripción
    });
  }


  onSubmit() {
    // 1️⃣ Validaciones locales
    if (!this.form.valid) {
      this.form.markAllAsTouched();
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
        this.successMessage.set('Usuario registrado correctamente!');
        this.showModal.set(true);

        this.form.reset();

        if (this.isModal) {
          this.userCreated.emit(); // Avisa al componente padre (la tabla)
        } else {
          setTimeout(() => {
            this.showModal.set(false);
            this.router.navigateByUrl('/auth/login', { replaceUrl: true }); // Redirige al login en modo público
          }, 2000);
        }
      },
      error: (err: any) => {
        this.successMessage.set('');

        this.successMessage.set('Error al registrar usuario. Por favor, revisa los campos.');
      }
    });
  }

  isInvalidField(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && control.touched);
  }

  // Helper para formatear las provincias en los desplegables
  private formatProvinceForDisplay(enumValue: string): string {
    return enumValue.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  }

  getFieldError(field: string): string | null {
    const control = this.form.get(field);
    if (!control || !control.errors) return null;

    const errors = control.errors;

    if (errors['required']) return 'Este campo es obligatorio';
    if (errors['minlength'])
      return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    if (errors['maxlength'])
      return `Máximo ${errors['maxlength'].requiredLength} caracteres`;
    if (errors['email']) return 'Email inválido';
    if (errors['pattern']) return 'Formato inválido';
    if (errors['futureDate']) return 'La fecha no puede ser hoy ni futura.';
    if (errors['usernameExists']) return 'El nombre de usuario ya está en uso.';
    if (errors['emailExists']) return 'El email ya está registrado.';
    if (errors['dniExists']) return 'El DNI ya está registrado.';

    return null;
  }

  // --- Validadores Asíncronos ---

  private usernameValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value) return of(null);
      // Usamos control.valueChanges aquí para que el validador se dispare en cada cambio.
      // Sin embargo, para la validación inicial o al establecer el valor programáticamente,
      // es mejor simplemente tomar el valor actual.
      // Para simplificar y asegurar que funcione en todos los casos, usaremos un pipe sobre un `of(control.value)`.
      // La forma más común y reactiva es usarlo directamente en el control, pero esto requiere más configuración.
      // Vamos a mantenerlo simple por ahora.
      return of(control.value).pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(value => this.http.get<boolean>(`/api/users/check-username/${value}`)),
        map(exists => (exists ? { usernameExists: true } : null)),
        catchError(() => of(null))
      );
    };
  }

  private emailValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value) return of(null);
      return of(control.value).pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(value => this.http.get<boolean>(`/api/users/check-email/${value}`)),
        map(exists => (exists ? { emailExists: true } : null)),
        catchError(() => of(null))
      );
    };
  }

  private dniValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value) return of(null);
      return of(control.value).pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(value => this.http.get<boolean>(`/api/students/check-dni/${value}`)),
        map(exists => (exists ? { dniExists: true } : null)),
        catchError(() => of(null))
      );
    };
  }
}
