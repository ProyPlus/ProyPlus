import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
  const base = '/api/users'; // pasa por proxy.conf en dev

export interface IPermission { id: number; permissionName: string; }
export interface IRole { id: number; role: string; permissionsList: IPermission[]; }
export interface IUser {
  id?: number;               
  username: string;
  password?: string;
  email: string;
  enabled: boolean;
  accountNotExpired: boolean;
  accountNotLocked: boolean;
  credentialNotExpired: boolean;
  mustChangePassword: boolean;
  rolesList: IRole[];
}
@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);

  getAll(): Observable<IUser[]> {
    return this.http.get<IUser[]>(base);
  }

  
  create(user: IUser): Observable<IUser> {
    return this.http.post<IUser>(base, user);
  }

  // Variante A: si tu backend acepta POST para modificar (upsert):
update(user: any) {
  return this.http.put(`/api/users/${user.id}`, user);
}

}
