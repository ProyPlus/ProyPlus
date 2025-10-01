import { Routes } from '@angular/router';
import { authGuard } from './features/auth/login/auth.guard';

export const routes: Routes = [
  { path: 'auth/login',    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'auth/forgot',   loadComponent: () => import('./features/auth/forgot/forgot.component').then(m => m.ForgotComponent) },
  { path: 'auth/register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
  { path: 'create-student', loadComponent: () => import('./features/students/students-form/students-form.component').then(m => m.StudentFormComponent) },
  { path: 'create-investor', loadComponent: () => import('./features/investors/investors-form/investors-form.component').then(m => m.InvestorFormComponent) },


  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard',        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.PanelComponent) },
      { path: 'proyectos-panel', loadComponent: () =>import('./features/proyectos/projects-panel/projects-panel.component').then(m => m.ProjectsPanelComponent) },
      { path: 'usuarios',    loadComponent: () => import('./features/usuarios/usuarios.component').then(m => m.UsuariosComponent) },
      { path: 'roles',       loadComponent: () => import('./features/roles/roles.component').then(m => m.RolesComponent) },
      { path: 'configuracion', loadComponent: () => import('./features/config/configuracion.component').then(m => m.ConfiguracionComponent) },
      { path: 'proyectos', loadComponent: () => import('./features/proyectos/proyectos.component').then(m => m.ProyectosComponent) },
      { path: 'misproyectos', loadComponent: () => import('./features/misproyectos/misproyectos.component').then(m => m.MisProyectosComponent) },
  { path: 'marquesinas', loadComponent: () => import('./features/marquesina/marquesina.component').then(m => m.MarquesinaComponent) },
  { path: 'mismarquesinas', loadComponent: () => import('./features/mismarquesinas/mismarquesinas.component').then(m => m.MismarquesinasComponent) },
  { path: 'noticias', loadComponent: () => import('./features/noticias/noticias.component').then(m => m.NoticiasComponent) },
      { path: 'estudiantes', loadComponent: () => import('./features/students/students-table/students-table.component').then(m => m.EstudiantesComponent) },
      { path: 'inversores', loadComponent: () => import('./features/investors/investors-table/investors-table.component').then(m => m.InvestorsComponent) },
      { path: 'proyectos', loadComponent: () =>import('./features/proyectos/projects-panel/projects-panel.component').then(m => m.ProjectsPanelComponent) },
      { path: 'Miperfil', redirectTo: 'mi-perfil', pathMatch: 'full' }, // alias por si ya lo usás en el menú
      { path: 'mi-perfil', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },

    ],
  },

  { path: '**', redirectTo: 'auth/login' },
];
