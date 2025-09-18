import { Component, ViewChild, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

import { PanelMenu } from 'primeng/panelmenu';
import { Menu } from 'primeng/menu';
import { Button } from 'primeng/button';
import { Avatar } from 'primeng/avatar';

import { AuthService } from '../features/auth/login/auth.service';

@Component({
  selector: 'app-shell', // 👈 evita 'app-root' para no chocar con el root
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    PanelMenu,
    Menu,
    Button,
    Avatar,
    
  ],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss']
})
export class ShellComponent {
  sidebarCollapsed = false;
 isDark = document.documentElement.classList.contains('app-dark');

toggleDarkMode() {
  this.isDark = !this.isDark;
  document.documentElement.classList.toggle('app-dark', this.isDark);
  localStorage.setItem('theme:dark', String(this.isDark));
}

  private router = inject(Router);
  private auth = inject(AuthService);

  @ViewChild('userMenu') userMenu!: Menu;

  userItems = [
    { label: 'Mi perfil', icon: 'pi pi-user', command: () => this.go('/configuracion') },
    { label: 'Preferencias', icon: 'pi pi-cog', command: () => this.go('/configuracion') },
    { separator: true },
    { label: 'Cerrar sesión', icon: 'pi pi-sign-out', command: () => this.logout() }
  ];

  sideModel = [
    { label: 'Inicio', icon: 'pi pi-home', routerLink: '/home' },
    {
      label: 'Gestión',
      icon: 'pi pi-database',
      items: [
        // submenús aquí
      ]
    },
    {
      label: 'Reportes',
      icon: 'pi pi-chart-line',
      items: [{ label: 'Dashboard', icon: 'pi pi-chart-bar', disabled: true }]
    },
    {
      label: 'Configuración',
      icon: 'pi pi-cog',
      items: [
        { label: 'Usuarios', icon: 'pi pi-users', routerLink: '/usuarios' },
        { label: 'Roles', icon: 'pi pi-id-card', routerLink: '/roles' }
      ]
    }
  ];

  toggleSidebar() { 
    this.isDark = !this.isDark;
    document.documentElement.classList.toggle('app-dark', this.isDark);
    localStorage.setItem('theme:dark', String(this.isDark));
  }
  openUserMenu(event: MouseEvent) { this.userMenu.toggle(event); }
  go(url: string) { this.router.navigateByUrl(url); }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/auth/login', { replaceUrl: true });
  }
}
