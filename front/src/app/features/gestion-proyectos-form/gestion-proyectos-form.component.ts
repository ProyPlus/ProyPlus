import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import {
  GestionAdminService,
  ServerResponseContractDTO,
  ServerResponseInvestmentDTO,
  ServerResponseEarningDTO,
  RequestAdminProjectUpdateDTO,
  RequestAdminContractUpdateDTO,
  Currency,
  ContractStatus,
  InvestmentStatus,
  EarningStatus,
  ProjectStatus
} from '../../core/services/gestion-admin.service';

import { ProjectsService } from '../../core/services/projects.service';

interface IProject {
  id?: number;
  title: string;
  summary?: string | null;
  description?: string | null;
  fundingGoal?: number | null;
  fundingRaised?: number | null;
  status?: ProjectStatus;
  startDate?: string | null;
  estimatedEndDate?: string | null;
  endDate?: string | null;
  deleted?: boolean;
  lastUpdated?: string | null;
}

interface ResponseContractDTO {
  idContract: number;
  projectId?: number;
  textTitle: string;
  description: string;
  amount: number;
  currency: Currency;
  status: ContractStatus | string;
  createdAt: string;
  createdByInvestorId: number;
  profit1Year?: number;
  profit2Years?: number;
  profit3Years?: number;
  investorSigned?: boolean;
  investorSignedDate?: string | null;
  studentSigned?: boolean;
  studentSignedDate?: string | null;
  actions?: any[];
}

interface ResponseInvestmentDTO {
  idInvestment: number;
  projectId?: number;
  amount: number;
  currency: Currency;
  status: InvestmentStatus | string;
  createdAt: string;
  generatedById: number;
  confirmedAt?: string | null;
}

interface ResponseEarningDTO {
  idEarning: number;
  projectId?: number;
  amount: number;
  profitRate: number;
  currency: Currency;
  status: EarningStatus | string;
  createdAt: string;
  confirmedAt?: string | null;
  contractId: number;
}

@Component({
  selector: 'app-gestion-proyectos-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    ToolbarModule,
    ButtonModule,
    InputTextModule,
    ToastModule
  ],
  templateUrl: './gestion-proyectos-form.component.html',
  styleUrls: ['./gestion-proyectos-form.component.scss'],
  providers: [MessageService]
})
export class GestionProyectosFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(MessageService);
  private adminService = inject(GestionAdminService);
  private projectsSvc = inject(ProjectsService);

  form = this.fb.group({
    id: [null],
    name: ['', Validators.required],
    description: [''],
    budgetGoal: [null],
    status: ['PENDING_FUNDING'],
    startDate: [null],
    estimatedEndDate: [null],
    endDate: [null],
    deleted: [false]
  }) as any;

  currentProject: IProject | null = null;

  contracts: ResponseContractDTO[] = [];
  investments: ResponseInvestmentDTO[] = [];
  earnings: ResponseEarningDTO[] = [];
  activeTab: 'contracts' | 'investments' | 'earnings' = 'contracts';
  showContractModal = false;
  editingContract: ResponseContractDTO | null = null;
  showInvestmentModal = false;
  editingInvestment: ResponseInvestmentDTO | null = null;
  showEarningModal = false;
  editingEarning: ResponseEarningDTO | null = null;

  statusOptions: ProjectStatus[] = ['PENDING_FUNDING', 'IN_PROGRESS', 'COMPLETED', 'NOT_FUNDED'];
  contractStatusOptions: ContractStatus[] = ['DRAFT', 'PARTIALLY_SIGNED', 'SIGNED', 'CANCELLED', 'REFUNDED', 'CLOSED'];
  investmentStatusOptions: InvestmentStatus[] = [
    'IN_PROGRESS',
    'PENDING_CONFIRMATION',
    'RECEIVED',
    'NOT_RECEIVED',
    'CANCELLED',
    'PENDING_RETURN',
    'RETURNED',
    'COMPLETED'
  ];
  earningStatusOptions: EarningStatus[] = ['IN_PROGRESS', 'PENDING_CONFIRMATION', 'RECEIVED', 'NOT_RECEIVED'];
  currencyOptions: Currency[] = ['USD', 'ARS', 'CNY', 'EUR'];

  // ----------------- helpers para fechas -----------------
  private toDate(iso?: string | null): Date | null {
    if (!iso) return null;
    const parts = iso.split('-').map(p => Number(p));
    if (parts.length >= 3 && !Number.isNaN(parts[0])) {
      return new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
    }
    const parsed = new Date(iso);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  private formatDateToIso(d?: Date | string | null): string | null {
    if (!d) return null;
    if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    const date = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(date.getTime())) return null;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private parseBool(v: any): boolean {
    return v === true || v === 'true' || v === 1 || v === '1';
  }
  // -------------------------------------------------------

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const projectIdFromUrl = idParam ? Number(idParam) : null;

    const navProject = this.router.getCurrentNavigation()?.extras.state?.['project'];
    const historyProject = (history && (history.state as any))?.project;
    const projectFromState: IProject | null = navProject ?? historyProject ?? null;

    if (projectFromState) {
      console.log('[GestionProyectos] Proyecto cargado desde el estado de navegación (Datos principales).');
      this.patchProjectData(projectFromState);
    }

    const finalProjectId = projectFromState?.id ?? projectIdFromUrl;

    if (finalProjectId) {
      if (!projectFromState) {
        this.projectsSvc.getById(finalProjectId).subscribe({
          next: (p) => {
            if (p) this.patchProjectData(p as IProject);
            this.loadRelatedResources(finalProjectId);
          },
          error: (err) => {
            console.error('[GestionProyectos] Error cargando proyecto por id', err);
            this.loadRelatedResources(finalProjectId);
          }
        });
      } else {
        this.loadRelatedResources(finalProjectId);
      }
    } else {
      console.warn('[GestionProyectos] No se encontró ID de proyecto. Podría ser un formulario de creación.');
    }
  }

  // patchProjectData: usar ISO strings si template usa <input type="date">.
  private patchProjectData(project: IProject): void {
    this.currentProject = project;
    console.debug('[GestionProyectos] patchProjectData project (raw):', project);

    const isoStart = (project as any).startDate ?? (project as any).lastUpdated ?? null;
    const isoEstimated = (project as any).estimatedEndDate ?? null;
    const isoEnd = (project as any).endDate ?? null;

    console.debug('[GestionProyectos] fechas (ISO):', { isoStart, isoEstimated, isoEnd });

    this.form.patchValue({
      id: project.id ?? null,
      name: project.title ?? '',
      description: project.description ?? project.summary ?? '',
      budgetGoal: (project as any).fundingGoal ?? (project as any).budgetGoal ?? null,
      status: project.status ?? 'PENDING_FUNDING',
      // Si tu template usa <input type="date"> usa las líneas siguientes (strings YYYY-MM-DD)
      startDate: isoStart,
      estimatedEndDate: isoEstimated,
      endDate: isoEnd,
      deleted: this.parseBool(project.deleted)
    });
  }

  private loadRelatedResources(projectId: number): void {
    this.fetchContracts(projectId);
    this.fetchInvestments(projectId);
    this.fetchEarnings(projectId);
  }

  private fetchContracts(projectId: number): void {
    this.adminService.getContractsByProject(projectId).subscribe(list => {
      this.contracts = (list || []).map((l: ServerResponseContractDTO) => ({
        idContract: l.idContract,
        projectId: l.projectId,
        createdByInvestorId: l.createdByInvestorId ?? 0,
        textTitle: l.textTitle,
        description: l.description ?? '',
        amount: Number(l.amount ?? 0),
        currency: (l.currency as Currency) ?? 'USD',
        status: (l.status as ContractStatus) ?? 'SIGNED',
        createdAt: l.createdAt ?? '',
        investorSigned: !!l.investorSigned,
        investorSignedDate: l.investorSignedDate ?? null,
        studentSigned: !!l.studentSigned,
        studentSignedDate: l.studentSignedDate ?? null,
        profit1Year: l.profit1Year,
        profit2Years: l.profit2Years,
        profit3Years: l.profit3Years,
        actions: []
      } as ResponseContractDTO));
      console.log('[GestionProyectos] contracts loaded', this.contracts.length);
    });
  }

  private fetchInvestments(projectId: number): void {
    this.adminService.getInvestmentsByProject(projectId).subscribe(list => {
      this.investments = (list || []).map((l: ServerResponseInvestmentDTO) => ({
        idInvestment: l.idInvestment,
        projectId: l.projectId,
        amount: Number(l.amount ?? 0),
        currency: l.currency ?? 'USD',
        status: l.status,
        createdAt: l.createdAt ?? '',
        generatedById: l.generatedById ?? 0,
        confirmedAt: l.confirmedAt ?? null
      } as ResponseInvestmentDTO));
      console.log('[GestionProyectos] investments loaded', this.investments.length);
    });
  }

  private fetchEarnings(projectId: number): void {
    this.adminService.getEarningsByProject(projectId).subscribe(list => {
      this.earnings = (list || []).map((l: ServerResponseEarningDTO) => ({
        idEarning: l.idEarning,
        projectId: l.projectId,
        amount: Number(l.amount ?? 0),
        profitRate: Number(l.profitRate ?? 0),
        currency: l.currency ?? 'USD',
        status: l.status,
        createdAt: l.createdAt ?? '',
        confirmedAt: l.confirmedAt ?? null,
        contractId: l.contractId ?? 0
      } as ResponseEarningDTO));
      console.log('[GestionProyectos] earnings loaded', this.earnings.length);
    });
  }

  // saveProject: acepta Date o ISO string en controles de fecha
  saveProject(): void {
    if (this.form.invalid || !this.form.value.id) {
      this.toast.add({ severity: 'warn', summary: 'Formulario', detail: 'Complete los campos requeridos o el ID es nulo' });
      return;
    }
    const fv = this.form.value;
    const projectId = fv.id;

    const startIso = (typeof fv.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fv.startDate))
      ? fv.startDate
      : this.formatDateToIso(fv.startDate);

    const estimatedIso = (typeof fv.estimatedEndDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fv.estimatedEndDate))
      ? fv.estimatedEndDate
      : this.formatDateToIso(fv.estimatedEndDate);

    const endIso = (typeof fv.endDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fv.endDate))
      ? fv.endDate
      : this.formatDateToIso(fv.endDate);

    const payload: RequestAdminProjectUpdateDTO = {
      name: fv.name,
      description: fv.description,
      budgetGoal: fv.budgetGoal,
      status: fv.status,
      startDate: startIso,
      estimatedEndDate: estimatedIso,
      endDate: endIso,
      deleted: !!fv.deleted
    };

    this.adminService.updateProject(projectId, payload).subscribe({
      next: () => {
        this.toast.add({ severity: 'success', summary: 'Proyecto', detail: 'Proyecto guardado correctamente' });
      },
      error: (err) => {
        console.error('Error al guardar proyecto:', err);
        this.toast.add({ severity: 'error', summary: 'Proyecto', detail: 'Error al guardar el proyecto' });
      }
    });
  }

  openEditContract(c: ResponseContractDTO): void {
    this.editingContract = { ...c };
    this.showContractModal = true;
  }

  saveContract(): void {
    if (!this.editingContract) return;

    const payload: RequestAdminContractUpdateDTO = {
      status: this.editingContract.status,
    } as RequestAdminContractUpdateDTO;

    this.adminService.updateContract(this.editingContract.idContract, payload).subscribe({
      next: () => {
        const idx = this.contracts.findIndex(x => x.idContract === this.editingContract!.idContract);
        if (idx >= 0) this.contracts[idx] = { ...this.editingContract! };
        this.showContractModal = false;
        this.toast.add({ severity: 'success', summary: 'Contrato', detail: 'Contrato guardado correctamente' });
      },
      error: (err) => {
        console.error('Error al guardar contrato:', err);
        this.toast.add({ severity: 'error', summary: 'Contrato', detail: 'Error al guardar el contrato' });
      }
    });
  }

  openEditInvestment(i: ResponseInvestmentDTO): void {
    this.editingInvestment = { ...i };
    this.showInvestmentModal = true;
  }

  saveInvestment(): void {
    if (!this.editingInvestment) return;
    const investmentId = this.editingInvestment.idInvestment;
    const status = this.editingInvestment.status;

    this.adminService.updateInvestmentStatus(investmentId, status).subscribe({
      next: () => {
        const idx = this.investments.findIndex(x => x.idInvestment === investmentId);
        if (idx >= 0) this.investments[idx] = { ...this.editingInvestment! };
        this.showInvestmentModal = false;
        this.toast.add({ severity: 'success', summary: 'Inversión', detail: 'Estado de inversión guardado correctamente' });
      },
      error: (err) => {
        console.error('Error al guardar estado de inversión:', err);
        this.toast.add({ severity: 'error', summary: 'Inversión', detail: 'Error al guardar el estado de inversión' });
      }
    });
  }

  openEditEarning(e: ResponseEarningDTO): void {
    this.editingEarning = { ...e };
    this.showEarningModal = true;
  }

  saveEarning(): void {
    if (!this.editingEarning) return;
    const earningId = this.editingEarning.idEarning;
    const status = this.editingEarning.status;

    this.adminService.updateEarningStatus(earningId, status).subscribe({
      next: () => {
        const idx = this.earnings.findIndex(x => x.idEarning === earningId);
        if (idx >= 0) this.earnings[idx] = { ...this.editingEarning! };
        this.showEarningModal = false;
        this.toast.add({ severity: 'success', summary: 'Ganancia', detail: 'Estado de ganancia actualizado correctamente' });
      },
      error: (err) => {
        console.error('Error al guardar estado de ganancia:', err);
        this.toast.add({ severity: 'error', summary: 'Ganancia', detail: 'Error al actualizar el estado de ganancia' });
      }
    });
  }

  goBack(): void {
    window.history.back();
  }

  refreshProjectData(): void {
    const projectId = this.form.value.id;
    if (!projectId) {
      this.toast.add({ severity: 'warn', summary: 'Recarga', detail: 'ID de proyecto no disponible para recargar.' });
      return;
    }

    this.toast.add({ severity: 'info', summary: 'Recarga', detail: 'Recargando datos del proyecto...' });

    this.projectsSvc.getById(projectId).subscribe({
      next: (p) => {
        if (p) {
          this.patchProjectData(p as IProject);
          this.loadRelatedResources(projectId);
          this.toast.add({ severity: 'success', summary: 'Recarga', detail: 'Datos del proyecto actualizados.' });
        } else {
          this.toast.add({ severity: 'error', summary: 'Recarga', detail: 'No se pudo encontrar el proyecto.' });
        }
      },
      error: (err) => {
        console.error('[GestionProyectos] Error recargando proyecto por id', err);
        this.toast.add({ severity: 'error', summary: 'Recarga', detail: 'Error al recargar los datos del proyecto.' });
      }
    });
  }
}