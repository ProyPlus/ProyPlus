import { Component, ViewChild, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

import { PanelMenu } from 'primeng/panelmenu';
import { Menu } from 'primeng/menu';
import { Button } from 'primeng/button';
import { MenuItem } from 'primeng/api';

import { ChatbotComponent } from '../features/chatbot/chatbot.component';
import { AuthService } from '../features/auth/login/auth.service';

import { StudentService } from '../core/services/students.service';
import { InvestorService } from '../core/services/investors.service'; 


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
    ChatbotComponent,
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
  ...(this.auth.getSession()?.roles.includes('ROLE_INVESTOR') ? [{ label: 'Mi Perfil', icon: 'pi pi-briefcase', command: () => this.go('/inversor-perfil') } ] : []),
  ...(this.auth.getSession()?.roles.includes('ROLE_STUDENT') ? [ { label: 'Mi Perfil', icon: 'pi pi-book', command: () => this.go('/estudiante-perfil') } ] : []),
  { separator: true },
  { label: 'Cerrar sesión', icon: 'pi pi-sign-out', command: () => this.logout() }
];

  // Hacemos que el menú lateral sea una propiedad que se construye dinámicamente
  sideModel: MenuItem[] = [];

  constructor() {
    this.buildSideMenu();
  }

  private buildSideMenu(): void {
    const session = this.auth.getSession();
    const roles = session?.roles || [];

    const isStudent = roles.includes('ROLE_STUDENT');
    const isInvestor = roles.includes('ROLE_INVESTOR');
    const isAdmin = roles.includes('ROLE_ADMIN');

    const menu: MenuItem[] = [
      { label: 'Inicio', icon: 'pi pi-home', routerLink: '/marquesinas' },
    ];

    // --- Sección de Gestión (Dinámica) ---
    const managementItems: MenuItem[] = [];
    if (isStudent) {
      managementItems.push({ label: 'Crear Proyecto', icon: 'pi pi-plus', routerLink: '/proyectos' });
      managementItems.push({ label: 'Mis Proyectos', icon: 'pi pi-pencil', routerLink: '/misproyectos' });
      managementItems.push({ label: 'Proyectos donde participo', icon: 'pi pi-pencil', routerLink: '/proyectos-participo' });
    }
    if (isInvestor) {
      managementItems.push({ label: 'Mis Inversiones', icon: 'pi pi-dollar', routerLink: '/mis-inversiones' });
      managementItems.push({ label: 'Mis proyectos Invertidos', icon: 'pi pi-briefcase', routerLink: '/mis-proyectos-invertidos' });
      managementItems.push({ label: 'Noticias', icon: 'pi pi-bell', routerLink: '/noticias' });
    }
    // Items comunes para ambos roles logueados
    if (isStudent || isInvestor) {
      managementItems.push({ label: 'Legales', icon: 'pi pi-info-circle', routerLink: '/legales' });
    }

    if (managementItems.length > 0) {
      menu.push({ label: 'Gestión', icon: 'pi pi-database', items: managementItems });
    }

    // --- Sección de Reportes (Ej: solo Admin) ---
    if (isAdmin) {
      menu.push({
        label: 'Reportes',
        icon: 'pi pi-chart-line',
        items: [{ label: 'Dashboard', icon: 'pi pi-home', routerLink: '/dashboard' }]
      });
    }

    if (isAdmin) {
     menu.push({
       label: 'Gestión (Admin)',
       icon: 'pi pi-briefcase',
       items: [
         { label: 'Gestión proyectos', icon: 'pi pi-list', routerLink: '/proyectos-gestion' },
       ]
     });
   }

 
    // --- Sección de Configuración (Ej: solo Admin) ---
    if (isAdmin) {
      menu.push({
        label: 'Configuración',
        icon: 'pi pi-cog',
        items: [
          { label: 'Roles', icon: 'pi pi-id-card', routerLink: '/roles' },
          { label: 'Estudiantes', icon: 'pi pi-users', routerLink: '/estudiantes' },
          { label: 'Inversores', icon: 'pi pi-users', routerLink: '/inversores' }
        ]
      });
    }

    this.sideModel = menu;
  }

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