import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ActivatedRoute, RouterLink } from '@angular/router'; // RouterLink ya estaba en una de las versiones
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { ToolbarModule } from 'primeng/toolbar';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button'; // (lo podés quitar si ya no usás el modal)
import { DialogModule } from 'primeng/dialog';            // (lo podés quitar si ya no usás el modal)
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { AccordionModule } from 'primeng/accordion';
import { SliderModule } from 'primeng/slider';
import { EditorModule } from 'primeng/editor';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MenuModule } from 'primeng/menu';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';

import { ProjectsMasterService } from '../../../core/services/projects-master.service';
import { AuthService, Session } from '../../auth/login/auth.service';
import type { ContactOwnerDTO, IInvestment, IEarning } from '../../../core/services/projects-master.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';
import type { IMyProject, IContract } from '../../../core/services/projects-master.service';


type Student = { id: number; name: string; email?: string };

@Component({
  standalone: true,
  selector: 'app-proyectos-maestro',
  templateUrl: './proyectos-maestro.component.html',
  styleUrls: ['./proyectos-maestro.component.scss'],
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    ToolbarModule, CardModule, TagModule, TableModule,
    ButtonModule, DialogModule, InputTextModule, InputNumberModule, EditorModule, ConfirmDialogModule, SliderModule, TooltipModule, ProgressBarModule, MenuModule, RouterLink, SafeHtmlPipe,
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
  private auth = inject(AuthService);
  private confirmSvc = inject(ConfirmationService);

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

  fundingProgress = computed(() => {
    const p = this.project();
    if (!p || !p.fundingGoal || p.fundingGoal <= 0 || !p.fundingRaised) {
      return 0;
    }
    // Calcula el porcentaje y lo limita a un máximo de 100
    return Math.min(100, (p.fundingRaised / p.fundingGoal) * 100);
  });

  contracts = signal<IContract[]>([]);
  loading = signal<boolean>(false);

  // ===== Acordeón Crear/Editar contrato =====
  contractModalVisible = signal<boolean>(false); // Renombrado de accordionOpen
  editing: IContract | null = null;
  isReadonly = signal<boolean>(false); // NUEVA SEÑAL para controlar el modo de solo lectura
  viewingOnly = signal<IContract | null>(null);

  currentContractStatus = computed<IContract['status'] | 'PENDING_STUDENT_SIGNATURE'>(() => {
    const contractInView = this.viewingOnly() || this.reviewingToSign || this.editing;
    return contractInView?.status || 'PENDING_STUDENT_SIGNATURE';
  });
  currentContractStatusLabel = computed(() => this.getContractStatusLabel(this.currentContractStatus()));

  reviewingToSign: IContract | null = null; // Nuevo estado para cuando un estudiante revisa un contrato para firmar
  currencyOptions = [
    { label: 'Dólar Estadounidense', value: 'USD' },
    { label: 'Peso Argentino', value: 'ARS' },
    { label: 'Euro', value: 'EUR' },
    { label: 'Yuan Chino', value: 'CNY' }
  ];
  contractForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0)]],
    currency: ['USD', Validators.required],
    profit1Year: [10, [Validators.required, Validators.min(0), Validators.max(100)]],
    profit2Years: [15, [Validators.required, Validators.min(0), Validators.max(100)]],
    profit3Years: [20, [Validators.required, Validators.min(0), Validators.max(100)]],
    description: [''], // Renombrado de 'clauses' a 'description'
  });
  
  contractTemplates: MenuItem[] = [];

  // ===== Formulario de Contacto =====
  contactDialogVisible = signal(false);
  contactForm = this.fb.group({
    subject: ['', Validators.required],
    message: ['', Validators.required],
  });

  // ===== Modal de Gestión de Pagos =====
  transactionModalVisible = signal(false);
  selectedContractForTransactions = signal<IContract | null>(null);



  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.toast.add({ severity: 'warn', summary: 'Proyecto', detail: 'ID inválido', life: 2200 });
      return;
    }
    this.projectId.set(id);
    this.loadProject();
    this.loadContracts();
    this.setupContractTemplates();
  }

  goBack(): void {
    window.history.back();
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
        this.contracts.set(list || []);
      }
    });
  }

  // ===== Crear / Editar contrato (Acordeón) =====
  openCreateContract(): void {
    if (!this.isInvestor()) return;
    this.editing = null;
    this.isReadonly.set(false); // Asegurarse de que no esté en modo solo lectura
    this.contractForm.reset({
      title: '',
      amount: 0,
      currency: 'USD',
      description: '',
    });
    this.contractModalVisible.set(true); // Usar la nueva señal del modal
  }

  editContract(row: IContract): void {
    // Permitir editar si es inversor o si es dueño y el contrato está en DRAFT
    if (!this.isInvestor() && !(this.isOwner() && row.status === 'DRAFT')) return;

    this.editing = row;
    this.isReadonly.set(false); // El modo edición no es de solo lectura
    this.contractForm.patchValue({ // Usar patchValue en lugar de reset
      // Corregido: Usar textTitle que es el que contiene el dato correcto
      title: row.textTitle,
      amount: row.amount,
      currency: row.currency ?? 'USD',
      description: row.description ?? '',
    });
    this.contractModalVisible.set(true); // Usar la nueva señal del modal
  }

  cancelEdit(): void {
    this.contractModalVisible.set(false); // Usar la nueva señal del modal
    this.editing = null;
    this.reviewingToSign = null;
    this.viewingOnly.set(null);
    this.isReadonly.set(false); // Salir del modo solo lectura
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
        this.updateContractInList(saved);
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

  private updateInvestmentInContract(investmentId: number, updatedInvestment: IInvestment): void {
    this.contracts.update(list => list.map(c => {
      if (c.investment?.idInvestment === investmentId) {
        // Si la inversión se cancela, también actualizamos el estado del contrato principal
        const newContractStatus = updatedInvestment.status === 'CANCELLED' ? 'CANCELLED' : c.status;
        return { ...c, investment: updatedInvestment, status: newContractStatus };
      }
      return c;
    }));
    this.toast.add({ severity: 'success', summary: 'Éxito', detail: 'El estado de la inversión ha sido actualizado.' });
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


  // ===== Acciones de Inversión (Confirmación de Fondos) =====

  confirmInvestmentPaymentSent(investmentId: number): void {
    const investorId = this.currentUser?.id;
    if (!investorId) return;

    this.svc.confirmInvestmentPaymentSent(investmentId, investorId).subscribe({
      next: (updatedInvestment: IInvestment) => this.updateInvestmentInContract(investmentId, updatedInvestment),
      error: (err: any) => this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo notificar el envío.' })
    });
  }

  confirmInvestmentReceipt(investmentId: number): void {
    const studentId = this.currentUser?.id;
    if (!studentId) return;

    this.svc.confirmInvestmentReceipt(investmentId, studentId).subscribe({
      next: (updatedInvestment: IInvestment) => this.updateInvestmentInContract(investmentId, updatedInvestment),
      error: (err: any) => this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo confirmar la recepción.' })
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
        this.svc.markInvestmentAsNotReceived(investmentId, studentId).subscribe({
          next: (updatedInvestment: IInvestment) => this.updateInvestmentInContract(investmentId, updatedInvestment),
          error: (err: any) => this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo marcar como no recibida.' })
        });
      }
    });
  }

  // ===== Acciones de Ganancias (Earnings) =====

  confirmEarningPaymentSent(earningId: number): void {
    const studentId = this.currentUser?.id;
    if (!studentId) return;

    this.svc.confirmEarningPaymentSent(earningId, studentId).subscribe({
      next: (updatedEarning: IEarning) => this.updateEarningInContract(earningId, updatedEarning),
      error: (err: any) => this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo notificar el envío de la ganancia.' })
    });
  }

  confirmEarningReceipt(earningId: number): void {
    const investorId = this.currentUser?.id;
    if (!investorId) return;

    this.svc.confirmEarningReceipt(earningId, investorId).subscribe({
      next: (updatedEarning: IEarning) => this.updateEarningInContract(earningId, updatedEarning),
      error: (err: any) => this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo confirmar la recepción de la ganancia.' })
    });
  }

  getProjectStatusLabel(status: string | null): string {
    switch (status) {
      case 'IN_PROGRESS': return 'En Progreso';
      case 'PENDING_FUNDING': return 'Pendiente de Financiación';
      case 'COMPLETED': return 'Completado';
      default: return status || '—';
    }
  }

  getContractStatusLabel(status: IContract['status'] | string | null): string {
    switch (status) {
      case 'DRAFT': return 'Borrador (En Negociación)';
      case 'PARTIALLY_SIGNED': return 'Aprobado (Pend. Firma)';
      case 'PENDING_STUDENT_SIGNATURE': return 'Pendiente de Firma';
      case 'SIGNED': return 'Firmado';
      case 'CANCELLED': return 'Cancelado';
      case 'REFUNDED': return 'Devuelto';
      case 'CLOSED': return 'Cerrado';
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
}
