// src/app/features/auth/login/auth.service.ts
import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { tap, map, Observable, catchError, throwError } from "rxjs"; // 👈 agrego catchError/throwError
import { mapAuthError } from "../shared/auth-errors";           

interface LoginResponse {
  username: string;
  message: string;
  jwt: string;
  status: boolean;
}
interface ApiResponse {
  status: boolean;
  message?: string;
}

export interface Session {
  username: string;
  roles: string[];
  jwt: string;
  exp: number; // epoch seconds
}

const TOKEN_KEY = "auth_token";   // 👈 mantenemos tu clave
const USER_KEY  = "auth_user";    // 👈 nuevo para metadata

// si tu backend es /auth/login cambiá a '/auth/login'
const LOGIN_PATH = "/api/auth/login";

@Injectable({ providedIn: "root" })
export class AuthService {
  private http = inject(HttpClient);

  /** POST login y persiste token + metadatos */
  login(username: string, password: string): Observable<Session> {
    return this.http.post<LoginResponse>(LOGIN_PATH, { username, password }).pipe(
      map((res) => {
        if (!res?.status || !res?.jwt) throw new Error("Login inválido");
        return this.toSession(res);
      }),
      tap((s) => this.persist(s)),
      catchError((err) => throwError(() => mapAuthError(err))) // 👈 normalizo y re-lanzo tipado
    );
  }

  requestPasswordReset(email: string) {
    return this.http.post<ApiResponse>("/api/auth/forgot", { email });
  }

  register(data: { username: string; email: string; password: string }) {
    return this.http.post<ApiResponse>("/api/auth/register", data);
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  /** === Helpers de sesión === */
  get token(): string | null { return localStorage.getItem(TOKEN_KEY); }

  /** Sesión completa (username, roles, exp, jwt) */
  getSession(): Session | null {
    try {
      const jwt = localStorage.getItem(TOKEN_KEY);
      const raw = localStorage.getItem(USER_KEY);
      if (!jwt || !raw) return null;
      const meta = JSON.parse(raw);
      return { username: meta.username, roles: meta.roles ?? [], exp: meta.exp ?? 0, jwt };
    } catch { return null; }
  }

  get isLoggedIn(): boolean {
    const s = this.getSession();
    if (!s) return false;
    const now = Math.floor(Date.now()/1000);
    return s.exp ? now < s.exp : true;
  }

  /** === Internos === */
  private toSession(res: LoginResponse): Session {
    const jwt = res.jwt;
    const payload: any = decodeJwt(jwt);
    const roles = String(payload?.authorities || '')
      .split(',')
      .map((x: string) => x.trim())
      .filter(Boolean);
    const exp = Number(payload?.exp ?? 0);
    const username = res.username || payload?.sub || '';
    return { username, roles, jwt, exp };
  }

  private persist(s: Session) {
    localStorage.setItem(TOKEN_KEY, s.jwt);
    localStorage.setItem(USER_KEY, JSON.stringify({ username: s.username, roles: s.roles, exp: s.exp }));
  }
}

/** Decodifica JWT (sin verificar firma) para leer claims */
function decodeJwt(token: string): any {
  const parts = token?.split('.') ?? [];
  if (parts.length < 2) return null;
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
  return JSON.parse(json);
}
