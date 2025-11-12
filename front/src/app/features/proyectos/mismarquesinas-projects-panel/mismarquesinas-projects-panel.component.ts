import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { ProjectsService, IProject } from '../../../core/services/projects.service';

@Component({
  selector: 'app-mismarquesinas-projects-panel',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    CardModule, ToolbarModule, ButtonModule, InputTextModule,
    TagModule, TableModule, DividerModule, TooltipModule, ToastModule
  ],
  templateUrl: './mismarquesinas-projects-panel.component.html',
  styleUrls: ['./mismarquesinas-projects-panel.component.scss'],
  providers: [MessageService]
})
export class MismarquesinasProjectsPanelComponent implements OnInit {
  private svc = inject(ProjectsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(MessageService);


  q = '';
  selectedCategory = '';
  categories: string[] = [];
  viewMode: 'cards' | 'table' = 'cards';


  projects: IProject[] = [];
  filtered: IProject[] = [];
  loading = false;
  displayTag = '';

reload(): void {
  if (this.loading) return;
  const currentTag = this.normalizeRemoveAccents(this.displayTag.replace(/ /g, ' ')).toUpperCase();
  this.loadByTag(currentTag);
}
  private readonly tagPalette: Array<{bg: string; fg: string}> = [
    { bg: '#22c55e', fg: '#ffffff' },
    { bg: '#3b82f6', fg: '#ffffff' },
    { bg: '#f59e0b', fg: '#111111' },
    { bg: '#ef4444', fg: '#ffffff' },
    { bg: '#a855f7', fg: '#ffffff' },
    { bg: '#14b8a6', fg: '#ffffff' },
    { bg: '#06b6d4', fg: '#111111' },
  ];
  private hashKey(name: string): number { let h=0; for (let i=0;i<(name||'').length;i++) h=(h*31+name.charCodeAt(i))>>>0; return h; }
  tagStyle(text: string, index: number) {
    const key = text ?? String(index);
    const c = this.tagPalette[this.hashKey(key) % this.tagPalette.length];
    return { 'background-color': c.bg, color: c.fg, 'border-color': 'transparent', 'border-radius': '8px', 'font-weight': 700, 'padding': '0 .5rem' };
  }

  private normalizeRemoveAccents(s: string): string {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(pm => {
      const raw = pm.get('tag') || '';
      const slug = decodeURIComponent(raw);          
      const spaced = slug.replace(/-/g, ' ');          
      this.displayTag = spaced.split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

     
      const backendTag = this.normalizeRemoveAccents(spaced).toUpperCase();

      this.loadByTag(backendTag);
    });
  }

  private normalizeTag(tag: string): string {
    return (tag || '').normalize?.('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  private loadByTag(tag: string): void {
    this.loading = true;
    this.svc.getAllByTag(tag).subscribe({
      next: (list) => {
        // FIX: Se elimina el mapeo redundante. El servicio ya adapta los datos.
        this.projects = list || [];
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error fetching projects by tag', err);
        this.toast.add({ severity: 'error', summary: 'Proyectos', detail: 'No se pudieron cargar los proyectos' });
        this.projects = [];
        this.filtered = [];
      },
      complete: () => { this.loading = false; this.buildCategories(); }
    });
  }

  applyFilters(): void {
    const q = (this.q || '').toLowerCase().trim();
    const cat = (this.selectedCategory || '').toLowerCase();
    this.filtered = this.projects.filter(p => {
      const matchesQ = !q || (p.title || '').toLowerCase().includes(q) || (p.summary || '').toLowerCase().includes(q);
      const matchesCat = !cat || (p.category || '').toLowerCase() === cat;
      return matchesQ && matchesCat;
    });
  }

  private buildCategories(): void {
    const set = new Set<string>(this.projects.map(p => p.category ?? '—'));
    this.categories = Array.from(set).sort((a,b)=>a.localeCompare(b));
  }

  getProjectStatusLabel(status: string | null | undefined): string {
    switch (status) {
      case 'PENDING_FUNDING': return 'Pendiente de Financiación';
      case 'IN_PROGRESS': return 'En Progreso';
      case 'COMPLETED': return 'Completado';
      case 'CANCELLED': return 'Cancelado';
      case 'IDEA': return 'Idea';
      case 'MVP': return 'MVP';
      case 'FUNDING': return 'En Financiación';
      case 'NOT_FUNDED': return 'No Financiado';
      case 'DELETED': return 'Eliminado';
      default: return status || 'No definido';
    }
  }

  getCategoryLabel(category: string | null | undefined): string {
    return !category || category === '—' ? 'Sin categoría' : category;
  }

  openDetail(p: IProject): void {
    if (!p?.id) return;
    this.router.navigate(['/proyectos-maestro', p.id]);
  }

  goBack(): void {
    this.router.navigate(['/marquesinas']);
  }
}