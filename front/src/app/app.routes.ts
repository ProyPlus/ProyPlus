import { Routes } from '@angular/router';
import { authGuard } from './features/auth/login/auth.guard';

// 👉 usar los guards centralizados en /features/auth/guards
import { studentGuard, studentMatch } from './features/auth/guards/student.guard';
import { investorGuard, investorMatch } from './features/auth/guards/investor.guard';
import { roleGuard } from './features/auth/login/role.guard';
import { studentOnlyGuard } from './features/auth/guards/student-only.guard'; // ⬅️ NUEVO

export const routes: Routes = [
  { path: 'index', loadComponent: () => import('./features/landing-page/landing.component').then(m => m.LandingComponent) },
  { path: 'auth/login',    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'auth/forgot',   loadComponent: () => import('./features/auth/forgot/forgot.component').then(m => m.ForgotComponent) },
  { path: 'auth/register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
  { path: 'create-student',  loadComponent: () => import('./features/students/students-form/students-form.component').then(m => m.StudentFormComponent) },
  { path: 'create-investor', loadComponent: () => import('./features/investors/investors-form/investors-form.component').then(m => m.InvestorFormComponent) },
  { path: 'auth/reset-password', loadComponent: () => import('./features/auth/reset/reset-password.component').then(c => c.ResetPasswordComponent) },

  {
    path: '', // Las rutas hijas ahora están en el nivel raíz, pero protegidas por el guard
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'marquesinas' },
      { path: 'dashboard', canActivate: [roleGuard('ROLE_ADMIN')], loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.PanelComponent) },
      { path: 'proyectos-panel',  loadComponent: () => import('./features/proyectos/projects-panel/projects-panel.component').then(m => m.ProjectsPanelComponent) },
      { path: 'roles',            loadComponent: () => import('./features/roles/roles.component').then(m => m.RolesComponent) },
      //{ path: 'configuracion',    loadComponent: () => import('./features/config/configuracion.component').then(m => m.ConfiguracionComponent) },
      { path: 'estudiante-perfil', canActivate: [authGuard, roleGuard('ROLE_STUDENT')], loadComponent: () => import('./features/students/students-update-form/students-update-form.component').then(m => m.StudentsUpdateComponent)},
      { path: 'inversor-perfil',canActivate: [authGuard, roleGuard('ROLE_INVESTOR')],loadComponent: () => import('./features/investors/investors-update-form/investors-update-form.component').then(m => m.InvestorsUpdateFormComponent)},
      { path: 'proyectos',        loadComponent: () => import('./features/proyectos/crear-proyectos.component').then(m => m.ProyectosComponent) },
      { path: 'marquesinas',   loadComponent: () => import('./features/mismarquesinas/mismarquesinas.component').then(m => m.MismarquesinasComponent) },
      { path: 'noticias',         loadComponent: () => import('./features/noticias/noticias.component').then(m => m.NoticiasComponent) },
      { path: 'estudiantes',      loadComponent: () => import('./features/students/students-table/students-table.component').then(m => m.StudentsTableComponent) },
      { path: 'inversores',       loadComponent: () => import('./features/investors/investors-table/investors-table.component').then(m => m.InvestorsTableComponent) },
      { path: 'Miperfil',         redirectTo: 'mi-perfil', pathMatch: 'full' },
      { path: 'mi-perfil',        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'marquesinas/tag/:tag',        loadComponent: () => import('./features/proyectos/mismarquesinas-projects-panel/mismarquesinas-projects-panel.component').then(m => m.MismarquesinasProjectsPanelComponent) },
      { path: 'mis-proyectos-invertidos',        loadComponent: () => import('./features/proyectos/proyectos-invertidos/proyectos-invertidos.component').then(m => m.ProyectosInvertidosComponent) },
      { path: 'proyectos-gestion',        loadComponent: () => import('./features/proyectos/proyectos-table-admin/proyectos-table-admin.component').then(m => m.ProyectosTableAdminComponent) },
      { path: 'proyectos-gestion-form/:id',        loadComponent: () => import('./features/gestion-proyectos-form/gestion-proyectos-form.component').then(m => m.GestionProyectosFormComponent) },

      // ✅ NUEVA RUTA PARA EL ANÁLISIS DE RIESGO
      {
        path: 'analysis/risk/:projectId',
        loadComponent: () => import('./features/analysis/risk-analysis.component').then(m => m.RiskAnalysisComponent)
      },

      // SOLO estudiantes
      {
        path: 'misproyectos', // CORREGIDO: Coincide con el routerLink del menú
        canMatch: [studentMatch],
        canActivate: [studentGuard],
        loadComponent: () =>
          import('./features/proyectos/my-projects-panel/my-projects-panel.component')
            .then(m => m.MyProjectsPanelComponent)
      },

      // NUEVO: Proyectos donde participo (no owner)
      {
        path: 'proyectos-participo',
        canMatch: [studentMatch],
        canActivate: [studentGuard, studentOnlyGuard],
        loadComponent: () =>
          import('./features/proyectos/participant-projects-panel/participant-projects-panel.component')
            .then(m => m.ParticipantProjectsPanelComponent)
      },

      { path: 'legales', loadComponent: () => import('./features/contrato/contract.component').then(m => m.ContratosComponent) },

      // SOLO inversores
      {
        path: 'mis-inversiones',
        canMatch: [investorMatch],
        canActivate: [investorGuard],
        loadComponent: () =>
          import('./features/investors/my-investments-panel/my-investments-panel.component')
            .then(m => m.MyInvestmentsPanelComponent)
      },

      // NUEVO: Detalle de una inversión específica
      {
        path: 'mis-inversiones/:investmentId',
        canMatch: [investorMatch],
        canActivate: [investorGuard],
        loadComponent: () => import('./features/investors/my-investments-panel/investment-detail.component').then(m => m.InvestmentDetailComponent)
      },

      // Detalle maestro del proyecto
      {
        path: 'proyectos-maestro/:id',
        loadComponent: () =>
          import('./features/proyectos/proyectos-maestro/proyectos-maestro.component')
            .then(m => m.ProyectosMaestroComponent)
      },
    ],
  },

  { path: '**', redirectTo: 'index' }, // Redirige a la landing page si la ruta no existe
];
