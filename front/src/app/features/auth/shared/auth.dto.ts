/**
 * DTO para la petición de login.
 * Coincide con `AuthLoginRequestDTO` del backend.
 */
export interface AuthLoginRequest {
  username: string;
  password: string;
}