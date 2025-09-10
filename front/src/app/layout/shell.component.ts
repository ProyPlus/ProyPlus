import { Component, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Menubar } from 'primeng/menubar';
import { PanelMenu } from 'primeng/panelmenu';
import { Menu } from 'primeng/menu';
import { Button } from 'primeng/button';
import { Avatar } from 'primeng/avatar';
import { Badge } from 'primeng/badge';
import { NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink, RouterLinkActive,
    Menubar, PanelMenu, Menu, Button, Avatar, Badge, NgIf, NgClass             
  ],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss']
})
export class ShellComponent {
  sidebarCollapsed = false;

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
    { label: 'Inicio', icon: 'pi pi-home', routerLink: '/' },
    {
      label: 'Gestión',
      icon: 'pi pi-database',
      items: [
       
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
          {label: 'Roles', icon: 'pi pi-id-card', routerLink: '/roles'}
       
      ], },
     
  ];

  constructor(private router: Router) {}

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
    // TODO: integrar con tu auth real
    console.log('logout');
  }
}
