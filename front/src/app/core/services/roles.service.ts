import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface IPermission {
  id: number;
  permissionName: string;
}

export interface IRole {
  id: number;
  role: string;
  permissionsList: IPermission[];
}

@Injectable({ providedIn: 'root' })
export class RolesService {
  private baseUrl = '/api/roles';


  constructor(private http: HttpClient) {}

  getAll(): Observable<IRole[]> {
    return this.http.get<IRole[]>(this.baseUrl);
  }
}
