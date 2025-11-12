import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';

import { InvestedProjectsService, IInvestedProject } from '../../../core/services/my-invested-projects.service';

@Component({
  selector: 'app-proyectos-invertidos',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    CardModule, ToolbarModule, ButtonModule, InputTextModule,
    TagModule, TableModule, DividerModule, TooltipModule, ToastModule,
    DialogModule
  ],
  templateUrl: './proyectos-invertidos.component.html',
  styleUrls: ['./proyectos-invertidos.component.scss'],
  providers: [MessageService]
})
export class ProyectosInvertidosComponent implements OnInit {
  private svc = inject(InvestedProjectsService);
  private router = inject(Router);
  private toast = inject(MessageService);

  // filtros / UI
  q = '';
  viewMode: 'cards' | 'table' = 'cards';

  // datos
  projects: IInvestedProject[] = [];
  filtered: IInvestedProject[] = [];

  // estado
  loading = false;
  displayLabel = '';

  // dialog / selección
  showDetail = false;
  selected: IInvestedProject | null = null;

  // KPIs
  kpis = {
    total: 0,
    activos: 0,
    recientes: 0,
    conFinanciacion: 0
  };

  // favoritos (local)
  private readonly favKey = 'pp_fav_invested_projects';
  favIds = new Set<number>();

  // colores para tags
  private readonly tagPalette = [
    { bg: '#22c55e', fg: '#ffffff' },
    { bg: '#3b82f6', fg: '#ffffff' },
    { bg: '#f59e0b', fg: '#111111' },
    { bg: '#ef4444', fg: '#ffffff' },
    { bg: '#a855f7', fg: '#ffffff' },
    { bg: '#14b8a6', fg: '#ffffff' },
    { bg: '#06b6d4', fg: '#111111' },
  ];
  private hashKey(name: string): number { let h = 0; for (let i = 0; i < (name || '').length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0; return h; }
  tagStyle(text: string, index: number) {
    const key = text ?? String(index);
    const c = this.tagPalette[this.hashKey(key) % this.tagPalette.length];
    return { 'background-color': c.bg, color: c.fg, 'border-color': 'transparent', 'border-radius': '8px', 'font-weight': 700, 'padding': '0 .5rem' };
  }

ngOnInit(): void {
    this.restoreFavs();
    this.loadByInvestment();
  }

  // favoritos localStorage
  private restoreFavs(): void {
    try {
      const raw = localStorage.getItem(this.favKey);
      this.favIds = new Set(raw ? (JSON.parse(raw) as number[]) : []);
    } catch {
      this.favIds = new Set<number>();
    }
  }

  private persistFavs(): void {
    localStorage.setItem(this.favKey, JSON.stringify(Array.from(this.favIds)));
  }

  isFav(id: number): boolean { return this.favIds.has(id); }

  toggleFav(p: IInvestedProject): void {
    if (!p?.id) return;
    this.favIds.has(p.id) ? this.favIds.delete(p.id) : this.favIds.add(p.id);
    this.persistFavs();
  }

  // recargar datos
  reload(): void {
    this.loadByInvestment();
  }

  // abrir modal detalle
  openDetail(p: IInvestedProject): void {
    if (!p?.id) return;
    this.router.navigate(['/proyectos-maestro', p.id]);
  }

  goBack(): void {
    this.router.navigate(['/marquesinas']);
  }

  // carga desde el servicio
  private loadByInvestment(): void {
    this.loading = true;
    this.svc.getByInvestment().subscribe({
      next: (list) => {
        this.projects = (list || []).map(p => ({ ...p, category: p.category ?? '—', status: p.status ?? 'IN_PROGRESS' }));
        this.applyFilters();
        this.computeKpis(this.projects);
      },
      error: (err) => {
        console.error('Error fetching invested projects', err);
        this.toast.add({ severity: 'error', summary: 'Proyectos invertidos', detail: 'No se pudieron cargar los proyectos' });
        this.projects = [];
        this.filtered = [];
        this.loading = false;
      },
      complete: () => { this.loading = false; }
    });
  }

  applyFilters(): void {
    const q = (this.q || '').toLowerCase().trim();
    this.filtered = this.projects.filter(p => {
      const matchesQ = !q || (p.title || '').toLowerCase().includes(q) || (p.summary || '').toLowerCase().includes(q);
      return matchesQ;
    });
  }

  private computeKpis(list: IInvestedProject[]): void {
    const now = new Date();
    const days30 = 1000 * 60 * 60 * 24 * 30;
    this.kpis.total = list.length;
    this.kpis.activos = list.filter(p => (p.status || '').toUpperCase().includes('IN_PROGRESS') || (p.status || '').toUpperCase().includes('FUNDING')).length;
    this.kpis.conFinanciacion = list.filter(p => (p.fundingRaised ?? 0) > 0).length;
    this.kpis.recientes = list.filter(p => {
      if (!p.lastUpdated) return false;
      const d = new Date(p.lastUpdated);
      return !isNaN(d.getTime()) && (now.getTime() - d.getTime()) <= days30;
    }).length;
  }

  getProjectStatusLabel(status: string | null | undefined): string {
    switch (status) {
      case 'IN_PROGRESS': return 'En Progreso';
      case 'PENDING_FUNDING': return 'Pendiente de Financiación';
      case 'COMPLETED': return 'Completado';
      case 'CANCELLED': return 'Cancelado';
      case 'IDEA': return 'Idea';
      case 'MVP': return 'MVP';
      case 'FUNDING': return 'En Financiación';
      default: return status || 'No definido';
    }
  }

  getCategoryLabel(category: string | null | undefined): string {
    return !category || category === '—' ? 'Sin categoría' : category;
  }
}