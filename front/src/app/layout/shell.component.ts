import { Component, ViewChild, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Menubar } from 'primeng/menubar';
import { PanelMenu } from 'primeng/panelmenu';
import { Menu } from 'primeng/menu';
import { Button } from 'primeng/button';
import { Avatar } from 'primeng/avatar';
import { Badge } from 'primeng/badge';
import { AuthService } from '../features/auth/login/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink, RouterLinkActive,
    Menubar, PanelMenu, Menu, Button, Avatar, Badge,
  ],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss']
})
export class ShellComponent {
  sidebarCollapsed = false;

  private router = inject(Router);
  private auth = inject(AuthService);

  // Menú de usuario (overlay)
  @ViewChild('userMenu') userMenu!: Menu;
  userItems = [
    { label: 'Mi perfil', icon: 'pi pi-user', command: () => this.go('/configuracion') },
    { label: 'Preferencias', icon: 'pi pi-cog', command: () => this.go('/configuracion') },
    { separator: true },
    { label: 'Cerrar sesión', icon: 'pi pi-sign-out', command: () => this.logout() },
  ];

  // Menú de navegación lateral
  sideModel = [
    { label: 'Inicio', icon: 'pi pi-home', routerLink: '/home' }, // sugerencia: usar /home si es tu ruta protegida
    {
      label: 'Gestión',
      icon: 'pi pi-database',
      items: [
        // agrega acá submenús
      ],
    },
    {
      label: 'Reportes',
      icon: 'pi pi-chart-line',
      items: [
        { label: 'Dashboard', icon: 'pi pi-chart-bar', disabled: true },
      ],
    },
    {
      label: 'Configuración',
      icon: 'pi pi-cog',
      items: [
        { label: 'Usuarios', icon: 'pi pi-users', routerLink: '/usuarios' },
        { label: 'Roles', icon: 'pi pi-id-card', routerLink: '/roles' },
      ],
    },
  ];

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  openUserMenu(event: MouseEvent) {
    this.userMenu.toggle(event);
  }

  go(url: string) {
    this.router.navigateByUrl(url);
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/auth/login', { replaceUrl: true });
  }
}
