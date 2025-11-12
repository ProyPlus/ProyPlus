import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';

import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ChartModule } from 'primeng/chart';
import { ToastModule } from 'primeng/toast';

import { InvestmentsService, IInvestedProject, IInvestment } from '../../../core/services/investments.service';
import { IEarning } from '../../../core/services/projects-master.service';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html.pipe';

@Component({
  selector: 'app-investment-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, SafeHtmlPipe,
    CardModule, ProgressBarModule, TagModule, ButtonModule, TableModule, TooltipModule, ToastModule, ChartModule
  ],
  templateUrl: './investment-detail.component.html',
  styleUrls: ['./investment-detail.component.scss'],
  providers: [MessageService]
})
export class InvestmentDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private investmentsSvc = inject(InvestmentsService);
  private toast = inject(MessageService);

  investment = signal<IInvestedProject | null>(null);
  loading = signal<boolean>(true);

  // Porcentaje de financiación total (puede superar el 100%)
  fundingPercentage = computed(() => {
    const p = this.investment()?.project;
    if (!p || !p.fundingGoal || p.fundingGoal <= 0 || !p.fundingRaised) {
      return 0;
    }
    return (p.fundingRaised / p.fundingGoal) * 100;
  });

  // Porcentaje para la barra de progreso base (limitado a 100%)
  fundingProgress = computed(() => {
    return Math.min(100, this.fundingPercentage());
  });

  // Porcentaje de sobrefinanciación (lo que excede el 100%)
  overfundingProgress = computed(() => Math.max(0, this.fundingPercentage() - 100));

  projectionChartData = computed(() => {
    const inv = this.investment();
    if (!inv || !inv.amount) return null;

    const projections = [
      { label: 'A 1 Año', rate: inv.profit1Year },
      { label: 'A 2 Años', rate: inv.profit2Years },
      { label: 'A 3 Años', rate: inv.profit3Years },
    ].filter(p => p.rate != null && p.rate > 0);

    if (projections.length === 0) return null;

    const documentStyle = getComputedStyle(document.documentElement);

    return {
      labels: projections.map(p => p.label),
      datasets: [
        {
          label: 'Ganancia Proyectada',
          // CORRECCIÓN: El backend ya devuelve la tasa como una fracción (ej: 0.1 para 10%).
          // No es necesario dividir por 100 de nuevo.
          // El error anterior era `inv.amount * (p.rate! / 100)`, lo que causaba un cálculo incorrecto.
          data: projections.map(p => inv.amount * p.rate!),
          fill: false,
          borderColor: documentStyle.getPropertyValue('--p-primary-500'),
          backgroundColor: documentStyle.getPropertyValue('--p-primary-500'),
          tension: 0.4,
          pointRadius: 5
        }
      ]
    };
  });

  projectionChartOptions = computed(() => {
    const inv = this.investment();
    if (!inv) return {};

    const currency = inv.currency;

    return {
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context: any) => ` ${context.formattedValue} ${currency}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: (value: number) => `${value.toLocaleString()} ${currency}` }
        }
      }
    };
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('investmentId');
    if (id) {
      this.loadInvestment(Number(id));
    } else {
      this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se proporcionó un ID de inversión.' });
      this.loading.set(false);
    }
  }

  private loadInvestment(id: number): void {
    this.loading.set(true);
    this.investmentsSvc.getInvestmentById(id).subscribe({
      next: (data) => {
        if (data) {
          this.investment.set(data);
        } else {
          this.toast.add({ severity: 'warn', summary: 'No encontrado', detail: 'No se pudo encontrar la inversión.' });
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos de la inversión.' });
        console.error(err);
        this.loading.set(false);
      }
    });
  }

  getInvestmentStatusLabel(status: IInvestment['status'] | undefined | null): string {
    switch (status) {
      case 'IN_PROGRESS': return 'En Progreso';
      case 'PENDING_CONFIRMATION': return 'Pendiente de Confirmación';
      case 'RECEIVED': return 'Recibida por el Estudiante';
      case 'COMPLETED': return 'Inversión Completada';
      case 'NOT_RECEIVED': return 'No Recibida por el Estudiante';
      case 'CANCELLED': return 'Cancelada';
      case 'PENDING_RETURN': return 'Devolución Pendiente';
      case 'RETURNED': return 'Devolución Completada';
      default: return 'Desconocido';
    }
  }

  getInvestmentStatusSeverity(status: IInvestment['status'] | undefined | null): string {
    switch (status) {
      case 'IN_PROGRESS': case 'PENDING_CONFIRMATION': return 'info';
      case 'RECEIVED': case 'COMPLETED': case 'RETURNED': return 'success';
      case 'CANCELLED': case 'NOT_RECEIVED': return 'danger';
      case 'PENDING_RETURN': return 'warning';
      default: return 'secondary';
    }
  }

  getEarningStatusLabel(status: IEarning['status'] | null): string {
    switch (status) {
      case 'IN_PROGRESS': return 'Pendiente de Envío por el Estudiante';
      case 'PENDING_CONFIRMATION': return 'Confirmación de Recepción Pendiente';
      case 'RECEIVED': return 'Ganancia Recibida';
      case 'NOT_RECEIVED': return 'Marcado como No Recibido';
      default: return 'Desconocido';
    }
  }

  getEarningStatusSeverity(status: IEarning['status'] | null): string {
    switch (status) {
      case 'IN_PROGRESS': return 'info';
      case 'PENDING_CONFIRMATION': return 'warning';
      case 'RECEIVED': return 'success';
      case 'NOT_RECEIVED': return 'danger';
      default: return 'secondary';
    }
  }

  goBack(): void {
    window.history.back();
  }
}