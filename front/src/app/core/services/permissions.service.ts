import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface IPermissionDTO {
  id: number;
  permissionName: string;
}

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  // Si NO usás proxy, poné la URL completa:
  private api = '/api/permissions';

  constructor(private http: HttpClient) {}

  getAll(): Observable<IPermissionDTO[]> {
    return this.http.get<IPermissionDTO[]>(this.api);
  }
}
