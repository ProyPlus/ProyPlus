import { HttpErrorResponse } from "@angular/common/http";

export type AuthErrorCode =
  | "invalid_credentials"
  | "account_locked"
  | "password_expired"
  | "server_error"
  | "network_error"
  | "unknown";

export interface AuthError {
  code: AuthErrorCode;
  title: string;     // mensaje corto para banner
  detail?: string;   // detalle opcional del backend
  status?: number;   // HTTP status
}

export function mapAuthError(err: unknown): AuthError {
  // Errores de HTTP
  if (err instanceof HttpErrorResponse) {
    const status = err.status;
    // El backend te manda: { message, httpStatus, timestamp }
    const backendMsg: string | undefined =
      (err.error && (err.error.message || err.error?.error || err.error?.msg)) || err.message;

    if (status === 0) {
      return {
        code: "network_error",
        title: "No se pudo conectar con el servidor.",
        detail: "Verificá tu conexión o intentá de nuevo.",
        status
      };
    }
    if (status === 401) {
      return {
        code: "invalid_credentials",
        title: "Usuario o contraseña inválidos.",
        detail: backendMsg,
        status
      };
    }
    if (status === 423) {
      return {
        code: "account_locked",
        title: "Tu cuenta está bloqueada.",
        detail: backendMsg,
        status
      };
    }
    if (status === 403) {
      return {
        code: "password_expired",
        title: "Tu contraseña expiró.",
        detail: backendMsg,
        status
      };
    }
    return {
      code: "server_error",
      title: "Ocurrió un error inesperado.",
      detail: backendMsg,
      status
    };
  }

  // Cualquier otra cosa
  return {
    code: "unknown",
    title: "No pudimos procesar tu solicitudxxxxx.",
  };
}
