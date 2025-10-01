// src/app/core/adapters/users-students-adapter.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

// Usamos las mismas interfaces que tu UsersService para no romper nada
import { IUser, IRole } from '../services/users.service';

@Injectable({ providedIn: 'root' })
export class UsersStudentsAdapterService {
  private http = inject(HttpClient);

  // ✔ Igual que tu PermissionsService: ruta relativa para que pase por proxy.conf
  private readonly base = '/api/students';

  /** DTO Students -> shape de tu UI (IUser) */
  private toUser = (dto: any): IUser => ({
    id: dto?.id ?? 0,
    username: dto?.username ?? '',
    email: dto?.email ?? '',
    enabled: dto?.enabled ?? true,
    accountNotExpired: dto?.accountNotExpired ?? true,
    accountNotLocked: dto?.accountNotLocked ?? true,
    credentialNotExpired: dto?.credentialNotExpired ?? true,
    mustChangePassword: false, // el endpoint no lo trae; default para tu UI
    rolesList: Array.isArray(dto?.roles)
      ? dto.roles.map((r: any) => ({ id: r?.id ?? 0, role: r?.role ?? '' } as IRole))
      : [],
    password: '' // nunca exponer password real
  });

  /** shape de tu UI (IUser) -> body Students */
  private fromUser = (u: Partial<IUser>): any => {
    const body: any = {
      username: u.username,
      email: u.email,
      enabled: u.enabled,
      accountNotExpired: u.accountNotExpired,
      accountNotLocked: u.accountNotLocked,
      credentialNotExpired: u.credentialNotExpired,
      // si tu backend ignora esto, no pasa nada
      mustChangePassword: u.mustChangePassword,
      // Students espera "roles"; tu UI usa rolesList
      roles: (u.rolesList ?? []).map(r => ({ id: r.id }))
    };
    if (u.password && u.password.trim() !== '') {
      body.password = u.password;
    }
    return body;
  };

  /** Mantiene la firma que ya usa tu componente */
  getAll(): Observable<IUser[]> {
    return this.http.get<any[]>(this.base).pipe(
      map(list => (list ?? []).map(this.toUser))
    );
  }

  create(payload: Partial<IUser>): Observable<any> {
    const body = this.fromUser(payload);
    return this.http.post(this.base, body);
  }

  update(payload: Partial<IUser>): Observable<any> {
    const id = payload?.id;
    if (id == null) throw new Error('update requiere ID');
    const body = this.fromUser(payload);
    return this.http.put(`${this.base}/${id}`, body);
  }
}
