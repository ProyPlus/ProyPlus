import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ✅ Angular forms

import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';

import { InvestmentsService, IInvestedProject, IMyProject } from '../../../core/services/investments.service';

@Component({
  standalone: true,
  selector: 'app-my-investments-panel',
 imports: [
  CommonModule, FormsModule,
  CardModule, ToolbarModule, ButtonModule, InputTextModule,
  TagModule, TableModule, TooltipModule, ToastModule
],

  templateUrl: './my-investments-panel.component.html',
  styleUrls: ['./my-investments-panel.component.scss'],
  providers: [MessageService]
})
export class MyInvestmentsPanelComponent implements OnInit {
  private svc = inject(InvestmentsService);
  private toast = inject(MessageService);
  private router = inject(Router);

  // filtros
  q = '';

  // datos
  investments: IInvestedProject[] = [];
  filtered: IInvestedProject[] = [];
  recommended: IMyProject[] = [];

  // vista
  viewMode: 'cards' | 'table' = 'cards';

  // loading
  loading = false;

  // KPIs
  kpis = { total: 0, activos: 0, recientes: 0, conFinanciacion: 0 };

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.svc.getMyInvestedProjects().subscribe({
      next: (list) => {
        this.investments = list || [];
        this.applyFilters();
        this.computeKpis();
        this.buildRecommended();
      },
      error: (err) => {
        console.error(err);
        this.toast.add({ severity: 'error', summary: 'Mis Inversiones', detail: 'No se pudieron cargar' });
      },
      complete: () => (this.loading = false)
    });
  }

  applyFilters(): void {
    const q = (this.q || '').toLowerCase().trim();

    this.filtered = this.investments.filter(inv => {
      const matchesQ =
        !q ||
        inv.project.title?.toLowerCase().includes(q) ||
        inv.project.summary?.toLowerCase().includes(q) ||
        inv.project.university?.toLowerCase().includes(q) ||
        inv.project.category?.toLowerCase().includes(q);
      return matchesQ;
    });
  }

  computeKpis(): void {
    const now = Date.now(), recentMs = 30*24*60*60*1000;
    this.kpis.total = this.investments.length;
    this.kpis.activos = this.investments.filter(inv => (inv.project.status||'') !== 'COMPLETED').length;
    this.kpis.recientes = this.investments.filter(inv => {
      const t = inv.project.lastUpdated ? Date.parse(inv.project.lastUpdated) : 0;
      return t && (now - t) <= recentMs;
    }).length;
    this.kpis.conFinanciacion = this.investments.filter(inv => inv.project.fundingGoal != null).length;
  }

  buildRecommended(): void {
    const base = this.filtered.length ? this.filtered : this.investments;
    const scored = base.map(inv => {
      let s = 0;
      if ((inv.project.status||'') !== 'COMPLETED') s += 2;
      if (inv.project.lastUpdated) {
        const days = (Date.now() - Date.parse(inv.project.lastUpdated)) / (1000*60*60*24);
        if (!Number.isNaN(days)) s += Math.max(0, 10 - Math.min(10, Math.floor(days/7)));
      }
      if (inv.project.fundingGoal != null) s += 3;
      if (inv.project.fundingRaised != null) s += 2;
      return { p: inv.project, s };
    });

    this.recommended = scored.sort((a, b) => b.s - a.s).slice(0, 6).map(x => x.p);
  }

  // navegación al maestro
  openDetail(inv: IInvestedProject) {
    if (!inv?.idInvestment) return;
    this.router.navigate(['/mis-inversiones', inv.idInvestment]);
  }

  getInvestmentStatusLabel(status: string | null): string {
    switch (status) {
      case 'IN_PROGRESS': return 'En Progreso';
      case 'PENDING_CONFIRMATION': return 'Pendiente de Confirmación';
      case 'RECEIVED': return 'Recibida por el Estudiante';
      case 'COMPLETED': return 'Inversión Completada';
      case 'NOT_RECEIVED': return 'No Recibida por el Estudiante';
      case 'CANCELLED': return 'Cancelada';
      case 'PENDING_RETURN': return 'Devolución Pendiente';
      case 'RETURNED': return 'Devolución Completada';
      default: return status || 'Desconocido';
    }
  }

  // tags colores
  private readonly tagPalette: Array<{bg: string; fg: string}> = [
    { bg: '#22c55e', fg: '#ffffff' },
    { bg: '#3b82f6', fg: '#ffffff' },
    { bg: '#f59e0b', fg: '#111111' },
    { bg: '#ef4444', fg: '#ffffff' },
    { bg: '#a855f7', fg: '#ffffff' },
    { bg: '#14b8a6', fg: '#ffffff' },
    { bg: '#06b6d4', fg: '#111111' },
  ];
  private hashKey(name: string): number {
    let h=0; for (let i=0;i<(name||'').length;i++) h=(h*31+name.charCodeAt(i))>>>0; return h;
  }
  tagStyle(text: string, index: number) {
    const key = text ?? String(index);
    const c = this.tagPalette[this.hashKey(key) % this.tagPalette.length];
    return { 'background-color': c.bg, color: c.fg, 'border-color': 'transparent', 'border-radius': '8px', 'font-weight': 700, 'padding': '0 .5rem' };
  }
}
