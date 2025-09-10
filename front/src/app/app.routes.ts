import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/panel/panel.component').then(m => m.PanelComponent),
    pathMatch: 'full',
  },
  {
    path: 'usuarios',
    loadComponent: () =>
      import('./features/usuarios/usuarios.component').then(m => m.UsuariosComponent),
  },
  {
    path: 'configuracion',
    loadComponent: () =>
      import('./features/config/configuracion.component').then(m => m.ConfiguracionComponent),
  },
  {
  path: 'roles',
  loadComponent: () => import('./features/roles/roles.component').then(m => m.RolesComponent)
  },
  { path: '**', redirectTo: '' },
];
