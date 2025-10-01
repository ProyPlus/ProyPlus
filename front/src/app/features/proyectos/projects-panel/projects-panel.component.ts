import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

import { ProjectsService, IProject } from '../../../core/services/projects.service';

@Component({
  standalone: true,
  selector: 'app-projects-panel',
  imports: [
    CommonModule, FormsModule,
    CardModule, ToolbarModule, ButtonModule, InputTextModule,
    TagModule, TableModule, DialogModule, DividerModule, TooltipModule, ToastModule
  ],
  templateUrl: './projects-panel.component.html',
  styleUrls: ['./projects-panel.component.scss'],
  providers: [MessageService]
})
export class ProjectsPanelComponent implements OnInit {
  private svc = inject(ProjectsService);
  private toast = inject(MessageService);

  // filtros
  q = '';
  selectedCategory = '';
  categories: string[] = [];

  // datos
  projects: IProject[] = [];
  filtered: IProject[] = [];
  recommended: IProject[] = [];

  // vista
  viewMode: 'cards' | 'table' = 'cards';

  // detalle
  showDetail = false;
  selected: IProject | null = null;

  // loading
  loading = false;

  // KPIs
  kpis = { total: 0, activos: 0, recientes: 0, conFinanciacion: 0 };

  // Favoritos (localStorage)
  private favKey = 'pp_fav_projects';
  favIds = new Set<number>();

  ngOnInit(): void {
    this.restoreFavs();
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.svc.getAll().subscribe({
      next: (list) => {
        this.projects = (list || []).map(p => ({
          ...p,
          category: p.category ?? '—',
          status: p.status ?? 'IN_PROGRESS'
        }));
        this.applyFilters();
        this.computeKpis();
        this.buildRecommended();
      },
      error: (err) => {
        console.error(err);
        this.toast.add({ severity: 'error', summary: 'Proyectos', detail: 'No se pudieron cargar' });
      },
      complete: () => (this.loading = false)
    });
  }

  applyFilters(): void {
    const q = (this.q || '').toLowerCase().trim();
    const cat = (this.selectedCategory || '').toLowerCase();

    this.filtered = this.projects.filter(p => {
      const matchesQ =
        !q ||
        p.title?.toLowerCase().includes(q) ||
        p.summary?.toLowerCase().includes(q) ||
        p.university?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q);
      const matchesCat = !cat || (p.category?.toLowerCase() === cat);
      return matchesQ && matchesCat;
    });

    const set = new Set<string>(this.projects.map(p => p.category ?? '—'));
    this.categories = Array.from(set).sort((a,b)=>a.localeCompare(b));
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
  toggleFav(p: IProject): void {
    if (!p?.id) return;
    this.favIds.has(p.id) ? this.favIds.delete(p.id) : this.favIds.add(p.id);
    this.persistFavs();
  }

  // UI
  openDetail(p: IProject) { this.selected = p; this.showDetail = true; }

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
