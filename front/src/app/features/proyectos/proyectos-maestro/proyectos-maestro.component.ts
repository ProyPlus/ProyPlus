import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { Subscription, of, timer } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { ToolbarModule } from 'primeng/toolbar';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button'; // (lo podés quitar si ya no usás el modal)
import { DialogModule } from 'primeng/dialog';            // (lo podés quitar si ya no usás el modal)
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { AccordionModule } from 'primeng/accordion';
import { SliderModule } from 'primeng/slider';
import { EditorModule } from 'primeng/editor';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MenuModule } from 'primeng/menu';
import { ToastModule } from 'primeng/toast';
import { StepsModule } from 'primeng/steps'; // Importar StepsModule
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';
import { MultiSelectModule } from 'primeng/multiselect';
import { debounceTime, distinctUntilChanged, filter, switchMap, tap, map } from 'rxjs/operators';

import { ProjectsMasterService } from '../../../core/services/projects-master.service';
import { ProjectDocumentsService, IProjectDocument } from '../../../core/services/project-documents.service';
import { AuthService, Session } from '../../auth/login/auth.service';
import type { ContactOwnerDTO, IInvestment, IEarning, IStudentDetail } from '../../../core/services/projects-master.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';
import { IMyProject, IContract } from '../../../core/services/projects-master.service';


type Student = { id: number; name: string; email?: string };

@Component({
  standalone: true,
  selector: 'app-proyectos-maestro',
  templateUrl: './proyectos-maestro.component.html',
  styleUrls: ['./proyectos-maestro.component.scss'],
  imports: [ // ... otros imports
    CommonModule, FormsModule, ReactiveFormsModule, StepsModule, // Añadir StepsModule aquí
    ToolbarModule, CardModule, TagModule, TableModule, FileUploadModule, ButtonModule, DialogModule, InputTextModule,
    InputNumberModule, EditorModule, ConfirmDialogModule, SliderModule, TooltipModule, ProgressBarModule, MenuModule, MultiSelectModule,
    DatePickerModule, AccordionModule, ToastModule
  ],
  animations: [
    trigger('slide', [
      state('void', style({ height: '0px', opacity: 0, overflow: 'hidden', 'margin-top': '0' })),
      transition(':enter', [animate('400ms ease-in-out', style({ height: '*', opacity: 1, 'margin-top': '1rem' }))]),
      transition(':leave', [animate('400ms ease-in-out', style({ height: '0px', opacity: 0, 'margin-top': '0' }))]),
    ])
  ],
  providers: [MessageService, ConfirmationService],
})
export class ProyectosMaestroComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private svc = inject(ProjectsMasterService);
  private toast = inject(MessageService);
  private docSvc = inject(ProjectDocumentsService);
  private auth = inject(AuthService);
  private confirmSvc = inject(ConfirmationService);
  private router = inject(Router);

  @ViewChild('contractContent') contractContentRef!: ElementRef<HTMLDivElement>;


  projectId = signal<number>(0);
  project = signal<IMyProject | null>(null);

  // --- Lógica de Roles ---
  private currentUser = this.auth.getSession();
  isInvestor = computed(() => this.currentUser?.roles.includes('ROLE_INVESTOR') ?? false);
  isOwner = computed(() => {
    return this.project()?.ownerId === this.currentUser?.id;
  });

  get team(): Student[] {
    const p = this.project();
    return (p?.students as unknown as Student[]) ?? [];
  }

  // Porcentaje de financiación, puede superar el 100%
  fundingPercentage = computed(() => {
    const p = this.project();
    if (!p || !p.fundingGoal || p.fundingGoal <= 0 || !p.fundingRaised) {
      return 0;
    }
    return (p.fundingRaised / p.fundingGoal) * 100;
  });

  // Porcentaje para la barra de progreso base (limitado a 100%)
  fundingProgress = computed(() => Math.min(100, this.fundingPercentage()));
  // Porcentaje de sobrefinanciación (lo que excede el 100%)
  overfundingProgress = computed(() => Math.max(0, this.fundingPercentage() - 100));

  contracts = signal<IContract[]>([]);
  loading = signal<boolean>(false);

  // ===== Documentos del Proyecto =====
  documents = signal<IProjectDocument[]>([]);

  // ===== Acordeón Crear/Editar contrato =====
  contractModalVisible = signal<boolean>(false); // Renombrado de accordionOpen
  editing: IContract | null = null;
  isReadonly = signal<boolean>(false); // NUEVA SEÑAL para controlar el modo de solo lectura
  viewingOnly = signal<IContract | null>(null);
  showEditor = signal<boolean>(false); // <-- NUEVA SEÑAL

  currentContractStatus = computed<IContract['status'] | 'PENDING_STUDENT_SIGNATURE'>(() => {
    const contractInView = this.viewingOnly() || this.reviewingToSign || this.editing;
    return contractInView?.status || 'PENDING_STUDENT_SIGNATURE';
  });
  currentContractStatusLabel = computed(() => {
    const contractInView = this.viewingOnly() || this.reviewingToSign || this.editing;
    return this.getContractStatusLabel(contractInView);
  });

  reviewingToSign: IContract | null = null; // Nuevo estado para cuando un estudiante revisa un contrato para firmar
  currencyOptions = [
    { label: 'Dólar Estadounidense', value: 'USD' },
    { label: 'Peso Argentino', value: 'ARS' },
    { label: 'Euro', value: 'EUR' },
    { label: 'Yuan Chino', value: 'CNY' }
  ];
  contractForm = this.fb.nonNullable.group({
    title: ['', {
      validators: [Validators.required],
      asyncValidators: [this.contractNameValidator()],
      updateOn: 'blur' // Opcional: validar solo cuando el usuario sale del campo
    }],
    amount: [0, [Validators.required, Validators.min(0)]],
    currency: ['USD', Validators.required],
    profit1Year: [10, [Validators.required, Validators.min(0), Validators.max(100)]],
    profit2Years: [15, [Validators.required, Validators.min(0), Validators.max(100)]],
    profit3Years: [20, [Validators.required, Validators.min(0), Validators.max(100)]],
    description: [''], // Renombrado de 'clauses' a 'description'
  });
  
  contractTemplates: MenuItem[] = [];
  
  // ===== Lógica de Conversión de Moneda =====
  convertedAmountUSD = signal<number | null>(null);
  isConvertingCurrency = signal<boolean>(false);
  private currencyConversionSub: Subscription | null = null;

  // ===== Formulario de Contacto =====
  contactDialogVisible = signal(false);
  contactForm = this.fb.group({
    subject: ['', Validators.required],
    message: ['', Validators.required],
  });

  // ===== Modal de Gestión de Pagos =====
  transactionModalVisible = signal(false);
  isProcessingTransaction = signal(false); // Nuevo estado de carga para las transacciones
  selectedContractForTransactions = signal<IContract | null>(null);

  // ===== Modal de Gestión de Ganancias (Earnings) =====
  earningModalVisible = signal(false);
  isProcessingEarning = signal(false);
  selectedContractForEarnings = signal<IContract | null>(null);

  // ===== Modal de Detalles del Estudiante =====
  studentDetailModalVisible = signal(false);
  selectedStudent = signal<IStudentDetail | null>(null);
  loadingStudentDetails = signal(false);

  // ===== Modal de Edición de Proyecto =====
  editProjectModalVisible = signal(false);
  isSavingProject = signal(false);
  allStudents = signal<{ id: number; name: string }[]>([]); // Para el selector de estudiantes
  editProjectForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(100)]],
    summary: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(500)]],
    startDate: [null as Date | null, Validators.required],
    estimatedEndDate: [null as Date | null, Validators.required],
    budgetGoal: [0, [Validators.required, Validators.min(1)]],
    // Usamos un array de IDs para los estudiantes
    studentIds: [[] as number[]],
  });


  // ===== Ciclo de Vida del Contrato (para el diálogo de Contrato) =====
  contractLifecycleSteps = computed<MenuItem[]>(() => {
    return [
      { label: 'Borrador', id: 'DRAFT' },
      { label: 'Aprobado', id: 'PARTIALLY_SIGNED' }, // Aprobado por una parte
      { label: 'Firmado', id: 'SIGNED' },
      { label: 'Cerrado', id: 'CLOSED' },
    ];
  });

  contractLifecycleActiveIndex = computed<number>(() => {
    const contract = this.viewingOnly() || this.reviewingToSign || this.editing;
    if (!contract) return -1;

    const currentStatus = contract.status;
    switch (currentStatus) {
      case 'DRAFT': return 0;
      case 'PARTIALLY_SIGNED': return 1;
      case 'SIGNED': return 2;
      case 'CLOSED': return 3;
      default: return -1;
    }
  });

  // ===== Ciclo de Vida de la Inversión (para el diálogo de Transacciones) =====
  investmentLifecycleSteps = computed<MenuItem[]>(() => {
    return [
      { label: 'Pendiente Envío', id: 'IN_PROGRESS' }, // Inversor debe enviar
      { label: 'Envío Notificado', id: 'PENDING_CONFIRMATION' }, // Inversor notificó, estudiante debe confirmar
      { label: 'Recibido', id: 'RECEIVED' }, // Estudiante confirmó
    ];
  });

  investmentLifecycleActiveIndex = computed<number>(() => {
    const contract = this.selectedContractForTransactions();
    const investment = contract?.investment;
    if (!investment) return -1;

    const currentStatus = investment.status;
    switch (currentStatus) {
      case 'IN_PROGRESS': return 0;
      case 'PENDING_CONFIRMATION': return 1;
      case 'RECEIVED':
      case 'COMPLETED': return 2; // Treat COMPLETED as RECEIVED for this flow
      default: return -1;
    }
  });

  // ===== Ciclo de Vida de la Devolución (para el diálogo de Transacciones) =====
  refundLifecycleSteps = computed<MenuItem[]>(() => {
    return [
      { label: 'Devolución Pendiente', id: 'PENDING_RETURN' }, // Estudiante debe enviar
      { label: 'Envío Notificado', id: 'PENDING_CONFIRMATION' }, // Inversor debe confirmar
      { label: 'Fondos Devueltos', id: 'RETURNED' }, // Proceso completado
    ];
  });

  refundLifecycleActiveIndex = computed<number>(() => {
    const contract = this.selectedContractForTransactions();
    if (!contract?.investment) return -1;

    const investmentStatus = contract.investment.status;
    switch (investmentStatus) {
      case 'PENDING_REFUND':
      case 'REFUND_NOT_RECEIVED': return 0; // Estudiante debe enviar/reenviar
      case 'PENDING_RETURN': return 1; // Estudiante envió, inversor debe confirmar
      case 'RETURNED': return 2;
      case 'REFUND_FAILED': return 0; // Si falla, vuelve al primer paso visualmente
      default: return -1; // No se muestra el ciclo de vida si no está en uno de estos estados
    }
  });

  // ===== Ciclo de Vida de la Ganancia (para el diálogo de Ganancias) =====
  // Los pasos son los mismos para cada ganancia individual
  earningLifecycleSteps = this.investmentLifecycleSteps; // Reutilizamos los mismos pasos lógicos

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.toast.add({ severity: 'warn', summary: 'Proyecto', detail: 'ID inválido', life: 2200 });
      return;
    }
    this.projectId.set(id);
    this.loadProject();
    this.loadContracts();
    this.loadDocuments();
    this.setupContractTemplates();
    this.setupCurrencyConversionListener();
  }

  goBack(): void {
    window.history.back();
  }

  /**
   * Navega a la página de análisis de riesgo para el proyecto actual.
   */
  goToRiskAnalysis(): void {
    const projectId = this.project()?.id;
    if (!projectId) return;
    this.router.navigate(['/analysis/risk', projectId]);
  }

  private loadProject(): void {
    this.loading.set(true);
    this.svc.getProjectById(this.projectId()).subscribe({
      next: (p: IMyProject | null) => {
        this.project.set(p || null);
        this.setupContractTemplates(); // Volver a generar las plantillas con el título del proyecto
      },
      error: () => this.toast.add({ severity: 'error', summary: 'Proyecto', detail: 'No se pudo cargar' }),
      complete: () => this.loading.set(false),
    });
  }

  private loadContracts(): void {
    this.svc.getContracts(this.projectId()).subscribe({
      next: (list: IContract[]) => {
        let contractsToShow = list || [];
        // --- FILTRO DE SEGURIDAD ---
        // Si el usuario es un inversor, solo debe ver sus propios contratos.
        // El dueño del proyecto puede ver todos.
        if (this.isInvestor() && !this.isOwner()) {
          const currentUserId = this.currentUser?.id;
          contractsToShow = contractsToShow.filter(c => c.createdByInvestorId === currentUserId);
        }
        this.contracts.set(contractsToShow);
      }
    });
  }

loadDocuments() {
    const id = this.projectId();
    if (id) {
      this.docSvc.getDocumentsByProject(id).subscribe({
        next: (docs) => {
        console.log('JSON de documentos recibido:', docs); 
        this.documents.set(docs); 
      },
        error: (err) => this.toast.add({ severity: 'error', summary: 'Documentos', detail: 'No se pudieron cargar los documentos.' })
      });
    }
  }

  // --- Métodos para Documentos ---

  onUpload(event: { files: File[] }): void {
    const file = event.files?.[0] as File;
    const projectId = this.projectId();

    if (!file || !projectId) {
      this.toast.add({ severity: 'error', summary: 'Error de Subida', detail: 'Falta el archivo o el ID del proyecto.' });
      return;
    }

    this.docSvc.uploadDocument(file, projectId).subscribe({
      next: (newDoc) => {
        this.toast.add({ 
          severity: 'success', 
          summary: 'Documentos', 
          detail: `Documento '${newDoc.fileName}' subido con éxito.` 
        });
        this.loadDocuments(); 
      },
      error: (error) => {
        const detail = error.error?.message || 'Error desconocido al intentar subir el archivo.';
        this.toast.add({ 
          severity: 'error', 
          summary: 'Error de Subida', 
          detail: detail 
        });
        console.error('Error al subir documento:', error);

      }
    });
  }

  onUploadError(event: any): void {
    const detail = event.error?.message || 'Ocurrió un error al subir el archivo.';
    this.toast.add({ severity: 'error', summary: 'Error de Subida', detail });
  }

  downloadDocument(doc: IProjectDocument): void {
    window.open(this.docSvc.getDownloadUrl(doc.idProjectDocument), '_blank');
  }

  deleteDocument(doc: IProjectDocument): void {
    this.confirmSvc.confirm({
      message: `¿Estás seguro de que quieres eliminar el documento "${doc.fileName}"? Esta acción no se puede deshacer.`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.docSvc.deleteDocument(doc.idProjectDocument).subscribe({
          next: () => {
            this.toast.add({ severity: 'info', summary: 'Eliminado', detail: 'El documento ha sido eliminado.' });
            this.documents.update(docs => docs.filter(d => d.idProjectDocument !== doc.idProjectDocument));
          },
          error: (err) => {
            this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo eliminar el documento.' });
          }
        });
      }
    });
  }


  showStudentDetails(studentId: number): void {
    // Permitir ver detalles si es inversor O si es el dueño del proyecto
    if (!this.isInvestor() && !this.isOwner()) return;

    this.loadingStudentDetails.set(true);
    this.selectedStudent.set(null);
    this.studentDetailModalVisible.set(true);

    this.svc.getStudentById(studentId).subscribe({
      next: (student) => {
        this.selectedStudent.set(student);
      },
      error: (err) => {
        this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los detalles del estudiante.' });
        this.studentDetailModalVisible.set(false);
      },
      complete: () => this.loadingStudentDetails.set(false)
    });
  }

  // ===== Lógica de Edición de Proyecto =====
  openEditProjectModal(): void {
    const p = this.project();
    if (!p || !this.isOwner()) {
      return;
    }

    // Añadimos las validaciones de negocio antes de abrir el modal
    if (p.status !== 'PENDING_FUNDING' || (p.fundingRaised ?? 0) > 0) {
      this.toast.add({ severity: 'warn', summary: 'Acción no permitida', detail: 'El proyecto ya no puede ser editado.' });
      return;
    }

    // Cargar la lista de todos los estudiantes para el selector
    this.svc.getAllStudents().subscribe(students => {
      // Excluimos al dueño del proyecto de la lista de seleccionables
      this.allStudents.set(students.filter(s => s.id !== p.ownerId));
    });

    // Obtenemos los IDs de los estudiantes actuales del proyecto
    const currentStudentIds = p.students?.map(s => s.id) ?? [];

    this.editProjectForm.reset({
      title: p.title,
      summary: p.summary,
      startDate: p.startDate ? new Date(p.startDate) : null,
      estimatedEndDate: p.estimatedEndDate ? new Date(p.estimatedEndDate) : null,
      budgetGoal: p.fundingGoal ?? 0,
      // Establecemos los estudiantes actuales en el selector
      studentIds: currentStudentIds,
    });
    this.editProjectModalVisible.set(true);
  }

  saveProjectChanges(): void {
    if (this.editProjectForm.invalid) {
      this.editProjectForm.markAllAsTouched();
      this.toast.add({ severity: 'warn', summary: 'Formulario Inválido', detail: 'Por favor, revisa los campos marcados en rojo.' });
      return;
    }

    const currentProject = this.project();
    if (!currentProject) return;

    this.isSavingProject.set(true);

    const formValue = this.editProjectForm.getRawValue();
    const payload = {
      name: formValue.title, // El backend espera 'name'
      description: formValue.summary, // El backend espera 'description'
      startDate: formValue.startDate ? this.formatISO(formValue.startDate) : null,
      estimatedEndDate: formValue.estimatedEndDate ? this.formatISO(formValue.estimatedEndDate) : null,
      budgetGoal: formValue.budgetGoal,
      studentIds: formValue.studentIds,
      // Añadimos los campos requeridos por el DTO que no se editan en el formulario
      status: currentProject.status,
      // startDate: currentProject.startDate, // Ahora se edita en el form
      currentGoal: currentProject.fundingRaised,
    };

    this.svc.updateProject(this.projectId(), payload).subscribe({
      next: (updatedProject) => {
        this.project.set(updatedProject); // Actualiza la señal con el proyecto modificado
        this.toast.add({ severity: 'success', summary: 'Éxito', detail: 'El proyecto ha sido actualizado.' });
        this.editProjectModalVisible.set(false);
        this.isSavingProject.set(false); // Reiniciar el estado de carga al éxito
      },
      error: (err) => {
        const detail = err.error?.message || 'No se pudo actualizar el proyecto.';
        this.toast.add({ severity: 'error', summary: 'Error', detail });
        this.isSavingProject.set(false);
      }
    });
  }

  deleteProject(): void {
    const p = this.project();
    if (!p || !this.isOwner()) return;

    // Validamos el estado, la financiación y los contratos antes de mostrar el diálogo de confirmación
    if (p.status !== 'PENDING_FUNDING' || (p.fundingRaised ?? 0) > 0 || this.contracts().length > 0) {
      this.toast.add({ severity: 'warn', summary: 'Acción no permitida', detail: 'Solo se pueden eliminar proyectos que no hayan recibido financiación y no tengan contratos asociados.' });
      return;
    }

    this.confirmSvc.confirm({
      message: `¿Estás seguro de que quieres eliminar el proyecto "${p.title}"? Esta acción es irreversible.`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.svc.deleteProject(p.id).subscribe({
          next: () => {
            this.toast.add({ severity: 'success', summary: 'Éxito', detail: 'El proyecto ha sido eliminado.' });
            this.router.navigate(['/misproyectos']); // Navegar a la lista de proyectos
          },
          error: (err) => this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo eliminar el proyecto.' })
        });
      }
    });
  }

  completeProject(): void {
    const p = this.project();
    const user = this.currentUser;
    if (!p || !user || !this.isOwner()) return;

    this.confirmSvc.confirm({
      message: `¿Estás seguro de que quieres marcar el proyecto "${p.title}" como completado? Esta acción es irreversible.`,
      header: 'Confirmar Finalización',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sí, marcar como completado',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-success',
      accept: () => {
        this.svc.completeProject(p.id, user.id).subscribe({
          next: (updatedProject) => {
            this.project.set(updatedProject);
            this.toast.add({ severity: 'success', summary: 'Éxito', detail: 'El proyecto ha sido marcado como completado.' });
          },
          error: (err) => this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo completar el proyecto.' })
        });
      }
    });
  }

  cancelProject(): void {
    const p = this.project();
    const user = this.currentUser;
    if (!p || !user || !this.isOwner()) return;

    this.confirmSvc.confirm({
      message: `¿Estás seguro de que quieres cancelar el proyecto "${p.title}"? Esta acción es irreversible y podría implicar la devolución de fondos a los inversores.`,
      header: 'Confirmar Cancelación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, cancelar proyecto',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.svc.cancelProject(p.id, user.id).subscribe({
          next: (updatedProject) => {
            this.project.set(updatedProject);
            this.toast.add({ severity: 'warn', summary: 'Proyecto Cancelado', detail: 'El proyecto ha sido cancelado.' });
          },
          error: (err) => this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo cancelar el proyecto.' })
        });
      }
    });
  }

  // ===== Crear / Editar contrato (Acordeón) =====
  openCreateContract(): void {
    if (!this.isInvestor()) return;
    this.editing = null;
    this.showEditor.set(false); // Asegurarse de que el editor esté oculto al principio
    this.isReadonly.set(false); // Asegurarse de que no esté en modo solo lectura
    this.contractForm.reset({
      title: '',
      amount: 1000, // Un valor inicial de ejemplo
      currency: 'USD',
      description: '',
      // FIX: Inicializar los valores de rentabilidad para que el formulario sea válido
      profit1Year: 10,
      profit2Years: 15,
      profit3Years: 20,
    });
    this.contractModalVisible.set(true); // Mostrar el modal

    // Usar setTimeout para mostrar el editor en el siguiente ciclo de detección de cambios
    setTimeout(() => {
      this.showEditor.set(true);
    }, 0);
  }

  editContract(row: IContract): void {
    // Permitir editar si es inversor o si es dueño y el contrato está en DRAFT
    if (!this.isInvestor() && !(this.isOwner() && row.status === 'DRAFT')) return;

    this.editing = row;
    this.isReadonly.set(false); // El modo edición no es de solo lectura
    this.showEditor.set(false); // Asegurarse de que el editor esté oculto al principio

    const formValues = this.getContractFormValues(row); // Obtener los valores una vez

    // 1. Poblar el formulario con los datos (la descripción se establecerá explícitamente después)
    this.contractForm.patchValue(formValues);

    // 2. Mostrar el modal
    this.contractModalVisible.set(true); // Usar la nueva señal del modal

    // 3. Usar setTimeout para mostrar el editor y luego establecer su valor explícitamente
    setTimeout(() => {
      this.showEditor.set(true);
      // Establecer el valor de la descripción explícitamente DESPUÉS de que el editor se haya renderizado
      this.contractForm.controls.description.setValue(formValues.description);
    }, 0);
  }

  cancelEdit(): void {
    this.contractModalVisible.set(false); // Usar la nueva señal del modal
    this.showEditor.set(false); // Ocultar el editor al cerrar/cancelar
    this.editing = null;
    this.reviewingToSign = null;
    this.viewingOnly.set(null);
    this.isReadonly.set(false); // Salir del modo solo lectura
    this.convertedAmountUSD.set(null); // Limpiar el monto convertido al cerrar
  }

  saveContract(): void {
    // Si estamos en modo "revisar para firmar", llamamos a la función de firma
    if (this.reviewingToSign) {
      this.confirmAndSign(this.reviewingToSign);
      return;
    }

    if (this.contractForm.invalid) return;

    const raw = this.contractForm.getRawValue();
    const commonPayload = {
      textTitle: raw.title,
      description: raw.description,
      amount: raw.amount,
      currency: raw.currency as IContract['currency'],
      profit1Year: raw.profit1Year,
      profit2Years: raw.profit2Years,
      profit3Years: raw.profit3Years,
    };

    // --- Lógica de guardado por ROL ---
    if (this.isInvestor()) {
      if (this.editing) { // Inversor está editando un DRAFT
        const payload = { ...commonPayload, investorId: this.currentUser?.id };
        this.svc.updateContractByInvestor(this.editing.idContract, payload).subscribe(this.getObserver());
      } else { // Inversor está creando un nuevo contrato
        const payload = {
          ...commonPayload,
          projectId: this.projectId(),
          createdByInvestorId: this.currentUser?.id,
        };
        this.svc.upsertContract(payload).subscribe(this.getObserver());
      }
    } else if (this.isOwner()) {
      if (this.editing) { // Estudiante está editando un DRAFT
        const payload = { ...commonPayload, studentId: this.currentUser?.id };
        this.svc.updateContractByStudent(this.editing.idContract, payload).subscribe(this.getObserver());
      } else {
        this.toast.add({ severity: 'error', summary: 'Acción no permitida', detail: 'Solo los inversores pueden crear nuevos contratos.' });
      }
    }
  }

  /**
   * Devuelve un objeto Observer para manejar las respuestas de las llamadas de guardado de contratos.
   */
  private getObserver() {
    return {
      next: (saved: IContract) => {
        if (this.editing) {
          // Si estábamos editando, actualizamos el contrato en la lista.
          this.updateContractInList(saved);
        } else {
          // Si estábamos creando, añadimos el nuevo contrato al principio de la lista.
          this.contracts.update(list => [saved, ...list]);
        }
        this.toast.add({ severity: 'success', summary: 'Contrato', detail: this.editing ? 'Actualizado' : 'Creado', life: 1600 });
        this.cancelEdit();
      },
      error: (err: any) => {
        let detail = err?.error?.message || 'No se pudo guardar el contrato.';
        if (typeof detail === 'string' && detail.includes("Data too long for column 'description'")) {
          detail = 'El contenido de las cláusulas es demasiado largo. Por favor, reduce el texto o el formato.';
        }
        this.toast.add({ severity: 'error', summary: 'Error al guardar', detail: detail, life: 6000 });
      }
    }
  }

  private formatISO(d: Date): string {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }

  calculateProfit(baseAmount: number | null | undefined, percentage: number | null | undefined): number {
    if (baseAmount == null || percentage == null) {
      return 0;
    }
    return (baseAmount * percentage) / 100;
  }

  // ===== Lógica de Plantillas de Contrato =====
  private setupContractTemplates(): void {
    const projectTitle = this.project()?.title ?? '[Nombre del Proyecto]';
    const projectOwner = this.project()?.owner ?? '[Nombre del Líder del Proyecto]';
    const currentDate = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

    this.contractTemplates = [
      {
        label: 'Contrato de Inversión Estándar',
        icon: 'pi pi-file',
        command: () => {
          const template = `
            <p>En la ciudad de [Ciudad], a ${currentDate}.</p>
            <br>
            <h1><strong>CONTRATO DE INVERSIÓN ESTÁNDAR</strong></h1>
            <br>
            <h2><strong>PARTES INTERVINIENTES</strong></h2>
            <p><strong>DE UNA PARTE,</strong> como "El Inversor":</p>
            <ul><li><strong>Nombre:</strong> [Nombre Completo del Inversor]</li><li><strong>DNI/Identificación:</strong> [Número de Identificación]</li><li><strong>Domicilio:</strong> [Domicilio del Inversor]</li></ul>
            <p><strong>DE OTRA PARTE,</strong> como "El Equipo del Proyecto":</p>
            <ul><li><strong>Representante:</strong> ${projectOwner}</li><li><strong>Proyecto:</strong> ${projectTitle}</li></ul>
            <br>
            <h2><strong>CLÁUSULAS</strong></h2>
            <h3><strong>PRIMERA: OBJETO DEL CONTRATO</strong></h3>
            <p>El Inversor se compromete a realizar una aportación de capital destinada exclusivamente a la financiación y desarrollo del proyecto "${projectTitle}". El Equipo del Proyecto se compromete a la correcta administración de dichos fondos.</p>
            <h3><strong>SEGUNDA: APORTACIÓN DE CAPITAL</strong></h3>
            <p>La aportación se fija en la cantidad de <strong>[Monto de la Inversión]</strong> en la moneda <strong>[Moneda]</strong>, que será transferida en un plazo no superior a 10 días hábiles desde la firma del presente documento.</p>
            <h3><strong>TERCERA: PARTICIPACIÓN Y RENTABILIDAD</strong></h3>
            <p>A cambio de su aportación, el Inversor recibirá una participación en los beneficios futuros del proyecto, según los porcentajes de rentabilidad anual definidos en la oferta.</p>
            <h3><strong>CUARTA: OBLIGACIONES</strong></h3>
            <p>El Equipo del Proyecto se obliga a presentar informes de avance trimestrales y a notificar cualquier desviación significativa. El Inversor se obliga a mantener la confidencialidad de la información sensible del proyecto.</p>
            <br><p>En prueba de conformidad, ambas partes firman el presente contrato.</p>
          `;
          this.insertTemplate(template);
        }
      },
      {
        label: 'Acuerdo de Confidencialidad (NDA)',
        icon: 'pi pi-lock',
        command: () => {
          const template = `
            <h1><strong>ACUERDO DE CONFIDENCIALIDAD (NDA)</strong></h1>
            <br>
            <p>Este Acuerdo se celebra el ${currentDate} entre [Nombre del Inversor] ("Parte Receptora") y ${projectOwner}, en representación del proyecto ${projectTitle} ("Parte Reveladora").</p>
            <br>
            <h3><strong>1. Propósito</strong></h3>
            <p>El propósito de este Acuerdo es permitir a la Parte Receptora evaluar una posible inversión en el proyecto, para lo cual la Parte Reveladora compartirá cierta Información Confidencial.</p>
            <h3><strong>2. Definición de Información Confidencial</strong></h3>
            <p>Se considera "Información Confidencial" toda información técnica, comercial, financiera o de cualquier otra naturaleza, revelada por la Parte Reveladora, que no sea de dominio público.</p>
            <h3><strong>3. Obligaciones</strong></h3>
            <p>La Parte Receptora se compromete a no divulgar, copiar o utilizar la Información Confidencial para ningún otro propósito que no sea la evaluación del proyecto.</p>
            <h3><strong>4. Duración</strong></h3>
            <p>Las obligaciones de confidencialidad bajo este Acuerdo permanecerán en vigor durante un período de cinco (5) años a partir de la fecha de firma.</p>
          `;
          this.insertTemplate(template);
        }
      },
      {
        label: 'Acuerdo Simple de Inversión',
        icon: 'pi pi-file-check',
        command: () => {
          const template = `
            <h2><strong>ACUERDO SIMPLE DE INVERSIÓN</strong></h2>
            <br>
            <p><strong>Partes:</strong> [Nombre del Inversor] ("Inversor") y ${projectOwner} ("Equipo").</p>
            <p><strong>Proyecto:</strong> ${projectTitle}.</p>
            <p><strong>Fecha:</strong> ${currentDate}.</p>
            <br>
            <p><strong>1. Inversión:</strong> El Inversor aportará la cantidad de <strong>[Monto] [Moneda]</strong>.</p>
            <p><strong>2. Retorno:</strong> A cambio, el Inversor recibirá una participación en los beneficios según los porcentajes de rentabilidad definidos en la oferta.</p>
            <p><strong>3. Informes:</strong> El Equipo se compromete a enviar un informe de progreso mensual al Inversor.</p>
            <p>Ambas partes aceptan estos términos mediante la firma de este contrato.</p>
          `;
          this.insertTemplate(template);
        }
      },
      {
        label: 'Contrato de Préstamo Convertible',
        icon: 'pi pi-sync',
        command: () => {
          const template = `
            <h1><strong>CONTRATO DE PRÉSTAMO CONVERTIBLE</strong></h1>
            <br>
            <p>Este Contrato de Préstamo Convertible se celebra entre [Nombre del Inversor] ("Prestador") y el equipo del proyecto ${projectTitle} ("Prestatario").</p>
            <br>
            <h3><strong>1. Préstamo</strong></h3>
            <p>El Prestador acuerda prestar al Prestatario la suma de <strong>[Monto del Préstamo] [Moneda]</strong>.</p>
            <h3><strong>2. Conversión</strong></h3>
            <p>El préstamo, junto con sus intereses acumulados a una tasa del [Tasa de Interés]% anual, se convertirá automáticamente en una participación accionaria en el proyecto tras la ocurrencia de un "Evento de Financiación Cualificado" (ej. una ronda de inversión superior a [Monto de Ronda]).</p>
            <h3><strong>3. Vencimiento</strong></h3>
            <p>Si no ocurre un Evento de Financiación Cualificado antes de [Fecha de Vencimiento], el Prestatario deberá devolver el monto principal más los intereses acumulados.</p>
          `;
          this.insertTemplate(template);
        }
      }
    ];
  }

  private insertTemplate(templateContent: string): void {
    const currentContent = this.contractForm.controls.description.value;
    if (currentContent && currentContent.length > 10) { // Si hay algo escrito
      this.confirmSvc.confirm({
        message: 'Ya hay contenido en el editor. ¿Deseas reemplazarlo con la plantilla seleccionada?',
        header: 'Confirmar Reemplazo',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí, reemplazar',
        rejectLabel: 'No, cancelar',
        accept: () => this.contractForm.controls.description.setValue(templateContent)
      });
    } else {
      this.contractForm.controls.description.setValue(templateContent);
    }
  }

  // ===== Lógica de Contacto al Dueño del Proyecto =====

  /**
   * Abre el diálogo para contactar al líder del proyecto.
   */
  openContactDialog(): void {
    this.contactForm.reset();
    this.contactDialogVisible.set(true);
  }

  /**
   * Envía el correo electrónico al líder del proyecto a través del backend.
   */
  sendContactEmail(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    // 1. Obtener la sesión actual.
    const session = this.auth.getSession();
    const projectId = this.projectId();

    // 2. Validar que la sesión y el email existan.
    if (!session || !session.email) {
      this.toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo identificar tu email. Por favor, inicia sesión de nuevo.'
      });
      return;
    }

    // 3. Construir el payload con los datos REALES de la sesión.
    const contactData: ContactOwnerDTO = {
      fromEmail: session.email,       // <-- USA EL EMAIL REAL
      fromName: session.username,     // <-- USA EL USERNAME PARA EL NOMBRE
      subject: this.contactForm.value.subject!,
      message: this.contactForm.value.message!,
    };

    // 3. Realizar la petición POST con el payload corregido
    this.svc.contactProjectOwner(projectId, contactData).subscribe({
      next: () => {
        this.contactDialogVisible.set(false);
        this.toast.add({ severity: 'success', summary: 'Éxito', detail: 'Mensaje enviado correctamente.' });
      },
      error: (err) => {
        console.error('Error al enviar el mensaje de contacto:', err);
        const detail = err?.error?.message || 'No se pudo enviar el mensaje. Inténtalo de nuevo más tarde.';
        this.toast.add({ severity: 'error', summary: 'Error de envío', detail });
      },
    });
  }

  // ===== Acciones de Contrato (Firma y Cancelación) =====

  /** Abre el panel para ver un contrato en modo solo lectura */
  viewContract(contract: IContract): void {
    this.editing = null;
    this.reviewingToSign = null;
    this.viewingOnly.set(contract);
    this.isReadonly.set(true); // Activar modo solo lectura

    // Simplemente poblamos el formulario. No más hacks.
    this.contractForm.patchValue(this.getContractFormValues(contract));

    this.contractModalVisible.set(true);
  }

  /** El estudiante hace clic en "Firmar", se abre el panel para revisar */
  reviewAndSignContract(contract: IContract): void {
    this.editing = null;
    this.reviewingToSign = contract;
    this.viewingOnly.set(null); // Limpiar el estado de solo vista
    this.isReadonly.set(true); // Activar modo solo lectura

    // Simplemente poblamos el formulario.
    this.contractForm.patchValue(this.getContractFormValues(contract));

    this.contractModalVisible.set(true);
  }

  /** Devuelve un objeto con los valores del contrato para el formulario */
  private getContractFormValues(contract: IContract) {
    return {
      title: contract.textTitle ?? '', // Añadir fallback para el valor opcional
      amount: contract.amount,
      currency: contract.currency ?? 'USD',
      profit1Year: contract.profit1Year ? Number(contract.profit1Year) * 100 : 0,
      profit2Years: contract.profit2Years ? Number(contract.profit2Years) * 100 : 0,
      profit3Years: contract.profit3Years ? Number(contract.profit3Years) * 100 : 0,
      description: contract.description ?? ''
    };
  }

  downloadContractAsPDF(): void {
    const content = this.contractContentRef.nativeElement;
    if (!content) {
      this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se encontró el contenido para generar el PDF.' });
      return;
    }

    html2canvas(content, { scale: 2 }).then((canvas: HTMLCanvasElement) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      const contractTitle = this.contractForm.controls.title.value || 'contrato';
      const fileName = `Contrato-${contractTitle.replace(/ /g, '_')}.pdf`;

      pdf.save(fileName);
    });
  }

  /**
   * Abre el modal para gestionar los pagos (inversión y ganancias) de un contrato.
   */
  openTransactionModal(contract: IContract): void {
    console.log('Abriendo modal para el contrato:', contract); // <-- AÑADIR ESTA LÍNEA PARA DEPURAR
    this.selectedContractForTransactions.set(contract);
    this.transactionModalVisible.set(true);
  }

  rejectContract(contract: IContract): void {
    this.confirmSvc.confirm({
      message: `¿Estás seguro de que quieres rechazar el contrato "${contract.textTitle}"? Esta acción no se puede deshacer.`,
      header: 'Confirmar Rechazo',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, rechazar',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        const studentId = this.currentUser?.id;
        if (!studentId) {
          this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo identificar al usuario.' });
          return;
        }
        this.svc.cancelContractByStudent((contract as any).idContract, studentId).subscribe({
          next: (updatedContract) => {
            this.updateContractInList(updatedContract);
            this.toast.add({ severity: 'warn', summary: 'Rechazado', detail: 'El contrato ha sido rechazado.' });
            this.cancelEdit(); // Cierra el panel
          },
          error: (err) => this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo rechazar el contrato.' })
        });
      }
    });
  }

  /**
   * El estudiante cancela un contrato que está firmado pero cuyo proyecto fue cancelado.
   */
  cancelContractByStudent(contract: IContract): void {
    this.confirmSvc.confirm({
      message: `¿Estás seguro de que quieres cancelar el contrato "${contract.textTitle}"? El siguiente paso será iniciar la devolución de los fondos.`,
      header: 'Confirmar Cancelación de Contrato',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, cancelar contrato',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        const studentId = this.currentUser?.id;
        if (!studentId) return;

        this.svc.cancelContractByStudent(contract.idContract, studentId).subscribe({
          next: (updated: IContract) => this.updateContractInList(updated),
          error: (err: any) => this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo cancelar el contrato.' })
        });
      }
    });
  }

  cancelContractByInvestor(contract: IContract): void {
    this.confirmSvc.confirm({
      message: `¿Estás seguro de que quieres retirar la oferta del contrato "${contract.textTitle}"?`,
      header: 'Confirmar Cancelación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, retirar oferta',
      rejectLabel: 'No',
      accept: () => {
        const investorId = this.currentUser?.id;
        if (!investorId) {
          this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo identificar al usuario.' });
          return;
        }
        this.svc.cancelContractByInvestor((contract as any).idContract, investorId).subscribe({
          next: (updatedContract) => {
            this.updateContractInList(updatedContract);
            this.toast.add({ severity: 'info', summary: 'Cancelado', detail: 'La oferta de contrato ha sido retirada.' });
          },
          error: (err) => this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo cancelar la oferta.' })
        });
      }
    });
  }

  /** Lógica de confirmación y firma, llamada desde saveContract */
  private confirmAndSign(contract: IContract): void {
    this.confirmSvc.confirm({
      message: `¿Estás seguro de que quieres firmar y aceptar los términos del contrato "${contract.textTitle}"? Esta acción no se puede deshacer.`,
      header: 'Confirmar Firma de Contrato',
      icon: 'pi pi-file-edit',
      acceptLabel: 'Sí, firmar',
      rejectLabel: 'No',
      accept: () => {
        const studentId = this.currentUser?.id;
        if (!studentId) {
          this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo identificar al usuario.' });
          return;
        }
        this.svc.signContractByStudent((contract as any).idContract, studentId).subscribe({
          next: (updatedContract) => {
            this.updateContractInList(updatedContract);
            this.toast.add({ severity: 'success', summary: 'Éxito', detail: 'Contrato firmado correctamente.' });
            this.cancelEdit(); // Cierra el panel
          },
          error: (err) => this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo firmar el contrato.' })
        });
      }
    });
  }

  /**
   * El estudiante inicia el proceso de devolución de un contrato.
   */
  initiateRefundProcess(contract: IContract): void {
    this.confirmSvc.confirm({
      message: `¿Estás seguro de que quieres iniciar el proceso de devolución para el contrato "${contract.textTitle}"? Esto preparará la inversión para el reembolso.`,
      header: 'Iniciar Devolución de Fondos',
      icon: 'pi pi-undo',
      acceptLabel: 'Sí, iniciar devolución',
      rejectLabel: 'No',
      accept: () => {
        const studentId = this.currentUser?.id;
        if (!studentId) return;

        this.svc.refundContract(contract.idContract, studentId).subscribe({
          next: (updated: IContract) => {
            this.updateContractInList(updated);
            // Si el modal de transacciones está abierto, actualizamos también su contenido
            if (this.selectedContractForTransactions()) {
              this.selectedContractForTransactions.update(c => {
                // Reemplazamos el contrato completo para asegurar que la inversión se actualice
                return c?.idContract === updated.idContract ? updated : c;
              });
            }
            this.toast.add({ severity: 'info', summary: 'Proceso Iniciado', detail: 'Ahora puedes gestionar la devolución desde el panel de pagos.' });
          },
          error: (err: any) => this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo iniciar la devolución.' })
        });
      }
    });
  }

  private updateContractInList(updated: IContract): void {
    this.contracts.update(list =>
      list.map(c => c.idContract === updated.idContract ? updated : c)
    );
  }

  /**
   * Lógica para que un inversor o estudiante firme un contrato que ya ha sido aprobado.
   */
  signContract(contract: IContract): void {
    this.confirmSvc.confirm({
      message: `Estás a punto de firmar el contrato "${contract.textTitle}". Esta acción es legalmente vinculante y no se puede deshacer. ¿Estás seguro de continuar?`,
      header: 'Confirmar Firma Final',
      icon: 'pi pi-file-edit',
      acceptLabel: 'Sí, Firmar Contrato',
      rejectLabel: 'No',
      accept: () => {
        if (this.isInvestor()) {
          const investorId = this.currentUser?.id;
          if (!investorId) return;
          this.svc.signContractByInvestor(contract.idContract, investorId).subscribe({
            next: (updated) => this.updateContractInList(updated),
            error: (err) => this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo firmar el contrato.' })
          });
        } else if (this.isOwner()) {
          const studentId = this.currentUser?.id;
          if (!studentId) return;
          // Usamos el endpoint que ya existía para la firma del estudiante
          this.svc.signContractByStudent(contract.idContract, studentId).subscribe({
            next: (updated) => this.updateContractInList(updated),
            error: (err) => this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo firmar el contrato.' })
          });
        }
      }
    });
  }

  /**
   * Lógica para que cualquiera de las partes "apruebe" los términos del borrador.
   */
  agreeToContractTerms(contract: IContract): void {
    this.confirmSvc.confirm({
      message: '¿Estás seguro de que quieres aprobar los términos de este borrador? Una vez aprobado, el contrato se bloqueará para su edición y pasará a la fase de firma.',
      header: 'Confirmar Aprobación de Términos',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sí, aprobar',
      rejectLabel: 'No',
      accept: () => {
        if (this.isInvestor()) {
          const investorId = this.currentUser?.id;
          if (!investorId) return;
          this.svc.agreeToContractByInvestor(contract.idContract, investorId).subscribe({
            next: (updated) => {
              this.updateContractInList(updated);
              this.cancelEdit(); // Cierra el modal
            },
            error: (err) => this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo aprobar el contrato.' })
          });
        } else if (this.isOwner()) {
          const studentId = this.currentUser?.id;
          if (!studentId) return;
          this.svc.agreeToContractByStudent(contract.idContract, studentId).subscribe({
            next: (updated) => {
              this.updateContractInList(updated);
              this.cancelEdit(); // Cierra el modal
            },
            error: (err) => this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo aprobar el contrato.' })
          });
        }
      }
    });
  }

  /**
   * El estudiante (dueño) cierra el contrato para generar la ganancia.
   */
  closeContract(contract: IContract): void {
    this.confirmSvc.confirm({
      message: `¿Estás seguro de que quieres cerrar el contrato "${contract.textTitle}"? Esta acción marcará el proyecto como finalizado para este inversor y generará el cálculo de la ganancia a devolver.`,
      header: 'Confirmar Cierre de Contrato',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sí, cerrar contrato',
      rejectLabel: 'No',
      accept: () => {
        const studentId = this.currentUser?.id;
        if (!studentId) return;

        // Aquí iría la llamada al nuevo endpoint del backend
        this.svc.closeContract(contract.idContract, studentId).subscribe({
          next: (updated: IContract) => this.updateContractInList(updated),
          error: (err: any) => this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo cerrar el contrato.' })
        });
      }
    });
  }

  private updateInvestmentInContract(investmentId: number, updatedInvestment: IInvestment): void {
    // Si la inversión fue recibida, actualizamos el fondeo del proyecto
    if (updatedInvestment.status === 'RECEIVED') {
      this.svc.getProjectById(this.projectId()).subscribe(p => {
        this.project.set(p);
        this.toast.add({ severity: 'info', summary: 'Financiación Actualizada', detail: 'El progreso de financiación del proyecto ha sido actualizado.', life: 3000 });
      });
    }

    // Actualiza la lista principal de contratos
    this.contracts.update(list => list.map(c => {
      if (c.investment?.idInvestment === investmentId) {
        let newContractStatus = c.status;
        // Si la inversión se canceló, el contrato también.
        if (updatedInvestment.status === 'CANCELLED') {
          newContractStatus = 'CANCELLED';
        }
        // Si la inversión fue devuelta, el contrato pasa a REFUNDED.
        if (updatedInvestment.status === 'RETURNED') {
          newContractStatus = 'REFUNDED';
        }

        return { ...c, investment: updatedInvestment, status: newContractStatus };
      }
      return c;
    }));

    // Actualiza también el contrato seleccionado en el modal de transacciones, si está abierto
    this.selectedContractForTransactions.update(c => {
      if (c && c.investment?.idInvestment === investmentId) {
        return { ...c, investment: updatedInvestment };
      }
      return c;
    });
  }

  /**
   * Abre el modal para gestionar el pago de las ganancias de un contrato.
   */
  openEarningModal(contract: IContract): void {
    // 1. Establece un estado de carga y muestra el modal vacío
    this.isProcessingEarning.set(true);
    this.selectedContractForEarnings.set(contract); // Selecciona el contrato base
    this.earningModalVisible.set(true); // Abre el modal

    // 2. Llama al servicio para obtener las ganancias actualizadas
    this.svc.getEarningsByContractId(contract.idContract).subscribe({
      next: (earnings) => {
        // 3. Actualiza el contrato seleccionado con las ganancias recibidas
        this.selectedContractForEarnings.update(c => c ? { ...c, earnings } : null);
      },
      error: (err) => this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los detalles de la ganancia.' }),
      complete: () => this.isProcessingEarning.set(false) // 4. Finaliza el estado de carga
    });
  }



  // ===== Acciones de Inversión (Confirmación de Fondos) =====

  confirmInvestmentPaymentSent(investmentId: number): void {
    const investorId = this.currentUser?.id;
    if (!investorId) return;

    this.confirmSvc.confirm({
      message: '¿Estás seguro de que quieres notificar el envío de los fondos? Esta acción no se puede deshacer.',
      header: 'Confirmar Envío de Inversión',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, he enviado los fondos',
      rejectLabel: 'No, cancelar',
      accept: () => {
        this.isProcessingTransaction.set(true);
        this.svc.confirmInvestmentPaymentSent(investmentId, investorId).subscribe({
          next: (updatedInvestment: IInvestment) => {
            this.toast.add({
              severity: 'success',
              summary: 'Notificación Enviada',
              detail: 'Se ha notificado al estudiante sobre el envío de los fondos.'
            });
            this.updateInvestmentInContract(investmentId, updatedInvestment);
            this.transactionModalVisible.set(false); // Cerrar el modal al éxito
          },
          error: (err: any) => {
            this.isProcessingTransaction.set(false);
            this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo notificar el envío.' });
          },
          complete: () => this.isProcessingTransaction.set(false)
        });
      }
    });
  }

  confirmInvestmentReceipt(investmentId: number): void {
    const studentId = this.currentUser?.id;
    if (!studentId) return;

    this.confirmSvc.confirm({
      message: '¿Estás seguro de que quieres confirmar la recepción de los fondos? Esta acción es irreversible.',
      header: 'Confirmar Recepción de Fondos',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sí, he recibido los fondos',
      rejectLabel: 'No, cancelar',
      accept: () => {
        this.isProcessingTransaction.set(true);
        this.svc.confirmInvestmentReceipt(investmentId, studentId).subscribe({
          next: (updatedInvestment: IInvestment) => {
            this.toast.add({
              severity: 'success',
              summary: 'Recepción Confirmada',
              detail: 'Se ha confirmado la recepción del dinero y se ha notificado al inversor.'
            });
            this.updateInvestmentInContract(investmentId, updatedInvestment);
          },
          error: (err: any) => {
            this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo confirmar la recepción.' });
          },
          complete: () => this.isProcessingTransaction.set(false)
        });
      }
    });
  }

  markInvestmentAsNotReceived(investmentId: number): void {
    const studentId = this.currentUser?.id;
    if (!studentId) return;

    this.confirmSvc.confirm({
      message: '¿Estás seguro de que quieres marcar esta inversión como NO recibida? Esto cancelará el contrato asociado.',
      header: 'Confirmar No Recepción',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, no la recibí',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.isProcessingTransaction.set(true);
        this.svc.markInvestmentAsNotReceived(investmentId, studentId).subscribe({
          next: (updatedInvestment: IInvestment) => {
            this.toast.add({
              severity: 'warn',
              summary: 'Operación Registrada',
              detail: 'Se ha notificado al inversor sobre la no recepción de los fondos.'
            });
            this.updateInvestmentInContract(investmentId, updatedInvestment);
          },
          error: (err: any) => {
            this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo marcar como no recibida.' });
          },
          complete: () => this.isProcessingTransaction.set(false),
        });
      }
    });
  }

  retryInvestmentPayment(investmentId: number): void {
    const investorId = this.currentUser?.id;
    if (!investorId) return;

    this.confirmSvc.confirm({
      message: 'Esto te permitirá notificar nuevamente el envío de los fondos. ¿Estás seguro?',
      header: 'Confirmar Reintento de Envío',
      icon: 'pi pi-replay',
      acceptLabel: 'Sí, reintentar',
      rejectLabel: 'No, cancelar',
      accept: () => {
        this.isProcessingTransaction.set(true);
        // Reutilizamos el endpoint de "confirmar envío", ya que la lógica del backend maneja el reintento.
        this.svc.confirmInvestmentPaymentSent(investmentId, investorId).subscribe({
          next: (updatedInvestment: IInvestment) => {
            this.updateInvestmentInContract(investmentId, updatedInvestment);
            this.toast.add({ severity: 'info', summary: 'Proceso Reiniciado', detail: 'Puedes notificar el envío de la inversión nuevamente.' });
          },
          error: (err: any) => {
            this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo reiniciar el proceso.' });
          },
          complete: () => this.isProcessingTransaction.set(false)
        });
      }
    });
  }

  confirmRefundSent(investmentId: number): void {
    const studentId = this.currentUser?.id;
    if (!studentId) return;

    this.confirmSvc.confirm({
      message: '¿Confirmas que has enviado la devolución de los fondos a la cuenta del inversor? Esta acción notificará al inversor para que confirme la recepción.',
      header: 'Confirmar Envío de Devolución',
      icon: 'pi pi-send',
      acceptLabel: 'Sí, he enviado el dinero',
      rejectLabel: 'No',
      accept: () => {
        this.isProcessingTransaction.set(true);
        this.svc.confirmRefundSentByStudent(investmentId, studentId).subscribe({
          next: (updated: IInvestment) => {
            this.updateInvestmentInContract(investmentId, updated);
            this.toast.add({ severity: 'success', summary: 'Notificado', detail: 'El inversor ha sido notificado.' });
          },
          error: (err: any) => this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo notificar el envío.' }),
          complete: () => this.isProcessingTransaction.set(false)
        });
      }
    });
  }

  markRefundAsNotReceived(investmentId: number): void {
    const investorId = this.currentUser?.id;
    if (!investorId) return;

    this.confirmSvc.confirm({
      message: '¿Estás seguro de que quieres marcar esta devolución como NO recibida? Esto notificará al estudiante para que revise el envío.',
      header: 'Confirmar No Recepción',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, no lo he recibido',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.isProcessingTransaction.set(true);
        this.svc.markRefundAsNotReceived(investmentId, investorId).subscribe({
          next: (updated: IInvestment) => {
            this.updateInvestmentInContract(investmentId, updated);
            this.toast.add({
              severity: 'warn',
              summary: 'Registrado',
              detail: 'Se ha notificado al estudiante que no has recibido la devolución.'
            });
          },
          error: (err: any) => this.toast.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'No se pudo realizar la acción.'
          }),
          complete: () => this.isProcessingTransaction.set(false)
        });
      }
    });
  }

  notifyInvestmentReturnSent(investmentId: number): void {
    const studentId = this.currentUser?.id;
    if (!studentId) return;

    this.confirmSvc.confirm({
      message: '¿Estás seguro de que quieres notificar la devolución de esta inversión? Asegúrate de haber realizado la transferencia antes de continuar.',
      header: 'Confirmar Envío de Devolución',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, he devuelto los fondos',
      rejectLabel: 'No, cancelar',
      accept: () => {
        this.isProcessingTransaction.set(true);
        this.svc.notifyInvestmentReturnSent(investmentId, studentId).subscribe({
          next: (updatedInvestment: IInvestment) => {
            this.toast.add({
              severity: 'success',
              summary: 'Notificación Enviada',
              detail: 'Se ha notificado al inversor sobre la devolución de los fondos.'
            });
            this.updateInvestmentInContract(investmentId, updatedInvestment);
          },
          error: (err: any) => this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo notificar la devolución.' }),
          complete: () => this.isProcessingTransaction.set(false)
        });
      }
    });
  }

  confirmInvestmentReturnReceipt(investmentId: number): void {
    const investorId = this.currentUser?.id;
    if (!investorId) return;

    this.confirmSvc.confirm({
      message: '¿Estás seguro de que quieres confirmar la recepción de la devolución de tu inversión? Esta acción es irreversible.',
      header: 'Confirmar Recepción de Devolución',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sí, he recibido la devolución',
      rejectLabel: 'No, cancelar',
      accept: () => {
        this.isProcessingTransaction.set(true);
        this.svc.confirmInvestmentReturnReceipt(investmentId, investorId).subscribe({
          next: (updatedInvestment) => {
            this.toast.add({
              severity: 'success',
              summary: 'Recepción Confirmada',
              detail: 'Has confirmado la recepción de la devolución.'
            });
            this.updateInvestmentInContract(investmentId, updatedInvestment);
          },
          error: (err) => this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo confirmar la recepción.' }),
          complete: () => this.isProcessingTransaction.set(false)
        });
      }
    });
  }

  getInvestmentStatusTooltip(investment: IInvestment | null | undefined): string {
    if (!investment?.status) return '';
    return `Estado de la inversión: ${this.getInvestmentStatusLabel(investment)}`;
  }

  private updateEarningInContract(earningId: number, updatedEarning: IEarning): void {
    this.contracts.update(list => list.map(c => {
      // Buscamos el índice de la ganancia dentro del array de ganancias del contrato
      const earningIndex = c.earnings?.findIndex(e => e.idEarning === earningId);
      if (earningIndex !== undefined && earningIndex > -1) {
        const newEarnings = [...c.earnings!]; // Creamos una copia del array
        newEarnings[earningIndex] = updatedEarning; // Reemplazamos la ganancia actualizada
        return { ...c, earnings: newEarnings }; // Devolvemos el contrato con el array de ganancias actualizado
      }
      return c;
    }));
    this.toast.add({ severity: 'success', summary: 'Éxito', detail: 'El estado del pago de la ganancia ha sido actualizado.' });
  }

  // ===== Acciones de Ganancias (Earnings) =====

  confirmEarningPaymentSent(earningId: number): void {
    const studentId = this.currentUser?.id;
    if (!studentId) return;

    this.confirmSvc.confirm({
      message: '¿Estás seguro de que quieres notificar el envío de la ganancia al inversor? Esta acción es irreversible.',
      header: 'Confirmar Envío de Ganancia',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, he enviado la ganancia',
      rejectLabel: 'No, cancelar',
      accept: () => {
        this.isProcessingEarning.set(true);
        this.svc.confirmEarningPaymentSent(earningId, studentId).subscribe({
          next: (updatedEarning: IEarning) => {
            this.updateEarningInContract(earningId, updatedEarning);
            this.toast.add({ severity: 'success', summary: 'Éxito', detail: 'Se ha notificado el envío de la ganancia.' });
            this.earningModalVisible.set(false); // Cerrar el modal
          },
          error: (err: any) => this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo notificar el envío de la ganancia.' }),
          complete: () => this.isProcessingEarning.set(false)
        });
      }
    });
  }

  confirmEarningReceipt(earningId: number): void {
    const investorId = this.currentUser?.id;
    if (!investorId) return;
    
    this.confirmSvc.confirm({
      message: '¿Estás seguro de que quieres confirmar la recepción de la ganancia? Esta acción es irreversible.',
      header: 'Confirmar Recepción de Ganancia',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sí, he recibido la ganancia',
      rejectLabel: 'No, cancelar',
      accept: () => {
        this.isProcessingEarning.set(true);
        this.svc.confirmEarningReceipt(earningId, investorId).subscribe({
          next: (updatedEarning: IEarning) => {
            this.updateEarningInContract(earningId, updatedEarning);
            this.toast.add({ severity: 'success', summary: 'Éxito', detail: 'Se ha confirmado la recepción de la ganancia.' });
            this.earningModalVisible.set(false); // Cerrar el modal
          },
          error: (err: any) => this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo confirmar la recepción de la ganancia.' }),
          complete: () => this.isProcessingEarning.set(false)
        });
      }
    });
  }

  markEarningAsNotReceived(earningId: number): void {
    const investorId = this.currentUser?.id;
    if (!investorId) return;

    this.confirmSvc.confirm({
      message: '¿Estás seguro de que quieres marcar esta ganancia como NO recibida? Esto notificará al estudiante.',
      header: 'Confirmar No Recepción',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, no la recibí',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.isProcessingEarning.set(true);
        this.svc.markEarningAsNotReceived(earningId, investorId).subscribe({
          next: (updatedEarning: IEarning) => {
            this.updateEarningInContract(earningId, updatedEarning);
            this.toast.add({ severity: 'warn', summary: 'Registrado', detail: 'Se ha marcado la ganancia como no recibida.' });
            this.earningModalVisible.set(false); // Cerrar el modal
          },
          error: (err: any) => this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo realizar la acción.' }),
          complete: () => this.isProcessingEarning.set(false)
        });
      }
    });
  }

  /**
   * El estudiante reintenta el envío de una ganancia que fue marcada como no recibida.
   * Llama al mismo método que el envío inicial, ya que el backend maneja la lógica de reintento.
   */
  retryEarningPayment(earningId: number): void {
    this.confirmEarningPaymentSent(earningId);
  }

  earningLifecycleActiveIndex(earning: IEarning): number {
    if (!earning) return -1;

    const currentStatus = earning.status;
    switch (currentStatus) {
      case 'IN_PROGRESS': return 0;
      case 'PENDING_CONFIRMATION': return 1;
      case 'RECEIVED': return 2;
      default: return -1;
    }
  }
  getProjectStatusLabel(status: string | null): string {
    switch (status) {
      case 'IN_PROGRESS': return 'En Progreso';
      case 'PENDING_FUNDING': return 'Pendiente de Financiación';
      case 'COMPLETED': return 'Completado';
      case 'NOT_FUNDED': return 'No Financiado';
      case 'CANCELLED': return 'Cancelado';
      default: return status || '—';
    }
  }

  getInvestmentStatusLabel(investment: IInvestment | null | undefined): string {
    const isInvestor = this.isInvestor();
    if (!investment) return 'Desconocido';
    const status = investment.status;

    switch (status) {
      case 'IN_PROGRESS':
        return isInvestor ? 'Pendiente de Envío' : 'Pendiente de Recepción';

      case 'PENDING_CONFIRMATION':
        // Este estado es solo para el flujo de inversión inicial
        return isInvestor ? 'Envío Notificado (Esperando Confirmación)' : 'Confirmación Pendiente';

      case 'RECEIVED':
        return isInvestor ? 'Inversión Recibida por el Estudiante' : 'Fondos Recibidos';

      case 'NOT_RECEIVED':
        if (isInvestor) {
          return `No Recibido (Intentos restantes: ${investment.remainingRetries ?? 0})`;
        }
        return 'Marcado como No Recibido';

      case 'CANCELLED':
        return 'Inversión Cancelada';

      case 'COMPLETED':
        return 'Inversión Completada';

      case 'PENDING_REFUND':
        return 'Devolución Pendiente';

      case 'PENDING_RETURN':
        // En este estado, el estudiante ya envió, se espera confirmación del inversor.
        return 'Devolución Notificada';

      case 'RETURNED':
        return 'Fondos Devueltos';
      
      case 'REFUND_FAILED':
        return 'Fallo en la Devolución';

      default:
        return 'Desconocido';
    }
  }

  getDegreeStatusLabel(status: string | null): string {
    switch (status) {
      case 'IN_PROGRESS': return 'En Curso';
      case 'ADVANCED': return 'Avanzado';
      case 'GRADUATED': return 'Graduado';
      case 'COMPLETED': return 'Completado';
      case 'PAUSED': return 'En Pausa';
      default: return status || 'No especificado';
    }
  }

  getUniversityLabel(university: string | null): string {
    if (!university) return 'No especificada';
    // Reemplaza guiones bajos por espacios y convierte todo a mayúsculas.
    return university.replace(/_/g, ' ').toUpperCase();
  }

  getEarningStatusLabel(status: IEarning['status'] | null): string {
    const isInvestor = this.isInvestor();
    switch (status) {
      case 'IN_PROGRESS':
        return isInvestor ? 'Pendiente de Envío por el Estudiante' : 'Pendiente de Envío al Inversor';
      case 'PENDING_CONFIRMATION':
        return isInvestor ? 'Confirmación de Recepción Pendiente' : 'Envío Notificado';
      case 'RECEIVED':
        return 'Ganancia Recibida';
      case 'NOT_RECEIVED':
        return 'Marcado como No Recibido';
      default:
        return 'Desconocido';
    }
  }

  getContractStatusLabel(contract: IContract | null): string {
    if (!contract) return '—';
    const status = contract.status;

    switch (status) {
      case 'DRAFT': return 'Borrador (En Negociación)';
      case 'PARTIALLY_SIGNED':
        if (contract.investorSigned && !contract.studentSigned) return 'Esperando Firma del Estudiante';
        if (!contract.investorSigned && contract.studentSigned) return 'Esperando Firma del Inversor';
        if (!contract.investorSigned && !contract.studentSigned) return 'Pendiente de Ambas Firmas';
        return 'Aprobado (Pend. Firma)'; // Fallback

      case 'PENDING_STUDENT_SIGNATURE': return 'Pendiente de Firma';
      case 'SIGNED': return 'Firmado';
      case 'CANCELLED': return 'Cancelado';
      case 'PENDING_REFUND': return 'Pendiente de Devolución';
      case 'REFUNDED': return 'Devuelto';
      case 'CLOSED': return 'Cerrado';
      case 'REFUND_FAILED': return 'Fallo en Devolución';
      default: return status || '—';
    }
  }

  getInvestmentStatusLabel(status: IInvestment['status'] | null): string {
    switch (status) {
      case 'IN_PROGRESS': return 'Pendiente de Pago'; // Mapear IN_PROGRESS a "Pendiente de Pago"
      case 'PENDING_CONFIRMATION': return 'Pendiente de Confirmación';
      case 'RECEIVED': return 'Recibido';
      case 'COMPLETED': return 'Completado';
      case 'NOT_RECEIVED': return 'No Recibido';
      case 'CANCELLED': return 'Cancelado';
      default: return 'Desconocido';
    }
  }

  getEarningStatusLabel(status: IEarning['status'] | null): string {
    switch (status) {
      case 'PENDING': return 'Pendiente de Pago';
      case 'PAID': return 'Pago Enviado';
      case 'CONFIRMED': return 'Recibido y Confirmado';
      default: return 'Desconocido';
    }
  }

  tagStyle(text: string, i = 0) {
    const palette = ['#e0f2fe', '#dcfce7', '#fee2e2', '#fef9c3', '#ede9fe'];
    const idx = Math.abs((text || '').length + i) % palette.length;
    return { background: palette[idx], color: '#111827', borderRadius: '9999px', padding: '0 8px', 'font-weight': 600 };
  }

  private setupCurrencyConversionListener(): void {
    // Cancelamos cualquier suscripción anterior para evitar fugas de memoria.
    if (this.currencyConversionSub) {
      this.currencyConversionSub.unsubscribe();
    }

    this.currencyConversionSub = this.contractForm.valueChanges.pipe(
      debounceTime(400), // Espera 400ms después de que el usuario deja de escribir
      // Solo reacciona si el monto o la moneda han cambiado
      distinctUntilChanged((prev, curr) => prev.amount === curr.amount && prev.currency === curr.currency),
      filter(() => !this.isReadonly()), // No ejecutar en modo solo lectura
      tap(() => this.isConvertingCurrency.set(true)), // Inicia la carga
      switchMap(formValue => {
        const { amount, currency } = formValue;
        if (currency && currency !== 'USD' && amount != null && amount > 0) {
          return this.svc.convertCurrency(currency, 'USD', amount);
        }
        this.convertedAmountUSD.set(null); // Si no se necesita conversión, limpia el monto
        return of(null); // Si no se necesita conversión, emite null
      })
    ).subscribe(result => {
      this.convertedAmountUSD.set(result?.convertedAmount ?? null);
      this.isConvertingCurrency.set(false); // Finaliza la carga
    });
  }

  /**
   * Validador asíncrono para el nombre del contrato.
   * Verifica en tiempo real si el nombre ya está en uso para el proyecto actual.
   */
  private contractNameValidator() {
    return (control: import('@angular/forms').AbstractControl) => {
      const title = control.value;
      if (!title) {
        return of(null); // Si no hay título, no hay error
      }

      // Si estamos editando y el título no ha cambiado, no es necesario validar
      if (this.editing && title.trim().toLowerCase() === this.editing.textTitle?.trim().toLowerCase()) {
        return of(null);
      }

      return timer(500).pipe( // Espera 500ms antes de hacer la llamada
        switchMap(() => this.svc.checkContractExists(this.projectId(), title)),
        map(response => (response.exists ? { contractNameExists: true } : null))
      );
    };
  }
}
