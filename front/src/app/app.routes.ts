// src/app/app.routes.ts
import { Routes } from "@angular/router";
import { authGuard } from "./features/auth/login/auth.guard";

export const routes: Routes = [
  // Públicas (sin guard)
  { path: "auth/login", loadComponent: () => import("./features/auth/login/login.component").then(m => m.LoginComponent) },
  { path: "auth/forgot", loadComponent: () => import("./features/auth/forgot/forgot.component").then(m => m.ForgotComponent) },
  { path: "auth/register", loadComponent: () => import("./features/auth/register/register.component").then(m => m.RegisterComponent) },

  // Protegidas (con guard) usando tu layout de Panel
  {
    path: "",
    canActivate: [authGuard],
    loadComponent: () => import("./features/panel/panel.component").then(m => m.PanelComponent),
    children: [
      { path: "home", loadComponent: () => import("./features/home/home.component").then(m => m.HomeComponent) },
      { path: "usuarios", loadComponent: () => import("./features/usuarios/usuarios.component").then(m => m.UsuariosComponent) },
      { path: "configuracion", loadComponent: () => import("./features/config/configuracion.component").then(m => m.ConfiguracionComponent) },
      { path: "roles", loadComponent: () => import("./features/roles/roles.component").then(m => m.RolesComponent) },
      { path: "", pathMatch: "full", redirectTo: "home" },
    ],
  },

  // Fallback SIEMPRE al final
  { path: "**", redirectTo: "auth/login" },
];
