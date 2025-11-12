// src/app/features/auth/login/auth.service.ts
import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { tap, map, Observable, catchError, throwError } from "rxjs";
import { mapAuthError } from "../shared/auth-errors";
import { AuthLoginRequest } from "../shared/auth.dto";

/** ====== Tipos de API ====== */
interface LoginResponse {
  id: number;            // <-- agregado: ID viene del backend
  username: string;
  email: string; // <-- AÑADIR ESTA LÍNEA
  message: string;
  jwt: string;
  status: boolean;
}
interface ApiResponse {
  status: boolean;
  message?: string;
}

/** ====== Sesión en el front ====== */
export interface Session {
  id: number;            // <-- agregado
  username: string;
  email: string; // <-- AÑADIR ESTA LÍNEA
  roles: string[];
  jwt: string;
  exp: number; // epoch seconds
}

/** ====== Constantes de storage ====== */
const TOKEN_KEY = "auth_token";   // token JWT
const USER_KEY  = "auth_user";    // metadatos de sesión



/** Si tu backend es /auth/login, ajustá esta ruta */
const LOGIN_PATH = "/api/auth/login";

@Injectable({ providedIn: "root" })
export class AuthService {
  private http = inject(HttpClient);

  /** POST login y persiste token + metadatos (incluye id) */
  login(username: string, password: string): Observable<Session> {
    // FIX: Se crea un objeto explícito que coincide con el DTO del backend
    // para evitar problemas de serialización donde los campos se concatenan.
    const payload: AuthLoginRequest = {
      username: username,
      password: password,
    };
    return this.http.post<LoginResponse>(LOGIN_PATH, payload).pipe(
      map((res) => {
        if (!res?.status || !res?.jwt) throw new Error("Login inválido");
        return this.toSession(res);
      }),
      tap((s) => this.persist(s)),
      catchError((err) => throwError(() => mapAuthError(err)))
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

  /** ====== Helpers de sesión ====== */

  /** JWT crudo (o null) */
  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /** ID de usuario persistido (o null) */
  get userId(): number | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) return null;
      const meta = JSON.parse(raw);
      return typeof meta.id === "number" ? meta.id : null;
    } catch {
      return null;
    }
  }

  /** Sesión completa (id, username, roles, exp, jwt) */
  getSession(): Session | null {
    try {
      const jwt = localStorage.getItem(TOKEN_KEY);
      const raw = localStorage.getItem(USER_KEY);
      if (!jwt || !raw) return null;
      const meta = JSON.parse(raw);
      return {
        id: meta.id, // <-- incluido
        username: meta.username,
        email: meta.email ?? '', // <-- AÑADIR ESTA LÍNEA
        roles: meta.roles ?? [],
        exp: meta.exp ?? 0,
        jwt
      };
    } catch {
      return null;
    }
  }

// Devuelve el primer rol (por ejemplo: ROLE_STUDENT o ROLE_INVESTOR) 
getUserRole(): string | null {
  const session = this.getSession();
  if (!session) return null;

  // 🔹 authorities es un string como "CREATE,DELETE,READ,ROLE_STUDENT,UPDATE"
  // buscamos el que empiece con "ROLE_"
  const role = session.roles?.find(r => r.startsWith('ROLE_')) ?? null;
  return role;
}

getUserId(): string | null {
  const session = this.getSession();
  if (!session) return null;
  // 🔹 En tu token, el "sub" es el nombre de usuario
  return session.username || null;
}

  /** ¿Token vigente? (si no hay exp, asume válido) */
  get isLoggedIn(): boolean {
    const s = this.getSession();
    if (!s) return false;
    const now = Math.floor(Date.now() / 1000);
    return s.exp ? now < s.exp : true;
  }

  /** ====== Internos ====== */

  /** Construye la sesión a partir del response (lee id del body) */
  private toSession(res: LoginResponse): Session {
    const jwt = res.jwt;
    const payload: any = decodeJwt(jwt);

    const roles = String(payload?.authorities || "")
      .split(",")
      .map((x: string) => x.trim())
      .filter(Boolean);

    const exp = Number(payload?.exp ?? 0);
    const username = res.username || payload?.sub || "";

    const email = res.email || ''; // <-- AÑADIR ESTA LÍNEA
    // Toma id del response; fallback por si algún día viene en el JWT
    const id =
      typeof (res as any).id === "number"
        ? (res as any).id
        : Number(payload?.uid ?? payload?.user_id ?? NaN);

    if (!Number.isFinite(id)) throw new Error("Login inválido: id ausente");

    return { id, username, email, roles, jwt, exp };
  }

  /** Persiste token + metadatos (incluye id) */
  private persist(s: Session) {
    localStorage.setItem(TOKEN_KEY, s.jwt);
    localStorage.setItem(
      USER_KEY,
      JSON.stringify({
        id: s.id,                // <-- incluido
        email: s.email, // <-- AÑADIR ESTA LÍNEA
        username: s.username,
        roles: s.roles,
        exp: s.exp
      })
    );
  }
}

/** Decodifica JWT (sin verificar firma) para leer claims */
function decodeJwt(token: string): any {
  const parts = token?.split(".") ?? [];
  if (parts.length < 2) return null;
  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  return JSON.parse(json);
}
