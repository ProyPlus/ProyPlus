import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { tap } from "rxjs/operators";

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

@Injectable({ providedIn: "root" })
export class AuthService {
  private http = inject(HttpClient);
  private tokenKey = "auth_token";

  login(username: string, password: string) {
    return this.http.post<LoginResponse>("/api/auth/login", { username, password })
      .pipe(tap(res => { if (res.status && res.jwt) localStorage.setItem(this.tokenKey, res.jwt); }));
  }

  requestPasswordReset(email: string) {
    return this.http.post<ApiResponse>("/api/auth/forgot", { email });
  }

  register(data: { username: string; email: string; password: string }) {
    return this.http.post<ApiResponse>("/api/auth/register", data);
  }

  logout() { localStorage.removeItem(this.tokenKey); }
  get token(): string | null { return localStorage.getItem(this.tokenKey); }
  get isLoggedIn(): boolean { return !!this.token; }
}
