import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { map, catchError, throwError, Observable } from "rxjs";

interface ResetResponse { message: string; }

const base = "/api/auth"; // pasa por proxy

@Injectable({ providedIn: "root" })
export class ResetPasswordService {
  private http = inject(HttpClient);

  /** Envía token + nueva contraseña al backend */
  reset(token: string, password: string): Observable<{ status: boolean; message: string }> {
    return this.http.post<ResetResponse>(`${base}/reset-password`, { token, password }).pipe(
      map(res => ({ status: true, message: res?.message ?? "Contraseña restablecida con éxito." })),
      catchError((err: HttpErrorResponse) => {
        const msg =
          (err.error && (err.error.message || err.error?.error || err.error?.msg)) ||
          err.message || "Error de comunicación.";
        return throwError(() => new Error(msg));
      })
    );
  }
}
