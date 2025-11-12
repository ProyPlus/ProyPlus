import { Component, OnInit, inject, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { IMyProject, MyProjectsService } from '../../../core/services/my-projects.service';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-my-projects-panel',
  imports: [
    CommonModule, FormsModule, RouterLink,
    CardModule, ToolbarModule, ButtonModule, InputTextModule,
    TagModule, TableModule, DialogModule, DividerModule, TooltipModule, ToastModule
  ],
  templateUrl: './my-projects-panel.component.html',
  styleUrls: ['./my-projects-panel.component.scss'],
  providers: [MessageService],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [style({ opacity: 0 }), animate('300ms ease-out', style({ opacity: 1 }))]),
      transition(':leave', [animate('300ms ease-in', style({ opacity: 0 }))]),
    ]),
  ]
})
export class MyProjectsPanelComponent implements OnInit {
  private svc = inject(MyProjectsService);
  private toast = inject(MessageService);
  private router = inject(Router);

  /** Incluir también proyectos donde soy asignado (miembro/estudiante) */
  @Input() includeAssigned = true;

  // filtros
  q = '';

  // datos
  projects: IMyProject[] = [];
  filtered: IMyProject[] = [];
  recommended: IMyProject[] = [];

  // vista
  viewMode: 'cards' | 'table' = 'cards';

  // detalle (ya no se usa el diálogo; mantenemos por compatibilidad UI si tenés botones que lo abren)
  showDetail = false;
  selected: IMyProject | null = null;

  // loading
  loading = signal(true);

  // KPIs
  kpis = { total: 0, activos: 0, recientes: 0, conFinanciacion: 0 };

  // Señal para mostrar el estado vacío después de cargar
  showEmptyState = computed(() => !this.loading() && this.projects.length === 0);

  // Favoritos (localStorage)
  private favKey = 'pp_fav_my_projects';
  favIds = new Set<number>();

  ngOnInit(): void {
    this.restoreFavs();
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.svc.getMine().subscribe({
      next: (list) => {
        this.projects = (list || []).map(p => ({
          ...p,
          category: p.category ?? '—', // Si no viene categoría, se pone '—'
          status: p.status ?? 'IN_PROGRESS'
        }));
        this.applyFilters();
        this.computeKpis();
        this.buildRecommended();
      },
      error: (err: any) => {
        // Si el backend devuelve 404, significa que no tiene proyectos.
        // Lo tratamos como un caso de éxito con una lista vacía.
        if (err.status === 404) {
          this.projects = [];
          this.applyFilters();
          this.computeKpis();
        } else {
          console.error(err);
          this.toast.add({ severity: 'error', summary: 'Mis Proyectos', detail: 'No se pudieron cargar' });
        }
      },
      complete: () => {
        this.loading.set(false); // Asegurarse de detener el spinner siempre
      }
    });
  }

  applyFilters(): void {
    const q = (this.q || '').toLowerCase().trim();

    this.filtered = this.projects.filter(p => {
      const matchesQ =
        !q ||
        p.title?.toLowerCase().includes(q) ||
        p.summary?.toLowerCase().includes(q) ||
        p.university?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q);
      return matchesQ;
    });
  }

  computeKpis(): void {
    const now = Date.now(), recentMs = 30*24*60*60*1000;
    this.kpis.total = this.projects.length;
    this.kpis.activos = this.projects.filter(p => (p.status||'') !== 'COMPLETED').length;
    this.kpis.recientes = this.projects.filter(p => {
      const t = p.lastUpdated ? Date.parse(p.lastUpdated) : 0;
      return t && (now - t) <= recentMs;
    }).length;
    this.kpis.conFinanciacion = this.projects.filter(p => p.fundingGoal != null).length;
  }

  buildRecommended(): void {
    const base = this.filtered.length ? this.filtered : this.projects;
    const scored = base.map(p => {
      let s = 0;
      if ((p.status||'') !== 'COMPLETED') s += 2;
      if (p.lastUpdated) {
        const days = (Date.now() - Date.parse(p.lastUpdated)) / (1000*60*60*24);
        if (!Number.isNaN(days)) s += Math.max(0, 10 - Math.min(10, Math.floor(days/7)));
      }
      if (p.fundingGoal != null) s += 3;
      if (p.fundingRaised != null) s += 2;
      return { p, s };
    });

    this.recommended = scored.sort((a,b)=>b.s-a.s).slice(0,6).map(x=>x.p);
  }

  // ===== Favoritos =====
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
  toggleFav(p: IMyProject): void {
    if (!p?.id) return;
    this.favIds.has(p.id) ? this.favIds.delete(p.id) : this.favIds.add(p.id);
    this.persistFavs();
  }

  // ===== Navegar al detalle maestro =====
  openDetail(p: IMyProject) {
    if (!p?.id) return;
    this.router.navigate(['/proyectos-maestro', p.id]);
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

  getCategoryLabel(category: string | null | undefined): string {
    return !category || category === '—' ? 'Sin categoría' : category;
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
