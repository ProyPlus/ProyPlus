import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ChartModule } from 'primeng/chart';
import type { ChartData, ChartOptions } from 'chart.js';

import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { UsersService, IUser } from '../../core/services/users.service';
import { StudentService } from '../../core/services/students.service';
import { InvestorService } from '../../core/services/investors.service';
import { ProjectsService, IProject } from '../../core/services/projects.service';

type AnyObj = Record<string, any>;

@Component({
  standalone: true,
  selector: 'app-panel',
  imports: [CommonModule, CardModule, ButtonModule, TagModule, TooltipModule, ToastModule, ChartModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  providers: [MessageService]
})
export class PanelComponent implements OnInit {
  private usersSvc = inject(UsersService);
  private studentsSvc = inject(StudentService);
  private investorsSvc = inject(InvestorService);
  private projectsSvc = inject(ProjectsService);   // 👈 Proyectos (línea de tiempo)
  private toast = inject(MessageService);

  loading = false;

  // 🔹 Activamos las gráficas
  chartsEnabled = true;

  // KPI cards
  kpis = {
    totalUsers: 0,
    totalStudents: 0,
    totalInvestors: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    activeInvestors: 0,
    inactiveInvestors: 0
  };

  users: IUser[] = [];
  students: AnyObj[] = [];
  investors: AnyObj[] = [];

  // ===== Proyectos & Timeline =====
  projects: IProject[] = [];
  projectsTimelineData!: ChartData<'line'>;
  projectsLineOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    elements: { line: { tension: 0.3 } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }
    }
  };

  // ===== Data de otros charts =====
  studentsByDegreeData!: ChartData<'doughnut'>;
  usersByRoleData!: ChartData<'bar'>;
  universitiesData!: ChartData<'bar'>;

  // Opciones comunes
  chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: {
      x: { grid: { display: false }, ticks: { autoSkip: true, maxRotation: 0 } },
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }
    }
  };

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;

    forkJoin({
      users: this.usersSvc.getAll().pipe(catchError(() => of([] as IUser[]))),
      students: this.studentsSvc.loadAll().pipe(catchError(() => of([] as AnyObj[]))),
      investors: this.investorsSvc.loadAll().pipe(catchError(() => of([] as AnyObj[]))),
      projects: this.projectsSvc.getAll().pipe(catchError(() => of([] as IProject[]))) // 👈 sumamos proyectos
    }).subscribe({
      next: ({ users, students, investors, projects }) => {
        this.users = users || [];
        this.students = students || [];
        this.investors = investors || [];
        this.projects = projects || [];

        // KPIs
        const activeStudents = this.students.filter(s => s?.enabled).length;
        const activeInvestors = this.investors.filter(i => i?.enabled).length;

        this.kpis = {
          totalUsers: this.users.length,
          totalStudents: this.students.length,
          totalInvestors: this.investors.length,
          activeStudents,
          inactiveStudents: this.students.length - activeStudents,
          activeInvestors,
          inactiveInvestors: this.investors.length - activeInvestors
        };

        // Charts
        if (this.chartsEnabled) {
          this.buildStudentsByDegreeChart();
          this.buildUsersByRoleChart();
          this.buildUniversitiesChart();
          this.buildProjectsTimeline(); // 👈 timeline de proyectos
        }
      },
      error: (err) => {
        console.error(err);
        this.toast.add({ severity: 'error', summary: 'Panel', detail: 'No se pudieron cargar los datos' });
      },
      complete: () => (this.loading = false)
    });
  }

  // ===== Helpers de colores =====
  private palette(idx: number) {
    const colors = [
      '#3b82f6', // blue-500
      '#22c55e', // green-500
      '#f59e0b', // amber-500
      '#ef4444', // red-500
      '#a855f7', // purple-500
      '#06b6d4', // cyan-500
      '#14b8a6', // teal-500
      '#f97316', // orange-500
    ];
    return colors[idx % colors.length];
  }
  private seriesColors(n: number) {
    return Array.from({ length: n }, (_, i) => this.palette(i));
  }

  // ====== Charts builders ======
  private buildStudentsByDegreeChart() {
    const order = ['IN_PROGRESS', 'COMPLETED', 'PAUSED', 'DROPPED', 'UNKNOWN'];
    const counts: Record<string, number> = {};

    for (const s of this.students) {
      const k = (s?.degreeStatus ?? 'UNKNOWN') as string;
      counts[k] = (counts[k] ?? 0) + 1;
    }

    const labels = Object.keys(counts).sort((a, b) => order.indexOf(a) - order.indexOf(b));
    const data = labels.map(l => counts[l]);

    this.studentsByDegreeData = {
      labels,
      datasets: [
        {
          data,
          backgroundColor: this.seriesColors(labels.length),
          borderWidth: 0
        }
      ]
    };
  }

  private buildUsersByRoleChart() {
    const counts: Record<string, number> = {};
    for (const u of this.users as any[]) {
      const roles = u?.rolesList ?? u?.roles ?? [];
      (roles as any[]).forEach(r => {
        const name = r?.role ?? '—';
        counts[name] = (counts[name] ?? 0) + 1;
      });
    }
    const labels = Object.keys(counts).sort();
    const data = labels.map(l => counts[l]);

    this.usersByRoleData = {
      labels,
      datasets: [
        {
          label: 'Usuarios',
          data,
          backgroundColor: this.seriesColors(labels.length)
        }
      ]
    };
  }

  private buildUniversitiesChart() {
    const uniCounts: Record<string, number> = {};
    for (const s of this.students) {
      const uni = s?.university ?? '—';
      uniCounts[uni] = (uniCounts[uni] ?? 0) + 1;
    }
    const labels = Object.keys(uniCounts).sort();
    const data = labels.map(l => uniCounts[l]);

    this.universitiesData = {
      labels,
      datasets: [
        {
          label: 'Estudiantes',
          data,
          backgroundColor: this.seriesColors(labels.length)
        }
      ]
    };
  }

  // ====== Línea de tiempo de proyectos (últimos 12 meses) ======
  private buildProjectsTimeline(): void {
    const now = new Date();
    const labels: string[] = [];
    const keys: string[] = [];

    const ymKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    // Ventana de 12 meses (incluye el actual)
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }));
      keys.push(ymKey(d));
    }

    const counts: Record<string, number> = Object.fromEntries(keys.map(k => [k, 0])) as Record<string, number>;

    // Usamos p.lastUpdated (mappeado desde startDate en ProjectsService). Fallback: startDate si existiera.
    const getIso = (p: IProject | any): string | null => p?.lastUpdated ?? p?.startDate ?? null;

    for (const p of this.projects) {
      const iso = getIso(p);
      if (!iso) continue;
      const d = new Date(iso);
      if (isNaN(+d)) continue;
      const k = ymKey(new Date(d.getFullYear(), d.getMonth(), 1));
      if (k in counts) counts[k] += 1;
    }

    const data = keys.map(k => counts[k] ?? 0);

    this.projectsTimelineData = {
      labels,
      datasets: [
        {
          label: 'Proyectos actualizados',
          data,
          fill: false,
          borderColor: '#3b82f6',
          pointBackgroundColor: '#3b82f6'
        }
      ]
    };
  }
}
