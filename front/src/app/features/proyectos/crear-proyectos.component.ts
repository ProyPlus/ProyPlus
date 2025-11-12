// src/app/features/proyectos/proyectos.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { HttpErrorResponse } from '@angular/common/http';

import { ProjectsService, CreateProjectDto, ProjectStatus } from '../../core/services/projects.service';
import { StudentService } from '../../core/services/students.service';
import { AuthService } from '../auth/login/auth.service';
import { StudentName } from '../../models/student-name.model';

// Garantizamos fullName en el componente
type StudentWithFullName = StudentName & { fullName: string };

@Component({
  selector: 'app-create-project',
  standalone: true,
  templateUrl: './crear-proyectos.component.html',
  styleUrls: ['./crear-proyectos.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AutoCompleteModule,
    ToastModule,
    CardModule,
    InputTextModule, // InputTextarea está incluido en InputTextModule en algunas versiones
    ButtonModule,
    TooltipModule
  ],
  providers: [MessageService],
})
export class ProyectosComponent implements OnInit {
  private fb = inject(FormBuilder);
  private projectsSrv = inject(ProjectsService);
  private studentSrv = inject(StudentService);
  private msg = inject(MessageService);
  private authSvc = inject(AuthService);
  private router = inject(Router);

  projectForm!: FormGroup;

  // UI carga / progreso
  isLoading = false;
  progress = 0;

  // Data para autocompletes
  allStudents: StudentWithFullName[] = [];
  studentsLoading = false;
  suggestionsStudents: StudentWithFullName[] = [];

  ngOnInit(): void {
    const currentUser = this.authSvc.getSession();
    const ownerForForm: StudentWithFullName | null = currentUser
      ? {
          id: currentUser.id,
          firstName: currentUser.username, // Usamos username como fallback
          lastName: '',
          fullName: currentUser.username,
        }
      : null;

    this.projectForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      budgetGoal: [null, [Validators.required, Validators.min(0)]],
      startDate: ['', Validators.required],          // 'YYYY-MM-DD'
      estimatedEndDate: ['', Validators.required],   // 'YYYY-MM-DD'
      owner: [{ value: ownerForForm, disabled: true }, Validators.required],
      students: [[] as StudentWithFullName[]],
    });
  }

  // ===== Helpers de estudiantes =====
  private normalize(list: StudentName[]): StudentWithFullName[] {
    return (list ?? []).map((s) => ({
      ...s,
      fullName: (`${s.firstName ?? ''} ${s.lastName ?? ''}`).trim(),
    }));
  }

  /** Busca nombres. Si q=='' y viene vacío, reintenta con 'a' para poblar. */
  private fetchNames(q: string, onDone: (arr: StudentWithFullName[]) => void): void {
    this.studentSrv.getNames(q).subscribe({
      next: (list) => {
        let arr = this.normalize(list);
        if (arr.length === 0 && q === '') {
          this.studentSrv.getNames('a').subscribe({
            next: (list2) => onDone(this.normalize(list2)),
            error: () => onDone([]),
          });
        } else {
          onDone(arr);
        }
      },
      error: () => onDone([]),
    });
  }

  displayStudent(st?: StudentWithFullName | null): string {
    return st ? `${st.fullName} (ID ${st.id})` : '';
  }

  // Dropdowns
  showAllStudents(): void {
    this.studentsLoading = true;
    this.fetchNames('', (arr) => {
      this.suggestionsStudents = arr.slice(0, 50);
      this.allStudents = arr;
      this.studentsLoading = false;
    });
  }

  // Autocomplete typing
  completeStudents(e: { query: string }): void {
    this.studentsLoading = true;
    const q = (e?.query ?? '').trim();
    this.fetchNames(q, (arr) => {
      this.suggestionsStudents = arr;
      this.studentsLoading = false;
    });
  }

  // ===== Manejo de errores del backend =====

  /** Traduce fragmentos comunes a ES y mapea nombres de campos. */
  private translateMessage(raw: string): string {
    const fieldMap: Record<string, string> = {
      name: 'Nombre del proyecto',
      description: 'Descripción',
      budgetGoal: 'Meta de presupuesto',
      status: 'Estado',
      startDate: 'Fecha de inicio',
      estimatedEndDate: 'Fecha de finalización estimada',
      ownerId: 'Responsable',
      studentIds: 'Estudiantes',
    };

    let msg = raw.trim();

    // Reemplazos de frases típicas
    msg = msg
      .replace(/The date must be current or future\.?/gi, 'La fecha debe ser actual o futura.')
      .replace(/must not be blank/gi, 'no debe estar vacío')
      .replace(/must be a well-formed email address/gi, 'debe ser un email válido')
      .replace(/size must be between/gi, 'el tamaño debe estar entre')
      .replace(/must be greater than or equal to/gi, 'debe ser mayor o igual a')
      .replace(/must be less than or equal to/gi, 'debe ser menor o igual a');

    // Cambiar etiqueta del campo a español si viene en formato "field: mensaje"
    const m = msg.match(/^([^:]+):\s*(.+)$/);
    if (m) {
      const field = m[1].trim();
      const rest = m[2].trim();
      const nice = fieldMap[field] ?? field;
      return `${nice}: ${rest}`;
    }
    return msg;
  }

  /**
   * Extrae mensajes desde HttpErrorResponse (JSON o texto).
   * Además, si detecta "campo: mensaje", marca el control con error 'server'.
   */
  private handleServerValidation(err: unknown): string[] {
    if (!(err instanceof HttpErrorResponse)) return [];
    let payload: any = err.error;

    // Si viene como string, intento parsear a JSON; si falla, uso texto.
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        payload = { message: payload };
      }
    }

    // Intentar múltiples formatos
    let messages: string[] = [];
    if (Array.isArray(payload)) {
      messages = payload.map((x) => String(x?.message ?? x));
    } else if (payload?.errors && typeof payload.errors === 'object') {
      // e.g., { errors: { description: ["...","..."], estimatedEndDate: ["..."] } }
      for (const [field, arr] of Object.entries(payload.errors)) {
        const list = Array.isArray(arr) ? arr : [arr];
        for (const raw of list) {
          messages.push(`${field}: ${raw}`);
        }
      }
    } else if (payload?.message) {
      messages = String(payload.message)
        .split(/(?<=\.)\s+|;|\n/) // separa por punto+espacio, ; o newline
        .map((s: string) => s.trim())
        .filter(Boolean);
    }

    // Traducir y bindear a controles si se puede
    const translated: string[] = [];
    for (const raw of messages) {
      const t = this.translateMessage(raw);

      // Si viene "campo: mensaje" marcar el control
      const mm = t.match(/^([^:]+):\s*(.+)$/);
      if (mm) {
        const spanishLabel = mm[1].trim();
        const onlyMsg = mm[2].trim();

        // Map inverso básico para detectar el control (si el backend manda el nombre técnico, este paso ya se hizo arriba)
        const controlBySpanish: Record<string, string> = {
          'Nombre del proyecto': 'name',
          'Descripción': 'description',
          'Meta de presupuesto': 'budgetGoal',
          'Estado': 'status',
          'Fecha de inicio': 'startDate',
          'Fecha de finalización estimada': 'estimatedEndDate',
          'Responsable': 'owner',
          'Estudiantes': 'students',
        };

        const ctlNameGuess =
          Object.entries(controlBySpanish).find(([k]) => k === spanishLabel)?.[1] ?? null;

        if (ctlNameGuess && this.projectForm.get(ctlNameGuess)) {
          this.projectForm.get(ctlNameGuess)?.setErrors({ server: onlyMsg });
          this.projectForm.get(ctlNameGuess)?.markAsTouched();
        }
      }

      translated.push(t);
    }

    return translated;
  }

  // ===== Acciones del form =====
  onCancel(): void {
    this.projectForm.reset();
  }

  onSubmit(): void {
    if (this.projectForm.invalid) return;

    const v = this.projectForm.getRawValue() as { // Usar getRawValue() para incluir controles deshabilitados
      name: string;
      description: string;
      budgetGoal: number | null;
      startDate: string;
      estimatedEndDate: string;
      owner: StudentWithFullName | null;
      students: StudentWithFullName[];
    };

    // Asegurarse de que v.owner no sea null/undefined antes de acceder a .id
    if (!v.owner) {
      this.msg.add({
        severity: 'error',
        summary: 'Error de usuario',
        detail: 'No se pudo determinar el líder del proyecto. Por favor, recargue la página.',
        life: 6000,
      });
      return;
    }

    const ownerId = (v.owner as StudentWithFullName).id;
    const studentIds = (v.students ?? []).map((s) => s.id);

    const dto: CreateProjectDto = {
      name: v.name,
      description: v.description,
      budgetGoal: Number(v.budgetGoal ?? 0),
      startDate: v.startDate,
      estimatedEndDate: v.estimatedEndDate,
      ownerId,
      studentIds,
    };

    // Feedback de progreso en UI
    this.isLoading = true;
    this.progress = 0;
    const prog = setInterval(() => {
      this.progress = Math.min(95, this.progress + 7);
    }, 200);

    this.projectsSrv.create(dto).subscribe({
      next: (created: { id: number }) => {
        clearInterval(prog);
        this.progress = 100;

        this.msg.add({
          severity: 'success',
          summary: 'Proyecto creado',
          detail: 'Proyecto creado con éxito.',
          life: 3500,
        });

        // Redirigir a la lista de proyectos del usuario
        this.router.navigate(['/misproyectos']);
      },
      error: (err: unknown) => {
        clearInterval(prog);
        this.isLoading = false;

        const details = this.handleServerValidation(err);
        if (details.length) {
          this.msg.add({
            severity: 'error',
            summary: 'Error de validación',
            detail: details.join('\n'),
            life: 6000,
          });
        } else {
          this.msg.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear el proyecto.',
            life: 4000,
          });
        }
        console.error('Error al crear proyecto', err);
      },
    });
  }
}
