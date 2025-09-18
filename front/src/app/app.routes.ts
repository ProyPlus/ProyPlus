import { Routes } from '@angular/router';
import { authGuard } from './features/auth/login/auth.guard';

export const routes: Routes = [
  { path: 'auth/login',    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'auth/forgot',   loadComponent: () => import('./features/auth/forgot/forgot.component').then(m => m.ForgotComponent) },
  { path: 'auth/register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },

  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      { path: 'home',        loadComponent: () => import('./features/panel/panel.component').then(m => m.PanelComponent) },
      { path: 'usuarios',    loadComponent: () => import('./features/usuarios/usuarios.component').then(m => m.UsuariosComponent) },
      { path: 'roles',       loadComponent: () => import('./features/roles/roles.component').then(m => m.RolesComponent) },
      { path: 'configuracion', loadComponent: () => import('./features/config/configuracion.component').then(m => m.ConfiguracionComponent) },
    ],
  },

  { path: '**', redirectTo: 'auth/login' },
];
