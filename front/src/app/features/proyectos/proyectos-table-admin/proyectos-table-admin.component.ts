import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

import { ProjectsService, IProject } from '../../../core/services/projects.service';

@Component({
  selector: 'app-proyectos-table-admin',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    CardModule, ToolbarModule, ButtonModule, InputTextModule,
    TableModule, TagModule, ToastModule, DialogModule, DividerModule, TooltipModule
  ],
  templateUrl: './proyectos-table-admin.component.html',
  styleUrls: ['./proyectos-table-admin.component.scss'],
  providers: [MessageService]
})
export class ProyectosTableAdminComponent implements OnInit {
  private svc = inject(ProjectsService);
  private router = inject(Router);
  private toast = inject(MessageService);

  loading = false;
  allProjects: IProject[] = [];
  filteredProjects: IProject[] = [];

  q = '';
  statusFilter = '';
  categories: string[] = [];

  showDetail = false;
  selected: IProject | null = null;

  ngOnInit(): void {
    this.reload();
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

  private hashKey(name: string): number {
    let h=0; 
    for (let i=0;i<(name||'').length;i++) h=(h*31+name.charCodeAt(i))>>>0; 
    return h;
  }

  tagStyle(text: string, index: number = 0): { [key: string]: string } {
    const key = text ?? String(index);
    const c = this.tagPalette[this.hashKey(key) % this.tagPalette.length]; 
    
    return { 
      'background-color': c.bg, 
      color: c.fg,
    };
  }

  reload(): void {
    this.loading = true;
    console.log('[ProyectosTableAdmin] -> cargar proyectos (getAll)');
    this.svc.getAllAdmin().subscribe({
      next: (list: IProject[]) => {
        console.log('[ProyectosTableAdmin] servicio devolvió', list?.length ?? 0, 'proyectos');
        
        this.allProjects = list || [];
        
        if (this.allProjects.length) console.log('[ProyectosTableAdmin] ejemplo mapeado', this.allProjects[0]);
        this.filteredProjects = [...this.allProjects];
        this.buildCategories();
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading projects', err);
        this.toast.add({ severity: 'error', summary: 'Proyectos', detail: 'No se pudieron cargar los proyectos' });
        this.allProjects = [];
        this.filteredProjects = [];
        this.loading = false;
      }
    });
  }

  applyFilter(): void {
    const q = (this.q || '').toLowerCase().trim();
    const st = (this.statusFilter || '').toLowerCase();
    this.filteredProjects = this.allProjects.filter(p => {
      const matchesQ = !q || (p.title || '').toLowerCase().includes(q) || (p.summary || '').toLowerCase().includes(q);
      const matchesStatus = !st || (p.status || '').toLowerCase() === st;
      return matchesQ && matchesStatus;
    });
  }

  private buildCategories(): void {
    const set = new Set<string>((this.allProjects || []).map(p => p.category ?? '—'));
    this.categories = Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  onView(row: IProject): void {
    this.selected = row;
    this.showDetail = true;
  }

  goToProject(row: IProject): void {
    if (!row?.id) return;
        this.router.navigate(['/proyectos-gestion-form', row.id], {
        state: {
        project: row 
        }
    });
  }

  onDialogHide(): void { this.showDetail = false; this.selected = null; }

  formatFunding(p: IProject): string {
    const goal = Number(p.fundingGoal ?? 0);
    const raised = Number(p.fundingRaised ?? 0);
    // Mostrar vacío si ambos nulos
    if (!goal && !raised) return '—';
    return `${raised.toLocaleString()} / ${goal.toLocaleString()}`;
  }
}