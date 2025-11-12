import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';

export interface PlatformStats {
  projects: number;
  students: number;
  investors: number;
}

@Injectable({
  providedIn: 'root'
})
export class LandingPageService {
  private http = inject(HttpClient);

  getPlatformStats(): Observable<PlatformStats> {
    // Idealmente, el backend debería tener un único endpoint para esto.
    // Por ahora, usamos los endpoints existentes para obtener los conteos.
    const projects$ = this.http.get<any[]>('/api/projects');
    const students$ = this.http.get<any[]>('/api/students');
    const investors$ = this.http.get<any[]>('/api/investors');

    return forkJoin([projects$, students$, investors$]).pipe(
      map(([projects, students, investors]) => ({
        projects: projects.length,
        students: students.length,
        investors: investors.length,
      }))
    );
  }
}